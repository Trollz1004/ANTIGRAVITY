"""V8 Bot-Shield liveness detection and verification flow.

Iron Wall migration: legacy checkout removed. Square is the sole payment processor.

Flow:
1. POST /verify/challenge — generates a liveness challenge (math + timing)
2. POST /verify/submit — validates the challenge response, calculates trust score
3. GET /verify/status — returns current verification status + trust score
4. POST /verify/confirm — requires BOTH passed liveness AND completed payment (Square webhook)

Trust Score (0-100):
- Email verified: 20 pts (auto — they registered with email)
- Liveness challenge passed: 40 pts
- Account age: up to 20 pts (1 pt per day, max 20)
- Activity score: up to 20 pts (matches/messages/posts)
"""

import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models import Match, Message, Post, User, VerificationEvent
from app.payment_truth import (
    BOT_SHIELD_CENTS,
    build_bot_shield_checkout_request,
    build_checkout_reference,
    email_supported_for_square_checkout,
)
from app.rate_limit_redis import enforce_route_rate_limit
from app.square_checkout import create_square_payment_link
from app.subscriptions import user_has_active_subscription
from app.verification_service import (
    has_completed_payment,
    has_passed_liveness,
    lock_user_for_verification,
    promote_user_verification_if_ready,
)

router = APIRouter(prefix="/verify")
logger = logging.getLogger(__name__)

# Challenge config
CHALLENGE_EXPIRY_SECONDS = 300  # 5 minutes
MIN_SOLVE_TIME_SECONDS = 3  # must take at least 3s (bots solve instantly)


class ChallengeResponse(BaseModel):
    challenge_id: str
    challenge_type: str
    question: str
    issued_at: str
    expires_at: str


class ChallengeSubmitRequest(BaseModel):
    challenge_id: str
    answer: str


class ChallengeResult(BaseModel):
    passed: bool
    trust_score: float
    message: str
    checkout_url: str | None = None


class VerificationStatus(BaseModel):
    verified: bool
    trust_score: float
    tier: str  # 'unverified', 'gold', 'platinum'
    bot_shield_paid: bool
    subscription_active: bool
    checks_completed: int


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


def _generate_math_challenge() -> tuple[str, str]:
    """Generate a simple math challenge. Answer is the string of the result."""
    import random

    a = random.randint(10, 99)
    b = random.randint(1, 9)
    op = random.choice(["+", "-", "*"])
    if op == "+":
        answer = a + b
    elif op == "-":
        answer = a - b
    else:
        answer = a * b
    return f"What is {a} {op} {b}?", str(answer)


async def _has_completed_payment(db: AsyncSession, user_id) -> bool:
    """Check if a user has a completed payment event.

    Iron Wall enforcement: No free verifications.
    Returns True only if a VerificationEvent with challenge_type='payment'
    and status='completed' exists for this user.
    """
    return await has_completed_payment(db, user_id)


async def _build_square_checkout_url(
    *,
    user: User,
    event: VerificationEvent,
    settings,
) -> str | None:
    checkout_ref = build_checkout_reference(
        user_id=user.id,
        event_id=event.id,
        tier="bot_shield",
        secret=settings.jwt_secret,
    )

    request_body = build_bot_shield_checkout_request(
        app_url=str(
            getattr(settings, "app_url", "https://youandinotai.com")
            or "https://youandinotai.com"
        ),
        location_id=str(getattr(settings, "square_location_id", "") or "").strip(),
        buyer_email=user.email,
        checkout_ref=checkout_ref,
    )
    checkout_url = await create_square_payment_link(
        request_body=request_body,
        settings=settings,
    )
    if checkout_url:
        return checkout_url
    logger.error(
        "Secure Bot-Shield checkout unavailable: signed Square CreatePaymentLink could not be created for user=%s event=%s",
        user.id,
        event.id,
    )
    return None


def _hash_answer(answer: str, token: str) -> str:
    """Hash answer with token to store — we never store plaintext."""
    return hashlib.sha256(f"{answer}:{token}".encode()).hexdigest()


async def _calculate_trust_score(user: User, db: AsyncSession) -> float:
    """Calculate Trust Score (0-100) based on verification + activity."""
    score = 0.0

    # Email verified: 20 pts (they registered, so email is confirmed)
    score += 20.0

    # Liveness passed: 40 pts
    passed = (
        await db.scalar(
            select(func.count(VerificationEvent.id))
            .where(VerificationEvent.user_id == user.id)
            .where(VerificationEvent.status == "passed")
            .where(VerificationEvent.challenge_type == "liveness")
        )
        or 0
    )
    if passed > 0:
        score += 40.0

    # Account age: up to 20 pts (1 per day, max 20)
    age_days = (
        datetime.now(timezone.utc) - user.created_at.replace(tzinfo=timezone.utc)
    ).days
    score += min(age_days, 20)

    # Activity: up to 20 pts
    matches = (
        await db.scalar(
            select(func.count(Match.id)).where(
                (Match.user_a == user.id) | (Match.user_b == user.id)
            )
        )
        or 0
    )
    messages = (
        await db.scalar(
            select(func.count(Message.id)).where(Message.sender_id == user.id)
        )
        or 0
    )
    posts = (
        await db.scalar(select(func.count(Post.id)).where(Post.author_id == user.id))
        or 0
    )
    activity = min(matches * 2 + messages * 0.5 + posts * 3, 20)
    score += activity

    return min(round(score, 1), 100.0)


@router.post("/challenge", response_model=ChallengeResponse)
async def create_challenge(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChallengeResponse:
    """Start a V8 liveness challenge. Returns a math question with a time window."""
    settings = get_settings()
    await enforce_route_rate_limit(
        request,
        bucket="verify:challenge",
        limit=settings.verify_rate_limit_per_minute,
        window_seconds=settings.redis_rate_limit_window,
    )

    # Check if already verified
    if user.bot_shield_verified:
        raise HTTPException(status_code=400, detail="Already verified")

    question, answer = _generate_math_challenge()
    token = secrets.token_urlsafe(32)
    answer_hash = _hash_answer(answer, token)

    now = datetime.now(timezone.utc)
    expires = now + timedelta(seconds=CHALLENGE_EXPIRY_SECONDS)

    event = VerificationEvent(
        user_id=user.id,
        challenge_type="liveness",
        challenge_token=f"{token}:{answer_hash}",
        status="pending",
        amount_cents=BOT_SHIELD_CENTS,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    return ChallengeResponse(
        challenge_id=str(event.id),
        challenge_type="liveness_math",
        question=question,
        issued_at=now.isoformat(),
        expires_at=expires.isoformat(),
    )


@router.post("/submit", response_model=ChallengeResult)
async def submit_challenge(
    request: Request,
    req: ChallengeSubmitRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChallengeResult:
    """Submit the answer to a liveness challenge. Returns trust score + checkout URL on pass."""

    try:
        challenge_uuid = uuid.UUID(req.challenge_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid challenge_id format")

    event = await db.scalar(
        select(VerificationEvent)
        .where(VerificationEvent.id == challenge_uuid)
        .where(VerificationEvent.user_id == user.id)
        .where(VerificationEvent.status == "pending")
    )
    if not event:
        raise HTTPException(
            status_code=404, detail="Challenge not found or already completed"
        )

    # Check expiry
    elapsed = (
        datetime.now(timezone.utc) - event.created_at.replace(tzinfo=timezone.utc)
    ).total_seconds()
    if elapsed > CHALLENGE_EXPIRY_SECONDS:
        event.status = "expired"
        await db.commit()
        raise HTTPException(status_code=410, detail="Challenge expired")

    # Anti-bot: must take at least MIN_SOLVE_TIME_SECONDS
    if elapsed < MIN_SOLVE_TIME_SECONDS:
        event.status = "failed"
        event.completed_at = datetime.now(timezone.utc)
        await db.commit()
        return ChallengeResult(
            passed=False,
            trust_score=await _calculate_trust_score(user, db),
            message="Challenge completed too quickly. Please try again.",
        )

    # Verify answer
    token, stored_hash = event.challenge_token.split(":", 1)
    submitted_hash = _hash_answer(req.answer.strip(), token)

    if submitted_hash != stored_hash:
        event.status = "failed"
        event.completed_at = datetime.now(timezone.utc)
        await db.commit()
        return ChallengeResult(
            passed=False,
            trust_score=await _calculate_trust_score(user, db),
            message="Incorrect answer. You can try a new challenge.",
        )

    # Passed!
    event.status = "passed"
    event.completed_at = datetime.now(timezone.utc)
    trust = await _calculate_trust_score(user, db)
    event.trust_score = trust
    await db.commit()

    settings = get_settings()
    square_ready_email = email_supported_for_square_checkout(user.email)
    checkout_url = None
    if square_ready_email:
        checkout_url = await _build_square_checkout_url(
            user=user,
            event=event,
            settings=settings,
        )

    return ChallengeResult(
        passed=True,
        trust_score=trust,
        message=(
            "Liveness verified! Complete the $1 Bot-Shield payment to earn your badge."
            if checkout_url
            else (
                "Liveness verified. Add a real email address to unlock Square checkout."
                if not square_ready_email
                else "Liveness verified, but secure Square checkout is temporarily unavailable. Please try again shortly."
            )
        ),
        checkout_url=checkout_url,
    )


@router.get("/status", response_model=VerificationStatus)
async def verification_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VerificationStatus:
    """Get current verification status and trust score."""

    trust = await _calculate_trust_score(user, db)
    bot_shield_paid = await has_completed_payment(db, user.id)
    checks = (
        await db.scalar(
            select(func.count(VerificationEvent.id)).where(
                VerificationEvent.user_id == user.id
            )
        )
        or 0
    )

    # Tier logic
    subscription_active = user_has_active_subscription(user)
    if subscription_active and user.bot_shield_verified:
        tier = "platinum"
    elif user.bot_shield_verified:
        tier = "gold"
    else:
        tier = "unverified"

    return VerificationStatus(
        verified=user.bot_shield_verified,
        trust_score=trust,
        tier=tier,
        bot_shield_paid=bot_shield_paid,
        subscription_active=subscription_active,
        checks_completed=checks,
    )


@router.post("/confirm")
async def confirm_verification(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Called after payment succeeds (webhook or client-side confirmation).

    SECURITY: This endpoint requires BOTH:
      1. A passed liveness challenge
      2. A completed payment event (challenge_type == 'payment', status == 'completed')

    Without both conditions met, verification is denied.
    This prevents free verification bypass (Iron Wall enforcement).
    """

    try:
        # Re-read and lock the user row so concurrent confirm requests cannot
        # race each other into multiple promotion attempts.
        locked_user = await lock_user_for_verification(db, user.id)
        if not locked_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check 1: Must have a passed liveness event
        if not await has_passed_liveness(db, locked_user.id):
            raise HTTPException(
                status_code=400,
                detail="No passed liveness challenge found. Complete the Bot-Shield challenge first.",
            )

        # Check 2: Must have a completed payment event
        if not await has_completed_payment(db, locked_user.id):
            raise HTTPException(
                status_code=402,
                detail="Payment required. Complete the $1 Bot-Shield payment before verification.",
            )

        await promote_user_verification_if_ready(db, locked_user)
        trust = await _calculate_trust_score(locked_user, db)
        await db.commit()
    except HTTPException:
        if db.in_transaction():
            await db.rollback()
        raise
    except Exception:
        if db.in_transaction():
            await db.rollback()
        raise

    return {
        "verified": True,
        "trust_score": trust,
        "tier": "platinum" if user_has_active_subscription(locked_user) else "gold",
    }
