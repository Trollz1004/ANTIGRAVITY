"""Square webhook router with signature verification and audit logging.

Iron Wall Migration: Stripe removed. Square is the sole payment processor.
All payment webhooks now flow through Square.

Webhook endpoints:
  POST /webhooks/square-payment  — Bot-Shield $1 payments + subscription purchases
  POST /webhooks/square-booking  — E-waste booking events (OnlineRecycle.org)
"""

from __future__ import annotations

import base64
import csv
import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models import User, VerificationEvent, WebhookEvent
from app.schemas import WebhookAckResponse

router = APIRouter(prefix="/webhooks")
logger = logging.getLogger(__name__)

MAX_WEBHOOK_PAYLOAD_BYTES = 512_000
BOT_SHIELD_CENTS = 100
ROYALTY_CARD_CENTS = 250_000
REPO_ROOT = Path(__file__).resolve().parents[3]
CONTAINER_EWASTE_MOUNT = Path("/app/ewaste-intake-data")
SQUARE_EVENT_ID_INDEX = "square-booking-event-ids.txt"
SQUARE_EVENT_JSONL = "square-bookings-events.jsonl"
SQUARE_EVENT_CSV = "square-bookings-intake-log.csv"
SQUARE_CSV_FIELDS = [
    "received_at_utc",
    "event_id",
    "event_type",
    "event_created_at",
    "merchant_id",
    "booking_id",
    "booking_status",
    "start_at",
    "location_id",
    "customer_id",
    "customer_phone",
    "customer_email",
    "customer_note",
    "source",
]


# ── Shared Utilities ──


def _utc_now_iso() -> str:
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z")
    )


def _verify_square_signature(
    payload: bytes,
    square_signature: str | None,
    settings: Any,
) -> None:
    """Verify Square webhook HMAC-SHA256 signature."""
    if not settings.square_webhook_verify_signature:
        return

    signature_key = str(settings.square_webhook_signature_key or "").strip()
    notification_url = str(settings.square_webhook_notification_url or "").strip()

    if not signature_key or not notification_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Square webhook signature verification is enabled but not configured.",
        )

    if not square_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing x-square-hmacsha256-signature header.",
        )

    body_text = payload.decode("utf-8", errors="replace")
    signed_payload = (notification_url + body_text).encode("utf-8")
    digest = hmac.new(
        signature_key.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).digest()
    expected_signature = base64.b64encode(digest).decode("utf-8")
    provided_signature = square_signature.strip()

    if not hmac.compare_digest(expected_signature, provided_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Square webhook signature.",
        )


def _normalize_tier(raw_tier: str | None) -> str | None:
    """Normalize subscription tier names to canonical form."""
    if not raw_tier:
        return None
    normalized = raw_tier.strip().lower().replace("-", "_")
    aliases = {
        "botshield": "bot_shield",
        "bot_shield": "bot_shield",
        "royalty": "royalty",
        "royalty_card": "royalty",
        "founding_member": "founding_member",
        "foundingmember": "founding_member",
        "3_month": "3_month",
        "12_month": "12_month",
    }
    return aliases.get(normalized)


# ── Square Payment Webhook (Bot-Shield + Subscriptions) ──


def _extract_square_payment_tier(payment_obj: dict[str, Any]) -> str | None:
    """Extract the subscription tier from a Square payment event.

    Checks:
      1. note field for tier keywords
      2. amount_money for known price points ($1 = bot_shield, $14.99 = founding_member)
      3. order metadata if available
    """
    # Check note/description for tier keywords
    note = str(payment_obj.get("note") or payment_obj.get("description") or "").lower()
    for keyword, tier in [
        ("bot-shield", "bot_shield"),
        ("bot shield", "bot_shield"),
        ("botshield", "bot_shield"),
        ("founding member", "founding_member"),
        ("founding_member", "founding_member"),
        ("subscription", "founding_member"),
        ("royalty", "royalty"),
    ]:
        if keyword in note:
            return tier

    # Check amount for known price points
    amount_money = payment_obj.get("amount_money") or {}
    amount_cents = amount_money.get("amount")
    if amount_cents is not None:
        if amount_cents == BOT_SHIELD_CENTS:
            return "bot_shield"
        if amount_cents == 1499:  # $14.99 Founding Member
            return "founding_member"
        if amount_cents == ROYALTY_CARD_CENTS:
            return "royalty"

    # Check order reference metadata
    order_id = payment_obj.get("order_id")
    if order_id:
        # Order metadata would need a Square API call to resolve
        # For now, fall back to amount-based detection
        pass

    return None


def _extract_square_customer_email(payment_obj: dict[str, Any]) -> str | None:
    """Extract customer email from Square payment event."""
    # Check buyer_email_address first (most common)
    email = payment_obj.get("buyer_email_address")
    if email:
        return str(email).strip().lower()

    # Check receipt_url for email parameter
    receipt_url = payment_obj.get("receipt_url") or ""
    if "email=" in receipt_url:
        try:
            from urllib.parse import parse_qs, urlparse
            parsed = urlparse(receipt_url)
            params = parse_qs(parsed.query)
            if "email" in params:
                return str(params["email"][0]).strip().lower()
        except Exception:
            pass

    return None


async def _get_user_by_email(
    db: AsyncSession,
    email: str | None,
) -> User | None:
    """Look up user by email address."""
    if not email:
        return None
    return await db.scalar(
        select(User).where(User.email == email.strip().lower())
    )


async def _get_user_by_square_customer_id(
    db: AsyncSession,
    customer_id: str | None,
) -> User | None:
    """Look up user by Square customer ID."""
    if not customer_id:
        return None
    return await db.scalar(
        select(User).where(User.square_customer_id == customer_id)
    )


@router.post("/square-payment", response_model=WebhookAckResponse)
async def square_payment_webhook(
    request: Request,
    square_signature: str | None = Header(
        default=None, alias="x-square-hmacsha256-signature"
    ),
    db: AsyncSession = Depends(get_db),
) -> WebhookAckResponse:
    """Handle Square payment webhooks for Bot-Shield and subscription purchases.

    Processes:
      - payment.completed → Bot-Shield $1 verification + subscription purchases
      - payment.updated → Status changes
      - subscription.created → New subscriptions
      - subscription.updated → Subscription changes (cancellation, renewal)

    Iron Wall enforcement:
      - Creates a 'payment' VerificationEvent on successful Bot-Shield payment
      - Updates user.bot_shield_verified and subscription_active flags
      - Same tier logic as the retired payment handler, now wired to Square
    """
    settings = get_settings()
    payload = await request.body()

    if len(payload) > MAX_WEBHOOK_PAYLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Webhook payload exceeds size limit.",
        )

    _verify_square_signature(payload, square_signature, settings)

    try:
        payload_json = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook payload must be valid JSON.",
        ) from exc

    event_id = str(
        payload_json.get("event_id")
        or payload_json.get("id")
        or ""
    ).strip()
    if not event_id:
        event_id = f"square-pay-{hashlib.sha256(payload).hexdigest()[:20]}"

    event_type = str(
        payload_json.get("type")
        or payload_json.get("event_type")
        or "unknown"
    )

    # Deduplicate
    duplicate = await db.scalar(
        select(WebhookEvent).where(WebhookEvent.event_source_id == event_id)
    )
    if duplicate:
        return WebhookAckResponse(event_id=event_id, processed=True, duplicate=True)

    # Extract payment object from Square event structure
    data = payload_json.get("data") or {}
    obj = data.get("object") or {}
    payment_obj = obj.get("payment") or obj

    # Log the webhook event
    webhook_event = WebhookEvent(
        event_source_id=event_id,
        event_source="square",
        event_type=event_type,
        payload=payload_json,
        processed=False,
    )
    db.add(webhook_event)

    # Resolve user from Square customer ID or email
    customer_id = str(payment_obj.get("customer_id") or "").strip() or None
    buyer_email = _extract_square_customer_email(payment_obj)
    user = await _get_user_by_square_customer_id(db, customer_id)
    if not user and buyer_email:
        user = await _get_user_by_email(db, buyer_email)

    # Link Square customer ID to user for future lookups
    if user and customer_id and not user.square_customer_id:
        user.square_customer_id = customer_id

    # Process based on event type
    if event_type in ("payment.completed", "payment.created"):
        payment_status = str(payment_obj.get("status") or "").upper()
        if payment_status == "COMPLETED":
            tier = _extract_square_payment_tier(payment_obj)

            if user and tier:
                if tier in {"bot_shield", "royalty"}:
                    # Mark user as Bot-Shield verified
                    user.bot_shield_verified = True
                    user.subscription_tier = tier

                    # Create a 'payment' VerificationEvent so /verify/confirm works
                    payment_event = VerificationEvent(
                        user_id=user.id,
                        challenge_type="payment",
                        status="completed",
                        amount_cents=payment_obj.get("amount_money", {}).get("amount", BOT_SHIELD_CENTS),
                        square_payment_id=str(payment_obj.get("id") or event_id),
                    )
                    db.add(payment_event)

                    logger.info(
                        "Bot-Shield payment completed: user=%s tier=%s event=%s",
                        user.id, tier, event_id,
                    )

                elif tier in {"founding_member", "3_month", "12_month"}:
                    # Activate subscription
                    user.subscription_tier = tier
                    user.subscription_active = True

                    # Also create payment verification event
                    payment_event = VerificationEvent(
                        user_id=user.id,
                        challenge_type="payment",
                        status="completed",
                        amount_cents=payment_obj.get("amount_money", {}).get("amount"),
                        square_payment_id=str(payment_obj.get("id") or event_id),
                    )
                    db.add(payment_event)

                    logger.info(
                        "Subscription payment completed: user=%s tier=%s event=%s",
                        user.id, tier, event_id,
                    )

            elif not user:
                logger.warning(
                    "Square payment.completed for unknown customer: "
                    "customer_id=%s email=%s event_id=%s",
                    customer_id, buyer_email, event_id,
                )

    elif event_type == "subscription.created":
        if user:
            user.subscription_active = True
            user.subscription_tier = "founding_member"
            logger.info(
                "Square subscription created: user=%s event=%s",
                user.id, event_id,
            )

    elif event_type in ("subscription.updated",):
        # Check if subscription was cancelled
        subscription = obj.get("subscription") or obj
        sub_status = str(subscription.get("status") or "").upper()
        if user:
            if sub_status in ("CANCELED", "DEACTIVATED", "PAUSED"):
                user.subscription_active = False
                logger.info(
                    "Square subscription deactivated: user=%s status=%s event=%s",
                    user.id, sub_status, event_id,
                )
            elif sub_status == "ACTIVE":
                user.subscription_active = True

    webhook_event.processed = True

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        return WebhookAckResponse(event_id=event_id, processed=True, duplicate=True)

    return WebhookAckResponse(event_id=event_id, processed=True, duplicate=False)


# ── Square Booking Webhook (E-Waste / OnlineRecycle.org) ──


def _resolve_square_log_dir(settings: Any) -> Path:
    configured = str(getattr(settings, "square_booking_log_dir", "") or "").strip()
    if configured:
        configured_path = Path(configured)
        if configured_path.is_absolute():
            return configured_path
        return REPO_ROOT / configured_path
    if CONTAINER_EWASTE_MOUNT.exists():
        return CONTAINER_EWASTE_MOUNT / "bookings"
    return REPO_ROOT / "data" / "ewaste-intake" / "bookings"


def _load_square_booking(payload_json: dict[str, Any]) -> dict[str, Any]:
    data = payload_json.get("data")
    if isinstance(data, dict):
        obj = data.get("object")
        if isinstance(obj, dict):
            booking = obj.get("booking")
            if isinstance(booking, dict):
                return booking
            if any(
                key in obj
                for key in ("id", "status", "start_at", "location_id", "customer_id")
            ):
                return obj
        booking = data.get("booking")
        if isinstance(booking, dict):
            return booking
    booking = payload_json.get("booking")
    if isinstance(booking, dict):
        return booking
    return {}


def _append_square_logs(
    event_id: str,
    payload_json: dict[str, Any],
    log_dir: Path,
) -> None:
    log_dir.mkdir(parents=True, exist_ok=True)

    booking = _load_square_booking(payload_json)
    customer_details = booking.get("customer_details")
    if not isinstance(customer_details, dict):
        customer_details = {}

    record = {
        "received_at_utc": _utc_now_iso(),
        "event_id": event_id,
        "event_type": str(
            payload_json.get("type")
            or payload_json.get("event_type")
            or payload_json.get("name")
            or "unknown"
        ),
        "event_created_at": str(
            payload_json.get("created_at")
            or payload_json.get("event_created_at")
            or ""
        ),
        "merchant_id": str(payload_json.get("merchant_id") or ""),
        "booking_id": str(booking.get("id") or ""),
        "booking_status": str(booking.get("status") or ""),
        "start_at": str(booking.get("start_at") or ""),
        "location_id": str(
            booking.get("location_id")
            or payload_json.get("location_id")
            or ""
        ),
        "customer_id": str(
            booking.get("customer_id")
            or customer_details.get("customer_id")
            or ""
        ),
        "customer_phone": str(
            customer_details.get("phone")
            or booking.get("customer_phone")
            or ""
        ),
        "customer_email": str(
            customer_details.get("email_address")
            or booking.get("customer_email")
            or ""
        ),
        "customer_note": str(
            booking.get("customer_note")
            or booking.get("notes")
            or ""
        ),
        "source": "square_webhook",
    }

    event_jsonl = log_dir / SQUARE_EVENT_JSONL
    with event_jsonl.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"record": record, "payload": payload_json}) + "\n")

    event_csv = log_dir / SQUARE_EVENT_CSV
    csv_exists = event_csv.exists()
    with event_csv.open("a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=SQUARE_CSV_FIELDS)
        if not csv_exists:
            writer.writeheader()
        writer.writerow(record)


def _is_duplicate_square_event(event_id: str, log_dir: Path) -> bool:
    if not event_id:
        return False
    index_file = log_dir / SQUARE_EVENT_ID_INDEX
    if not index_file.exists():
        return False
    try:
        with index_file.open("r", encoding="utf-8") as f:
            for line in f:
                if line.strip() == event_id:
                    return True
    except OSError:
        return False
    return False


def _mark_square_event_processed(event_id: str, log_dir: Path) -> None:
    if not event_id:
        return
    log_dir.mkdir(parents=True, exist_ok=True)
    index_file = log_dir / SQUARE_EVENT_ID_INDEX
    with index_file.open("a", encoding="utf-8") as f:
        f.write(f"{event_id}\n")


@router.post("/square-booking", response_model=WebhookAckResponse)
async def square_booking_webhook(
    request: Request,
    square_signature: str | None = Header(
        default=None, alias="x-square-hmacsha256-signature"
    ),
) -> WebhookAckResponse:
    """Handle Square booking webhooks for e-waste pickups (OnlineRecycle.org)."""
    settings = get_settings()
    payload = await request.body()

    if len(payload) > MAX_WEBHOOK_PAYLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Webhook payload exceeds size limit.",
        )

    _verify_square_signature(payload, square_signature, settings)

    try:
        payload_json = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook payload must be valid JSON.",
        ) from exc

    event_id = str(payload_json.get("event_id") or payload_json.get("id") or "").strip()
    if not event_id:
        event_id = f"square-{hashlib.sha256(payload).hexdigest()[:20]}"

    log_dir = _resolve_square_log_dir(settings)
    if _is_duplicate_square_event(event_id, log_dir):
        return WebhookAckResponse(event_id=event_id, processed=True, duplicate=True)

    _append_square_logs(event_id, payload_json, log_dir)
    _mark_square_event_processed(event_id, log_dir)

    return WebhookAckResponse(event_id=event_id, processed=True, duplicate=False)
