"""Shared verification-state helpers."""

from __future__ import annotations

import inspect
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Profile, User, VerificationEvent


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
        .order_by(VerificationEvent.created_at.desc())
    )
    return event is not None


async def has_completed_payment(db: AsyncSession, user_id: uuid.UUID) -> bool:
    event = await db.scalar(
        select(VerificationEvent)
        .where(VerificationEvent.user_id == user_id)
        .where(VerificationEvent.status == "completed")
        .where(VerificationEvent.challenge_type == "payment")
        .order_by(VerificationEvent.created_at.desc())
    )
    return event is not None


async def promote_user_verification_if_ready(
    db: AsyncSession,
    user: User,
) -> bool:
    if user.bot_shield_verified:
        return True
    if not await has_passed_liveness(db, user.id):
        return False
    if not await has_completed_payment(db, user.id):
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

    scalars_result = await db.scalars(
        select(VerificationEvent)
        .where(VerificationEvent.user_id == payment_event.user_id)
        .where(VerificationEvent.challenge_type == "payment")
        .where(VerificationEvent.status == "completed")
        .where(
            (VerificationEvent.amount_cents == 100)
            | (VerificationEvent.amount_cents.is_(None))
        )
    )
    all_fn = (
        getattr(scalars_result, "all", None) if scalars_result is not None else None
    )
    extra_payments = (
        all_fn() if callable(all_fn) and not inspect.iscoroutinefunction(all_fn) else []
    )
    if isinstance(extra_payments, (list, tuple)):
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
