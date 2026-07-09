"""Square webhook router with signature verification and audit logging.

Iron Wall Migration: Stripe removed. Square is the sole payment processor.
All payment webhooks now flow through Square.

Webhook endpoints:
  POST /webhooks/square-payment  — Bot-Shield $1 payments + subscription purchases
  POST /webhooks/square-booking  — E-waste booking events (OnlineRecycle.net)
"""

from __future__ import annotations

import base64
import csv
import hashlib
import hmac
import json
import logging
from collections.abc import Iterable
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.email_service import send_welcome_email
from app.models import User, VerificationEvent
from app.payment_truth import (
    extract_checkout_reference,
    extract_payment_proof_label,
    infer_payment_tier,
    iter_text_hints,
    parse_checkout_reference,
)
from app.revenue_allocation import reserve_revenue_allocation
from app.schemas import WebhookAckResponse
from app.subscriptions import build_subscription_expiry, utc_now
from app.verification_service import promote_user_verification_if_ready
from app.webhook_event_store import (
    create_webhook_event,
    mark_webhook_event_processed,
    webhook_event_exists,
)

router = APIRouter(prefix="/webhooks")
logger = logging.getLogger(__name__)

MAX_WEBHOOK_PAYLOAD_BYTES = 512_000
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
        datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    )


def _verify_square_signature(
    payload: bytes,
    square_signature: str | None,
    *,
    signature_key: str,
    notification_url: str,
    request_url: str | None = None,
) -> None:
    """Verify Square webhook HMAC-SHA256 signature."""
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
    provided_signature = square_signature.strip()
    candidate_urls = [notification_url]
    request_url = (request_url or "").strip()
    if request_url and request_url not in candidate_urls:
        candidate_urls.append(request_url)

    for candidate_url in candidate_urls:
        signed_payload = (candidate_url + body_text).encode("utf-8")
        digest = hmac.new(
            signature_key.encode("utf-8"),
            signed_payload,
            hashlib.sha256,
        ).digest()
        expected_signature = base64.b64encode(digest).decode("utf-8")
        if hmac.compare_digest(expected_signature, provided_signature):
            return

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid Square webhook signature.",
    )


def _resolve_square_signature_material(
    settings: Any,
    endpoint: str,
) -> tuple[str, str]:
    """Resolve endpoint-specific Square webhook config with legacy fallback."""
    if endpoint == "payment":
        signature_key = str(
            getattr(settings, "square_payment_webhook_signature_key", "")
            or getattr(settings, "square_webhook_signature_key", "")
            or ""
        ).strip()
        notification_url = str(
            getattr(settings, "square_payment_webhook_notification_url", "")
            or getattr(settings, "square_webhook_notification_url", "")
            or ""
        ).strip()
        return signature_key, notification_url

    if endpoint == "booking":
        signature_key = str(
            getattr(settings, "square_booking_webhook_signature_key", "")
            or getattr(settings, "square_webhook_signature_key", "")
            or ""
        ).strip()
        notification_url = str(
            getattr(settings, "square_booking_webhook_notification_url", "")
            or getattr(settings, "square_webhook_notification_url", "")
            or ""
        ).strip()
        return signature_key, notification_url

    raise ValueError(f"Unsupported Square webhook endpoint: {endpoint}")


def _should_verify_square_signature(
    settings: Any,
    endpoint: str,
) -> tuple[bool, str, str]:
    """Skip verification safely when a node is missing Square webhook material."""
    signature_key, notification_url = _resolve_square_signature_material(
        settings, endpoint
    )
    if not settings.square_webhook_verify_signature:
        return False, signature_key, notification_url
    if signature_key and notification_url:
        return True, signature_key, notification_url

    logger.warning(
        "Square %s webhook signature verification skipped because configuration is incomplete.",
        endpoint,
    )
    return False, signature_key, notification_url


# ── Square Payment Webhook (Bot-Shield + Subscriptions) ──


def _square_api_headers(settings: Any) -> dict[str, str] | None:
    access_token = str(getattr(settings, "square_access_token", "") or "").strip()
    if not access_token:
        return None
    return {
        "Authorization": f"Bearer {access_token}",
        "Square-Version": str(
            getattr(settings, "square_api_version", "2026-01-22") or "2026-01-22"
        ),
        "Content-Type": "application/json",
    }


async def _fetch_square_order(
    order_id: str | None,
    settings: Any,
) -> dict[str, Any] | None:
    if not order_id:
        return None
    headers = _square_api_headers(settings)
    if not headers:
        return None

    api_base_url = str(
        getattr(settings, "square_api_base_url", "https://connect.squareup.com")
        or "https://connect.squareup.com"
    ).rstrip("/")
    try:
        async with httpx.AsyncClient(base_url=api_base_url, timeout=10.0) as client:
            response = await client.get(f"/v2/orders/{order_id}", headers=headers)
        response.raise_for_status()
        payload_json = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning(
            "Square order lookup failed: order_id=%s error=%s", order_id, exc
        )
        return None

    order = payload_json.get("order")
    return order if isinstance(order, dict) else None


def _extract_square_payment_tier(
    payment_obj: dict[str, Any],
    *,
    order_obj: dict[str, Any] | None = None,
    extra_hints: Iterable[object] = (),
) -> str | None:
    """Extract the canonical tier from payment evidence and fail closed on drift."""
    amount_money = payment_obj.get("amount_money") or {}
    amount_cents = amount_money.get("amount")
    order_line_items = []
    if isinstance(order_obj, dict):
        order_line_items = order_obj.get("line_items") or []

    text_hints = [
        payment_obj.get("note"),
        payment_obj.get("description"),
        payment_obj.get("reference_id"),
        order_obj.get("reference_id") if isinstance(order_obj, dict) else None,
        (
            order_obj.get("source", {}).get("name")
            if isinstance(order_obj, dict)
            else None
        ),
        *order_line_items,
        *extra_hints,
    ]
    return infer_payment_tier(amount_cents=amount_cents, text_hints=text_hints)


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
    return await db.scalar(select(User).where(User.email == email.strip().lower()))


async def _get_user_by_square_customer_id(
    db: AsyncSession,
    customer_id: str | None,
) -> User | None:
    """Look up user by Square customer ID."""
    if not customer_id:
        return None
    return await db.scalar(select(User).where(User.square_customer_id == customer_id))


async def _get_existing_payment_verification_event(
    db: AsyncSession,
    *,
    payment_id: str | None,
) -> VerificationEvent | None:
    if not payment_id:
        return None
    return await db.scalar(
        select(VerificationEvent)
        .where(VerificationEvent.challenge_type == "payment")
        .where(VerificationEvent.square_payment_id == payment_id)
        .order_by(VerificationEvent.created_at.desc())
    )


async def _get_user_by_checkout_reference(
    db: AsyncSession,
    checkout_ref: str | None,
    *,
    settings: Any,
) -> tuple[User | None, VerificationEvent | None, dict[str, Any] | None]:
    """Resolve the user and liveness event from a signed checkout reference."""
    checkout_data = parse_checkout_reference(
        checkout_ref,
        secret=settings.jwt_secret,
    )
    if not checkout_data:
        return None, None, None

    verification_event = await db.scalar(
        select(VerificationEvent)
        .where(VerificationEvent.id == checkout_data["event_id"])
        .where(VerificationEvent.user_id == checkout_data["user_id"])
        .order_by(VerificationEvent.created_at.desc())
    )
    if not verification_event:
        return None, None, checkout_data

    user = await db.scalar(select(User).where(User.id == checkout_data["user_id"]))
    return user, verification_event, checkout_data


def _bot_shield_binding_is_valid(
    *,
    checkout_data: dict[str, Any] | None,
    liveness_event: VerificationEvent | None,
) -> bool:
    if not checkout_data or not liveness_event:
        return False
    if checkout_data.get("tier") != "bot_shield":
        return False
    if liveness_event.challenge_type != "liveness":
        return False
    if liveness_event.status != "passed":
        return False
    return True


@router.post("/square", response_model=WebhookAckResponse)
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

    should_verify, signature_key, notification_url = _should_verify_square_signature(
        settings,
        "payment",
    )
    if should_verify:
        try:
            _verify_square_signature(
                payload,
                square_signature,
                signature_key=signature_key,
                notification_url=notification_url,
                request_url=str(request.url).split("?", 1)[0],
            )
        except HTTPException as exc:
            try:
                payload_json = json.loads(payload.decode("utf-8"))
            except Exception:
                payload_json = {
                    "raw_payload": payload.decode("utf-8", errors="replace")
                }
            event_id = f"sigfail-{hashlib.sha256(payload).hexdigest()[:15]}"

            await create_webhook_event(
                db,
                event_id=event_id,
                event_type="verification_failed",
                payload={
                    "error": str(exc.detail),
                    "url": str(request.url),
                    "headers": dict(request.headers),
                    "payload": payload_json,
                },
                processed=True,
                event_source="square",
            )
            await db.commit()
            raise exc

    try:
        payload_json = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook payload must be valid JSON.",
        ) from exc

    event_id = str(payload_json.get("event_id") or payload_json.get("id") or "").strip()
    if not event_id:
        event_id = f"square-pay-{hashlib.sha256(payload).hexdigest()[:20]}"

    event_type = str(
        payload_json.get("type") or payload_json.get("event_type") or "unknown"
    )

    # Deduplicate
    if await webhook_event_exists(db, event_id):
        return WebhookAckResponse(event_id=event_id, processed=True, duplicate=True)

    # Extract payment object from Square event structure
    data = payload_json.get("data") or {}
    obj = data.get("object") or {}
    payment_obj = obj.get("payment") or obj
    order_id = str(payment_obj.get("order_id") or "").strip() or None
    order_obj = await _fetch_square_order(order_id, settings)

    # Log the webhook event
    await create_webhook_event(
        db,
        event_id=event_id,
        event_type=event_type,
        payload=payload_json,
        processed=False,
        event_source="square",
    )

    # Resolve user from signed checkout ref first, then Square customer/email fallbacks.
    checkout_ref = extract_checkout_reference(
        str(payment_obj.get("note") or ""),
        str(payment_obj.get("reference_id") or ""),
        str(order_obj.get("reference_id") or "") if isinstance(order_obj, dict) else "",
    )
    user, bound_event, checkout_data = await _get_user_by_checkout_reference(
        db,
        checkout_ref,
        settings=settings,
    )

    customer_id = str(payment_obj.get("customer_id") or "").strip() or None
    buyer_email = _extract_square_customer_email(payment_obj)
    if not user:
        user = await _get_user_by_square_customer_id(db, customer_id)
    if not user and buyer_email:
        user = await _get_user_by_email(db, buyer_email)

    # Link Square customer ID to user for future lookups
    if user and customer_id and not user.square_customer_id:
        user.square_customer_id = customer_id

    # Process based on event type
    if event_type in ("payment.created", "payment.updated"):
        payment_status = str(payment_obj.get("status") or "").upper()
        if payment_status == "COMPLETED":
            payment_amount_cents = payment_obj.get("amount_money", {}).get("amount")
            payment_id = str(payment_obj.get("id") or event_id)
            tier = _extract_square_payment_tier(
                payment_obj,
                order_obj=order_obj,
                extra_hints=(checkout_data or {}, obj),
            )
            proof_label = extract_payment_proof_label(payment_obj)
            observed_at = utc_now()

            await reserve_revenue_allocation(
                db,
                user_id=user.id if user else None,
                source_event_id=event_id,
                square_payment_id=payment_id,
                payment_tier=tier,
                gross_amount_cents=payment_amount_cents,
            )

            if user and tier:
                if tier == "royalty":
                    if (
                        bound_event
                        and checkout_data
                        and checkout_data.get("tier") == tier
                    ):
                        bound_event.status = "completed"
                        bound_event.completed_at = observed_at
                        bound_event.square_payment_id = payment_id
                        bound_event.amount_cents = payment_amount_cents
                    user.subscription_tier = tier
                    user.subscription_expires_at = None
                    logger.info(
                        "Royalty payment completed: user=%s event=%s proof=%s",
                        user.id,
                        event_id,
                        proof_label,
                    )
                elif tier in {"founding_member", "3_month", "12_month"}:
                    user.subscription_tier = tier
                    user.subscription_active = True
                    user.subscription_expires_at = build_subscription_expiry(
                        tier,
                        activated_at=observed_at,
                    )
                    if (
                        bound_event
                        and checkout_data
                        and checkout_data.get("tier") == tier
                    ):
                        bound_event.status = "completed"
                        bound_event.completed_at = observed_at
                        bound_event.square_payment_id = payment_id
                        bound_event.amount_cents = payment_amount_cents
                    logger.info(
                        "Subscription payment completed: user=%s tier=%s event=%s proof=%s",
                        user.id,
                        tier,
                        event_id,
                        proof_label,
                    )
                elif (
                    _bot_shield_binding_is_valid(
                        checkout_data=checkout_data,
                        liveness_event=bound_event,
                    )
                    and payment_amount_cents == 100
                ):
                    existing_payment_event = (
                        await _get_existing_payment_verification_event(
                            db,
                            payment_id=payment_id,
                        )
                    )
                    if not existing_payment_event:
                        payment_event = VerificationEvent(
                            user_id=user.id,
                            challenge_type="payment",
                            challenge_token=checkout_ref,
                            status="completed",
                            amount_cents=payment_amount_cents,
                            square_payment_id=payment_id,
                        )
                        db.add(payment_event)
                    logger.info(
                        "Bot-Shield payment completed: user=%s event=%s proof=%s checkout_ref_bound=%s",
                        user.id,
                        event_id,
                        proof_label,
                        bool(bound_event),
                    )

                    was_verified = user.bot_shield_verified
                    promoted = await promote_user_verification_if_ready(db, user)
                    if payment_amount_cents == 100 and promoted and not was_verified:
                        await send_welcome_email(
                            recipient_email=user.email,
                            display_name=user.display_name,
                            settings=settings,
                        )
                else:
                    logger.warning(
                        "Bot-Shield payment ignored because checkout binding failed: user=%s event_id=%s payment_id=%s checkout_ref=%s liveness_bound=%s",
                        user.id,
                        event_id,
                        payment_id,
                        bool(checkout_ref),
                        bool(bound_event),
                    )

            elif not user:
                logger.warning(
                    "Square completed payment for unknown customer: "
                    "customer_id=%s email=%s event_id=%s checkout_ref=%s order_id=%s",
                    customer_id,
                    buyer_email,
                    event_id,
                    bool(checkout_ref),
                    order_id,
                )
            else:
                logger.warning(
                    "Square completed payment could not map tier: user=%s amount=%s event_id=%s hints=%s",
                    user.id,
                    payment_amount_cents,
                    event_id,
                    list(iter_text_hints((payment_obj.get("note"), order_obj))),
                )
    elif event_type in ("payment.created", "payment.updated"):
        logger.info(
            "Ignoring non-authoritative Square payment event for completion state: event_type=%s event_id=%s",
            event_type,
            event_id,
        )

    elif event_type == "subscription.created":
        if user:
            user.subscription_active = True
            user.subscription_tier = "founding_member"
            user.subscription_expires_at = None
            logger.info(
                "Square subscription created: user=%s event=%s",
                user.id,
                event_id,
            )

    elif event_type in ("subscription.updated",):
        # Check if subscription was cancelled
        subscription = obj.get("subscription") or obj
        sub_status = str(subscription.get("status") or "").upper()
        if user:
            if sub_status in ("CANCELED", "DEACTIVATED", "PAUSED"):
                user.subscription_active = False
                user.subscription_expires_at = None
                logger.info(
                    "Square subscription deactivated: user=%s status=%s event=%s",
                    user.id,
                    sub_status,
                    event_id,
                )
            elif sub_status == "ACTIVE":
                user.subscription_active = True
                user.subscription_expires_at = None

    await mark_webhook_event_processed(db, event_id)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        return WebhookAckResponse(event_id=event_id, processed=True, duplicate=True)

    return WebhookAckResponse(event_id=event_id, processed=True, duplicate=False)


# ── Square Booking Webhook (E-Waste / OnlineRecycle.net) ──


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
            payload_json.get("created_at") or payload_json.get("event_created_at") or ""
        ),
        "merchant_id": str(payload_json.get("merchant_id") or ""),
        "booking_id": str(booking.get("id") or ""),
        "booking_status": str(booking.get("status") or ""),
        "start_at": str(booking.get("start_at") or ""),
        "location_id": str(
            booking.get("location_id") or payload_json.get("location_id") or ""
        ),
        "customer_id": str(
            booking.get("customer_id") or customer_details.get("customer_id") or ""
        ),
        "customer_phone": str(
            customer_details.get("phone") or booking.get("customer_phone") or ""
        ),
        "customer_email": str(
            customer_details.get("email_address") or booking.get("customer_email") or ""
        ),
        "customer_note": str(
            booking.get("customer_note") or booking.get("notes") or ""
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
    """Handle Square booking webhooks for e-waste pickups (OnlineRecycle.net)."""
    settings = get_settings()
    payload = await request.body()

    if len(payload) > MAX_WEBHOOK_PAYLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Webhook payload exceeds size limit.",
        )

    should_verify, signature_key, notification_url = _should_verify_square_signature(
        settings,
        "booking",
    )
    if should_verify:
        _verify_square_signature(
            payload,
            square_signature,
            signature_key=signature_key,
            notification_url=notification_url,
            request_url=str(request.url).split("?", 1)[0],
        )

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


@router.post("/stripe")
async def stripe_webhook_retired() -> None:
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Stripe webhooks are retired. Configure Square webhooks instead.",
    )
