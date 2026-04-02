"""Public waitlist signup route with confirmation email delivery."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request, status

from app.config import get_settings
from app.email_service import send_waitlist_confirmation, send_waitlist_operator_notice
from app.rate_limit import waitlist_limiter
from app.schemas import WaitlistSignupRequest, WaitlistSignupResponse

router = APIRouter(prefix="/waitlist")
logger = logging.getLogger(__name__)


@router.post("", response_model=WaitlistSignupResponse, status_code=status.HTTP_202_ACCEPTED)
async def signup_waitlist(
    request: Request,
    payload: WaitlistSignupRequest,
) -> WaitlistSignupResponse:
    waitlist_limiter.check(request)
    settings = get_settings()
    recipient_email = payload.email.strip().lower()

    try:
        confirmation_sent = await send_waitlist_confirmation(
            recipient_email=recipient_email,
            settings=settings,
        )
    except Exception as exc:
        logger.exception("Waitlist confirmation failed for %s", recipient_email)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Waitlist confirmation is temporarily unavailable. Please try again shortly.",
        ) from exc

    if not confirmation_sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Waitlist confirmation is temporarily unavailable. Please try again shortly.",
        )

    try:
        await send_waitlist_operator_notice(
            recipient_email=recipient_email,
            settings=settings,
        )
    except Exception:
        logger.exception("Waitlist operator notification failed for %s", recipient_email)

    return WaitlistSignupResponse()
