"""Shared verification-state helpers."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Profile, User, VerificationEvent


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
        profile = await db.scalar(
            select(Profile).where(Profile.user_id == user.id)
        )
    if profile:
        profile.verified = True
    return True
