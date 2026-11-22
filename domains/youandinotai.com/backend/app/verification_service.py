"""Shared verification-state helpers."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Profile, User, VerificationEvent

LIVENESS_MAX_AGE_SECONDS = 172_800  # 48 hours


def _extract_event_timestamp(event: object) -> datetime | None:
    for attr in ("completed_at", "created_at"):
        raw = getattr(event, attr, None)
        if isinstance(raw, datetime):
            if raw.tzinfo is None:
                return raw.replace(tzinfo=timezone.utc)
            return raw.astimezone(timezone.utc)
    return None


def _is_liveness_event_fresh(
    liveness_event: object,
    *,
    payment_event: object | None = None,
    now: datetime | None = None,
    max_age_seconds: int = LIVENESS_MAX_AGE_SECONDS,
) -> bool:
    if liveness_event is None:
        return False
    liveness_at = _extract_event_timestamp(liveness_event)
    if liveness_at is None:
        return True
    max_age = timedelta(seconds=max_age_seconds)
    reference_now = now or datetime.now(timezone.utc)
    if (reference_now - liveness_at) > max_age:
        return False
    payment_at = (
        _extract_event_timestamp(payment_event) if payment_event is not None else None
    )
    if payment_at is not None and (payment_at - liveness_at) > max_age:
        return False
    return True


def build_user_verification_lock_stmt(user_id: uuid.UUID):
    """Build the row-locking statement used by /verify/confirm.

    We re-read the user under FOR UPDATE instead of trusting an earlier ORM
    instance so concurrent confirm calls serialize on the user row.
    """
    return (
        select(User)
        .where(User.id == user_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )


async def lock_user_for_verification(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> User | None:
    """Acquire a row-level lock on the user being promoted."""
    return await db.scalar(build_user_verification_lock_stmt(user_id))


async def has_passed_liveness(db: AsyncSession, user_id: uuid.UUID) -> bool:
    event = await db.scalar(
        select(VerificationEvent)
        .where(VerificationEvent.user_id == user_id)
        .where(VerificationEvent.status == "passed")
        .where(VerificationEvent.challenge_type == "liveness")
        .order_by(
            func.coalesce(
                VerificationEvent.completed_at,
                VerificationEvent.created_at,
            ).desc(),
            VerificationEvent.created_at.desc(),
        )
    )
    return event is not None


async def has_completed_payment(db: AsyncSession, user_id: uuid.UUID) -> bool:
    event = await db.scalar(
        select(VerificationEvent)
        .where(VerificationEvent.user_id == user_id)
        .where(VerificationEvent.status == "completed")
        .where(VerificationEvent.challenge_type == "payment")
        .order_by(
            func.coalesce(
                VerificationEvent.completed_at,
                VerificationEvent.created_at,
            ).desc(),
            VerificationEvent.created_at.desc(),
        )
    )
    return event is not None


async def promote_user_verification_if_ready(
    db: AsyncSession,
    user: User,
) -> bool:
    if user.bot_shield_verified:
        return True
    liveness_event = await db.scalar(
        select(VerificationEvent)
        .where(VerificationEvent.user_id == user.id)
        .where(VerificationEvent.status == "passed")
        .where(VerificationEvent.challenge_type == "liveness")
        .order_by(
            func.coalesce(
                VerificationEvent.completed_at,
                VerificationEvent.created_at,
            ).desc(),
            VerificationEvent.created_at.desc(),
        )
    )
    if liveness_event is None:
        return False
    payment_event = await db.scalar(
        select(VerificationEvent)
        .where(VerificationEvent.user_id == user.id)
        .where(VerificationEvent.status == "completed")
        .where(VerificationEvent.challenge_type == "payment")
        .order_by(
            func.coalesce(
                VerificationEvent.completed_at,
                VerificationEvent.created_at,
            ).desc(),
            VerificationEvent.created_at.desc(),
        )
    )
    if payment_event is None:
        return False
    if not _is_liveness_event_fresh(liveness_event, payment_event=payment_event):
        return False

    user.bot_shield_verified = True
    profile = None
    if hasattr(user, "__dict__"):
        profile = user.__dict__.get("profile")
    if profile is None:
        profile = await db.scalar(select(Profile).where(Profile.user_id == user.id))
    if profile:
        profile.verified = True
    return True


async def revoke_user_verification_for_refund(
    db: AsyncSession,
    square_payment_id: str | None = None,
    *,
    user: User | None = None,
    payment_event: VerificationEvent | None = None,
    square_refund_id: str | None = None,
) -> bool:
    if payment_event is None:
        cleaned_id = str(square_payment_id or "").strip()
        if not cleaned_id:
            return False
        payment_event = await db.scalar(
            select(VerificationEvent)
            .where(VerificationEvent.challenge_type == "payment")
            .where(VerificationEvent.square_payment_id == cleaned_id)
            .order_by(VerificationEvent.created_at.desc())
        )
    if payment_event is None or payment_event.challenge_type != "payment":
        return False
    if payment_event.amount_cents is not None and payment_event.amount_cents != 100:
        return False

    cleaned_refund_id = str(square_refund_id or "").strip() or None
    payment_event.status = "refunded"
    if cleaned_refund_id is not None:
        payment_event.square_refund_id = cleaned_refund_id

    extra_payments = list(
        (
            await db.scalars(
                select(VerificationEvent)
                .where(VerificationEvent.user_id == payment_event.user_id)
                .where(VerificationEvent.challenge_type == "payment")
                .where(VerificationEvent.status == "completed")
                .where(
                    (VerificationEvent.amount_cents == 100)
                    | (VerificationEvent.amount_cents.is_(None))
                )
            )
        ).all()
    )
    for row in extra_payments:
        row.status = "refunded"
        if (
            cleaned_refund_id is not None
            and getattr(row, "square_refund_id", None) is None
        ):
            row.square_refund_id = cleaned_refund_id

    target_user = user
    if target_user is None or target_user.id != payment_event.user_id:
        target_user = await db.scalar(
            select(User).where(User.id == payment_event.user_id)
        )
    if target_user is None:
        return True

    target_user.bot_shield_verified = False
    profile = None
    if hasattr(target_user, "__dict__"):
        profile = target_user.__dict__.get("profile")
    if profile is None:
        profile = await db.scalar(
            select(Profile).where(Profile.user_id == target_user.id)
        )
    if profile:
        profile.verified = False
    return True
