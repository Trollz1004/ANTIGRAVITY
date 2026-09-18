"""Shared safety / moderation helpers."""

from __future__ import annotations

import uuid

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Match, UserBlock


def blocked_by_user_subquery(user_id: uuid.UUID):
    return select(UserBlock.blocked_id).where(UserBlock.blocker_id == user_id)


def blocked_user_subquery(user_id: uuid.UUID):
    return select(UserBlock.blocker_id).where(UserBlock.blocked_id == user_id)


async def has_block_relationship(
    db: AsyncSession,
    *,
    user_a: uuid.UUID,
    user_b: uuid.UUID,
) -> bool:
    block_id = await db.scalar(
        select(UserBlock.id).where(
            or_(
                and_(UserBlock.blocker_id == user_a, UserBlock.blocked_id == user_b),
                and_(UserBlock.blocker_id == user_b, UserBlock.blocked_id == user_a),
            )
        )
    )
    return block_id is not None


async def close_active_matches_for_block(
    db: AsyncSession,
    *,
    user_a: uuid.UUID,
    user_b: uuid.UUID,
) -> int:
    matches = (
        await db.scalars(
            select(Match).where(
                or_(
                    and_(Match.user_a == user_a, Match.user_b == user_b),
                    and_(Match.user_a == user_b, Match.user_b == user_a),
                ),
                Match.status == "active",
            )
        )
    ).all()

    for match in matches:
        match.status = "blocked"

    return len(matches)
