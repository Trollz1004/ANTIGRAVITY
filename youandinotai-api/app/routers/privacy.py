"""Data privacy router for self-service data access requests."""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import DataPrivacyLog, Match, Message, Profile, User
from app.schemas import (
    PrivacyActionResponse,
    PrivacyMyDataResponse,
    PrivacyProfileSummary,
    PrivacyRequestResponse,
)

router = APIRouter(prefix="/privacy")


async def _get_existing_pending_request(
    db: AsyncSession,
    user_id: uuid.UUID,
    action: str,
) -> DataPrivacyLog | None:
    return await db.scalar(
        select(DataPrivacyLog)
        .where(
            DataPrivacyLog.user_id == user_id,
            DataPrivacyLog.action == action,
            DataPrivacyLog.status == "pending",
        )
        .order_by(DataPrivacyLog.created_at.desc())
    )


@router.get("/my-data", response_model=PrivacyMyDataResponse)
async def get_my_data(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PrivacyMyDataResponse:
    profile = await db.scalar(select(Profile).where(Profile.user_id == user.id))

    match_ids_stmt = select(Match.id).where(
        or_(Match.user_a == user.id, Match.user_b == user.id)
    )

    message_count = (
        await db.scalar(
            select(func.count(Message.id)).where(Message.match_id.in_(match_ids_stmt))
        )
    ) or 0
    match_count = (
        await db.scalar(
            select(func.count(Match.id)).where(
                or_(Match.user_a == user.id, Match.user_b == user.id)
            )
        )
    ) or 0

    pending_logs = (
        await db.scalars(
            select(DataPrivacyLog)
            .where(
                DataPrivacyLog.user_id == user.id,
                DataPrivacyLog.status == "pending",
            )
            .order_by(DataPrivacyLog.created_at.desc())
        )
    ).all()

    profile_summary = None
    photos_count = 0
    if profile:
        photos_count = len(profile.photos or [])
        profile_summary = PrivacyProfileSummary(
            bio=profile.bio,
            age=profile.age,
            gender=profile.gender,
            looking_for=profile.looking_for,
            location=profile.location,
            interests=list(profile.interests or []),
            verified=profile.verified,
            location_enabled=profile.location_enabled,
        )

    return PrivacyMyDataResponse(
        user_id=user.id,
        email=user.email,
        display_name=user.display_name,
        created_at=user.created_at,
        profile=profile_summary,
        message_count=message_count,
        match_count=match_count,
        photos_count=photos_count,
        pending_requests=[
            PrivacyRequestResponse.model_validate(log) for log in pending_logs
        ],
    )


@router.post("/export", response_model=PrivacyActionResponse, status_code=202)
async def request_data_export(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PrivacyActionResponse:
    existing = await _get_existing_pending_request(db, user.id, "export_requested")
    if existing:
        return PrivacyActionResponse(
            status=existing.status,
            action=existing.action,
            request_id=existing.id,
            scheduled_for=existing.scheduled_for,
        )

    log = DataPrivacyLog(
        id=uuid.uuid4(),
        user_id=user.id,
        action="export_requested",
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    return PrivacyActionResponse(
        status=log.status,
        action=log.action,
        request_id=log.id,
        scheduled_for=log.scheduled_for,
    )


@router.post("/delete", response_model=PrivacyActionResponse, status_code=202)
async def request_account_deletion(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PrivacyActionResponse:
    existing = await _get_existing_pending_request(db, user.id, "delete_requested")
    if existing:
        return PrivacyActionResponse(
            status=existing.status,
            action=existing.action,
            request_id=existing.id,
            scheduled_for=existing.scheduled_for,
        )

    scheduled_for = datetime.now(timezone.utc) + timedelta(days=30)
    log = DataPrivacyLog(
        id=uuid.uuid4(),
        user_id=user.id,
        action="delete_requested",
        status="pending",
        scheduled_for=scheduled_for,
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    return PrivacyActionResponse(
        status=log.status,
        action=log.action,
        request_id=log.id,
        scheduled_for=log.scheduled_for,
    )


@router.post("/location/disable", response_model=PrivacyActionResponse)
async def disable_location_tracking(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PrivacyActionResponse:
    profile = await db.scalar(select(Profile).where(Profile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.location_enabled = False
    log = DataPrivacyLog(
        id=uuid.uuid4(),
        user_id=user.id,
        action="location_disabled",
        status="completed",
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    return PrivacyActionResponse(
        status=log.status,
        action=log.action,
        request_id=log.id,
        scheduled_for=log.scheduled_for,
    )
