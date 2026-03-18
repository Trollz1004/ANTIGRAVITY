"""Data Privacy and Account Management router."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import DataPrivacyLog, Match, Message, User, VolunteerSignup
from app.schemas import PrivacyLocationUpdate, PrivacyStatusResponse

router = APIRouter(prefix="/privacy")


@router.get("", response_model=PrivacyStatusResponse)
async def get_privacy_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PrivacyStatusResponse:
    """Returns basic privacy and activity stats for the current user."""

    # Count messages sent by user
    message_count = await db.scalar(
        select(func.count(Message.id)).where(Message.sender_id == user.id)
    ) or 0

    # Count matches where user is either participant A or B
    match_count = await db.scalar(
        select(func.count(Match.id)).where(
            (Match.user_a == user.id) | (Match.user_b == user.id)
        )
    ) or 0

    # Count volunteer signups
    signup_count = await db.scalar(
        select(func.count(VolunteerSignup.id)).where(VolunteerSignup.user_id == user.id)
    ) or 0

    return PrivacyStatusResponse(
        email=user.email,
        display_name=user.display_name,
        message_count=message_count,
        match_count=match_count,
        signup_count=signup_count,
    )


@router.post("/export")
async def export_data(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Log a request for data export."""
    log = DataPrivacyLog(
        id=uuid.uuid4(),
        user_id=user.id,
        action="export_requested",
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.commit()
    return {"status": "export_queued"}


@router.post("/delete-account")
async def delete_account(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark account as inactive and log deletion request."""
    user.is_active = False

    log = DataPrivacyLog(
        id=uuid.uuid4(),
        user_id=user.id,
        action="delete_requested",
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.commit()
    return {"status": "delete_scheduled", "effective_days": 30}


@router.put("/location")
async def update_location_sharing(
    payload: PrivacyLocationUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle location sharing in user profile."""
    if not user.profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    user.profile.location_enabled = payload.enabled
    await db.commit()
    return {"location_sharing": payload.enabled}
