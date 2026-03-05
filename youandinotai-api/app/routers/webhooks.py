"""Stripe webhook router with signature verification and audit logging."""

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
import stripe
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models import User, WebhookEvent
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


def _normalize_tier(raw_tier: str | None) -> str | None:
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


def _extract_checkout_tier(session_obj: dict[str, Any]) -> str | None:
    metadata = session_obj.get("metadata") or {}
    if isinstance(metadata, dict):
        explicit_tier = _normalize_tier(
            metadata.get("subscription_tier") or metadata.get("tier")
        )
        if explicit_tier:
            return explicit_tier

    mode = session_obj.get("mode")
    if mode == "subscription":
        return "founding_member"

    amount_cents = session_obj.get("amount_total")
    if amount_cents is None:
        amount_cents = session_obj.get("amount_subtotal")

    if amount_cents == BOT_SHIELD_CENTS:
        return "bot_shield"
    if amount_cents == ROYALTY_CARD_CENTS:
        return "royalty"

    return None


def _extract_subscription_tier(subscription_obj: dict[str, Any]) -> str:
    metadata = subscription_obj.get("metadata") or {}
    if isinstance(metadata, dict):
        explicit_tier = _normalize_tier(
            metadata.get("subscription_tier") or metadata.get("tier")
        )
        if explicit_tier:
            return explicit_tier

    return "founding_member"


async def _get_user_by_customer_id(
    db: AsyncSession,
    customer_id: str | None,
) -> User | None:
    if not customer_id:
        return None
    return await db.scalar(select(User).where(User.stripe_customer_id == customer_id))


def _utc_now_iso() -> str:
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z")
    )


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


def _verify_square_signature(
    payload: bytes,
    square_signature: str | None,
    settings: Any,
) -> None:
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


@router.post("/stripe", response_model=WebhookAckResponse)
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
    db: AsyncSession = Depends(get_db),
) -> WebhookAckResponse:
    settings = get_settings()

    if not settings.stripe_secret_key or not settings.stripe_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe webhook is not configured.",
        )

    if not stripe_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe-Signature header.",
        )

    payload = await request.body()
    if len(payload) > MAX_WEBHOOK_PAYLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Webhook payload exceeds size limit.",
        )

    stripe.api_key = settings.stripe_secret_key

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=settings.stripe_webhook_secret,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    try:
        payload_json = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook payload must be valid JSON.",
        ) from exc

    event_id = str(event.get("id") or "")
    if not event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook event missing required id.",
        )

    event_type = event.get("type", "unknown")
    obj = (event.get("data") or {}).get("object") or {}

    duplicate = await db.scalar(
        select(WebhookEvent).where(WebhookEvent.stripe_event_id == event_id)
    )
    if duplicate:
        return WebhookAckResponse(event_id=event_id, processed=True, duplicate=True)

    webhook_event = WebhookEvent(
        stripe_event_id=event_id,
        event_type=event_type,
        payload=payload_json,
        processed=False,
    )
    db.add(webhook_event)

    customer_id = obj.get("customer")
    user = await _get_user_by_customer_id(db, customer_id)

    if event_type == "checkout.session.completed":
        checkout_tier = _extract_checkout_tier(obj)
        if user and checkout_tier:
            if checkout_tier in {"bot_shield", "royalty"}:
                user.bot_shield_verified = True
                user.subscription_tier = checkout_tier
            elif checkout_tier in {"founding_member", "3_month", "12_month"}:
                user.subscription_tier = checkout_tier
                user.subscription_active = True
        elif customer_id:
            logger.warning(
                "checkout.session.completed for unknown customer_id=%s event_id=%s",
                customer_id,
                event_id,
            )

    elif event_type == "customer.subscription.created":
        subscription_tier = _extract_subscription_tier(obj)
        if user:
            user.subscription_tier = subscription_tier
            user.subscription_active = True
        elif customer_id:
            logger.warning(
                "customer.subscription.created for unknown customer_id=%s event_id=%s",
                customer_id,
                event_id,
            )

    elif event_type in {"customer.subscription.deleted", "invoice.payment_failed"}:
        if user:
            user.subscription_active = False

    webhook_event.processed = True

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        return WebhookAckResponse(event_id=event_id, processed=True, duplicate=True)

    return WebhookAckResponse(event_id=event_id, processed=True, duplicate=False)


@router.post("/square-booking", response_model=WebhookAckResponse)
async def square_booking_webhook(
    request: Request,
    square_signature: str | None = Header(
        default=None, alias="x-square-hmacsha256-signature"
    ),
) -> WebhookAckResponse:
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
