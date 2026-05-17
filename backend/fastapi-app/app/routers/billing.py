"""Authenticated Square checkout launch routes."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, status
from app.error_responses import bad_request, service_unavailable
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models import User, VerificationEvent
from app.payment_truth import (
    build_account_bound_checkout_request,
    build_checkout_reference,
    email_supported_for_square_checkout,
)
from app.square_checkout import create_square_payment_link

router = APIRouter(prefix="/billing")


class CheckoutLinkRequest(BaseModel):
    tier: Literal["founding_member", "3_month", "12_month", "royalty"]


class CheckoutLinkResponse(BaseModel):
    checkout_url: str
    session_id: str


@router.post("/checkout-link", response_model=CheckoutLinkResponse)
async def create_checkout_link(
    payload: CheckoutLinkRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckoutLinkResponse:
    settings = get_settings()

    if not email_supported_for_square_checkout(user.email):
        raise bad_request(
            message="Use a real email address to launch Square checkout."
        )

    checkout_event = VerificationEvent(
        user_id=user.id,
        challenge_type="payment",
        status="pending",
    )
    db.add(checkout_event)
    await db.flush()

    checkout_ref = build_checkout_reference(
        user_id=user.id,
        event_id=checkout_event.id,
        tier=payload.tier,
        secret=settings.jwt_secret,
    )
    checkout_event.challenge_token = checkout_ref

    request_body = build_account_bound_checkout_request(
        app_url=str(
            getattr(settings, "app_url", "https://youandinotai.com")
            or "https://youandinotai.com"
        ),
        location_id=str(getattr(settings, "square_location_id", "") or "").strip(),
        buyer_email=user.email,
        checkout_ref=checkout_ref,
        tier=payload.tier,
        redirect_path=f"/app/profile?checkout=success&tier={payload.tier}",
    )
    checkout_url = await create_square_payment_link(
        request_body=request_body,
        settings=settings,
    )

    if not checkout_url:
        checkout_event.status = "failed"
        checkout_event.completed_at = datetime.now(timezone.utc)
        await db.commit()
        raise service_unavailable(
            message="Secure Square checkout is temporarily unavailable. Please try again shortly."
        )

    await db.commit()
    return CheckoutLinkResponse(
        checkout_url=checkout_url,
        session_id=str(checkout_event.id),
    )
