"""Safety routes for blocking and reporting users."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models import SupportTicket, User, UserBlock, UserReport
from app.moderation import close_active_matches_for_block
from app.schemas import (
    SafetyBlockedUserResponse,
    SafetyBlockRequest,
    SafetyBlockResponse,
    UserReportRequest,
    UserReportResponse,
)
from app.support_service import build_bot_likelihood_profile, notify_support_ticket

router = APIRouter(prefix="/safety")


async def _get_target_user(user_id: uuid.UUID, db: AsyncSession) -> User:
    target = await db.get(User, user_id)
    if not target or not target.is_active:
        raise HTTPException(status_code=404, detail="User not found")
    return target


@router.get("/blocks", response_model=list[SafetyBlockedUserResponse])
async def list_blocked_users(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SafetyBlockedUserResponse]:
    blocks = (
        await db.scalars(
            select(UserBlock)
            .where(UserBlock.blocker_id == user.id)
            .order_by(UserBlock.created_at.desc())
        )
    ).all()

    results: list[SafetyBlockedUserResponse] = []
    for block in blocks:
        blocked_user = await db.get(User, block.blocked_id)
        if not blocked_user:
            continue
        results.append(
            SafetyBlockedUserResponse(
                blocked_user_id=block.blocked_id,
                display_name=blocked_user.display_name,
                reason=block.reason,
                created_at=block.created_at,
            )
        )
    return results


@router.post("/users/{user_id}/block", response_model=SafetyBlockResponse)
async def block_user(
    user_id: uuid.UUID,
    payload: SafetyBlockRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SafetyBlockResponse:
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot block yourself")

    await _get_target_user(user_id, db)

    existing = await db.scalar(
        select(UserBlock).where(
            UserBlock.blocker_id == user.id,
            UserBlock.blocked_id == user_id,
        )
    )
    if existing:
        return SafetyBlockResponse(
            status="blocked",
            blocked_user_id=user_id,
            match_records_closed=0,
        )

    block = UserBlock(
        id=uuid.uuid4(),
        blocker_id=user.id,
        blocked_id=user_id,
        reason=payload.reason,
    )
    db.add(block)
    closed_count = await close_active_matches_for_block(
        db, user_a=user.id, user_b=user_id
    )
    await db.commit()

    return SafetyBlockResponse(
        status="blocked",
        blocked_user_id=user_id,
        match_records_closed=closed_count,
    )


@router.delete("/users/{user_id}/block", response_model=SafetyBlockResponse)
async def unblock_user(
    user_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SafetyBlockResponse:
    block = await db.scalar(
        select(UserBlock).where(
            UserBlock.blocker_id == user.id,
            UserBlock.blocked_id == user_id,
        )
    )
    if not block:
        raise HTTPException(status_code=404, detail="Block record not found")

    await db.delete(block)
    await db.commit()

    return SafetyBlockResponse(
        status="unblocked",
        blocked_user_id=user_id,
        match_records_closed=0,
    )


@router.post(
    "/users/{user_id}/report",
    response_model=UserReportResponse,
    status_code=status.HTTP_201_CREATED,
)
async def report_user(
    user_id: uuid.UUID,
    payload: UserReportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserReportResponse:
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot report yourself")

    target = await _get_target_user(user_id, db)

    ticket = SupportTicket(
        id=uuid.uuid4(),
        user_id=user.id,
        status="open",
        category="safety",
        subject=f"Safety report: {target.display_name}",
        customer_email=user.email,
        customer_message=payload.details or payload.reason,
        bot_response="A safety report was submitted for moderation review.",
        escalation_reason=f"user_report:{payload.reason}",
        transcript=[
            {"role": "user", "content": payload.details or payload.reason},
            {
                "role": "system",
                "content": (
                    f"Reported user: {target.display_name} ({target.id}) | "
                    f"source={payload.source} | reason={payload.reason}"
                ),
            },
        ],
    )
    ticket.bot_likelihood_score, ticket.bot_likelihood_signals = (
        await build_bot_likelihood_profile(
            db=db,
            user=user,
            customer_message=f"{payload.reason} {payload.details or ''}".strip(),
        )
    )
    ticket.profile_completeness_score = ticket.bot_likelihood_signals.get(
        "profile_completeness_score", 0.0
    )
    db.add(ticket)
    await db.flush()

    report = UserReport(
        id=uuid.uuid4(),
        reporter_id=user.id,
        reported_id=user_id,
        reason=payload.reason,
        details=payload.details,
        source=payload.source,
        status="open",
        support_ticket_id=ticket.id,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    await db.refresh(ticket)

    await notify_support_ticket(ticket=ticket, user=user, settings=get_settings())

    return UserReportResponse(
        status="reported",
        report_id=report.id,
        reported_user_id=user_id,
        ticket_id=ticket.id,
    )
