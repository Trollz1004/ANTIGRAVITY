"""Video calling router — REST endpoints for call state management."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Match, User, VideoCall
from app.schemas import VideoCallResponse

router = APIRouter(prefix="/video")


@router.post("/call/{match_id}/initiate", response_model=VideoCallResponse)
async def initiate_call(
    match_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VideoCall:
    """Initialize a video call session for a match."""
    match = await db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Verify user is part of the match
    if user.id not in [match.user_a, match.user_b]:
        raise HTTPException(status_code=403, detail="Not authorized to call this user")

    call = VideoCall(
        id=uuid.uuid4(),
        match_id=match_id,
        initiator_id=user.id,
        status="ringing",
        started_at=datetime.now(timezone.utc),
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)
    return call


@router.post("/call/{call_id}/end", response_model=VideoCallResponse)
async def end_call(
    call_id: uuid.UUID,
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VideoCall:
    """Mark a video call as ended and calculate duration."""
    call = await db.get(VideoCall, call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call session not found")

    call.status = "ended"
    call.ended_at = datetime.now(timezone.utc)

    if call.started_at:
        duration = (call.ended_at - call.started_at).total_seconds()
        call.duration_seconds = int(duration)

    await db.commit()
    await db.refresh(call)
    return call


@router.get("/call/{match_id}/history", response_model=list[VideoCallResponse])
async def get_call_history(
    match_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[VideoCall]:
    """Retrieve the last 10 video calls for a specific match."""
    # Verify user is part of the match
    match = await db.get(Match, match_id)
    if not match or user.id not in [match.user_a, match.user_b]:
        raise HTTPException(status_code=403, detail="Access denied")

    query = (
        select(VideoCall)
        .where(VideoCall.match_id == match_id)
        .order_by(VideoCall.started_at.desc())
        .limit(10)
    )
    calls = (await db.scalars(query)).all()
    return list(calls)
