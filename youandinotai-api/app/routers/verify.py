"""V8 Bot-Shield Liveness Detection & Verification Flow.

Flow:
1. POST /verify/challenge — generates a liveness challenge (math + timing)
2. POST /verify/submit — validates the challenge response, calculates trust score
3. GET /verify/status — returns current verification status + trust score
4. POST /verify/confirm — called by Square webhook after $1 payment succeeds

Payment: Square payment link (https://square.link/u/Qc5mxUy7) — no Stripe.

Trust Score (0-100):
- Email verified: 20 pts (auto — they registered with email)
- Liveness challenge passed: 40 pts
- Account age: up to 20 pts (1 pt per day, max 20)
- Activity score: up to 20 pts (matches/messages/posts)
"""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.rate_limit import verify_limiter
from app.models import Match, Message, Post, User, VerificationEvent

router = APIRouter(prefix="/verify")

# Challenge config
CHALLENGE_EXPIRY_SECONDS = 300  # 5 minutes
MIN_SOLVE_TIME_SECONDS = 3  # must take at least 3s (bots solve instantly)
BOT_SHIELD_AMOUNT_CENTS = 100


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


def _generate_math_challenge() -> tuple[str, str]:
    """Generate a simple math challenge. Answer is the string of the result."""
    import random
    a = random.randint(10, 99)
    b = random.randint(1, 9)
    op = random.choice(['+', '-', '*'])
    if op == '+':
        answer = a + b
    elif op == '-':
        answer = a - b
    else:
        answer = a * b
    return f"What is {a} {op} {b}?", str(answer)


def _hash_answer(answer: str, token: str) -> str:
    """Hash answer with token to store — we never store plaintext."""
    return hashlib.sha256(f"{answer}:{token}".encode()).hexdigest()


async def _calculate_trust_score(user: User, db: AsyncSession) -> float:
    """Calculate Trust Score (0-100) based on verification + activity."""
    score = 0.0

    # Email verified: 20 pts (they registered, so email is confirmed)
    score += 20.0

    # Liveness passed: 40 pts
    passed = await db.scalar(
        select(func.count(VerificationEvent.id))
        .where(VerificationEvent.user_id == user.id)
        .where(VerificationEvent.status == "passed")
        .where(VerificationEvent.challenge_type == "liveness")
    ) or 0
    if passed > 0:
        score += 40.0

    # Account age: up to 20 pts (1 per day, max 20)
    age_days = (datetime.now(timezone.utc) - user.created_at.replace(tzinfo=timezone.utc)).days
    score += min(age_days, 20)

    # Activity: up to 20 pts
    matches = await db.scalar(
        select(func.count(Match.id)).where(
            (Match.user_a == user.id) | (Match.user_b == user.id)
        )
    ) or 0
    messages = await db.scalar(
        select(func.count(Message.id)).where(Message.sender_id == user.id)
    ) or 0
    posts = await db.scalar(
        select(func.count(Post.id)).where(Post.author_id == user.id)
    ) or 0
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
    verify_limiter.check(request)

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
        amount_cents=BOT_SHIELD_AMOUNT_CENTS,
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
    verify_limiter.check(request)

    event = await db.scalar(
        select(VerificationEvent)
        .where(VerificationEvent.id == uuid.UUID(req.challenge_id))
        .where(VerificationEvent.user_id == user.id)
        .where(VerificationEvent.status == "pending")
    )
    if not event:
        raise HTTPException(status_code=404, detail="Challenge not found or already completed")

    # Check expiry
    elapsed = (datetime.now(timezone.utc) - event.created_at.replace(tzinfo=timezone.utc)).total_seconds()
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

    # Square payment link for Bot-Shield $1 — no Stripe dependency
    checkout_url = "https://square.link/u/Qc5mxUy7"

    return ChallengeResult(
        passed=True,
        trust_score=trust,
        message="Liveness verified! Complete the $1 Bot-Shield payment to earn your badge.",
        checkout_url=checkout_url,
    )


@router.get("/status", response_model=VerificationStatus)
async def verification_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VerificationStatus:
    """Get current verification status and trust score."""

    trust = await _calculate_trust_score(user, db)
    checks = await db.scalar(
        select(func.count(VerificationEvent.id))
        .where(VerificationEvent.user_id == user.id)
    ) or 0

    # Tier logic
    if user.subscription_active and user.bot_shield_verified:
        tier = "platinum"
    elif user.bot_shield_verified:
        tier = "gold"
    else:
        tier = "unverified"

    return VerificationStatus(
        verified=user.bot_shield_verified,
        trust_score=trust,
        tier=tier,
        bot_shield_paid=user.bot_shield_verified,
        subscription_active=user.subscription_active,
        checks_completed=checks,
    )


@router.post("/confirm")
async def confirm_verification(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Called after Square payment succeeds (via webhook or polling).
    Requires BOTH a passed liveness challenge AND a confirmed payment
    event in webhook_events for this user. Cannot be gamed by calling
    this endpoint directly without paying."""

    # 1. Must have passed liveness
    passed_event = await db.scalar(
        select(VerificationEvent)
        .where(VerificationEvent.user_id == user.id)
        .where(VerificationEvent.status == "passed")
        .where(VerificationEvent.challenge_type == "liveness")
        .order_by(VerificationEvent.created_at.desc())
    )
    if not passed_event:
        raise HTTPException(status_code=400, detail="No passed liveness challenge found")

    # 2. Must have a confirmed payment — either via Square webhook
    #    setting bot_shield_verified, or a processed webhook event
    #    matching this user's Stripe customer ID (legacy).
    #    If the user is already verified (set by webhook handler), allow.
    if not user.bot_shield_verified:
        # Check if webhook handler already flagged payment
        if user.stripe_customer_id:
            from app.models import WebhookEvent
            payment_confirmed = await db.scalar(
                select(WebhookEvent)
                .where(WebhookEvent.event_type == "checkout.session.completed")
                .where(WebhookEvent.processed.is_(True))
                .where(
                    WebhookEvent.payload["data"]["object"]["customer"].as_string()
                    == user.stripe_customer_id
                )
            )
            if not payment_confirmed:
                raise HTTPException(
                    status_code=402,
                    detail="Payment not yet confirmed. Complete the $1 Bot-Shield payment first.",
                )
        else:
            raise HTTPException(
                status_code=402,
                detail="Payment not yet confirmed. Complete the $1 Bot-Shield payment first.",
            )

    user.bot_shield_verified = True
    if user.profile:
        user.profile.verified = True

    trust = await _calculate_trust_score(user, db)
    await db.commit()

    return {
        "verified": True,
        "trust_score": trust,
        "tier": "platinum" if user.subscription_active else "gold",
    }
