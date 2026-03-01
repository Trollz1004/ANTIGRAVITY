"""Stripe webhook router with signature verification and audit logging."""

from __future__ import annotations

import json
import logging
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
