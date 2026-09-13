"""Discovery & Matching Router for YouAndINotAI Date App.
Provides discover feed, like/pass actions, and match creation.
Registered at /api/v1/discover — matches frontend's api.get('/discover?limit=20') call.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, or_, and_, func, exists
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Profile, User, Match, Swipe

router = APIRouter(prefix="/discover", tags=["Discovery & Matching"])


class LikeRequest(BaseModel):
    target_id: uuid.UUID
    direction: str = "like"
    super_like: bool = False


class LikeResponse(BaseModel):
    matched: bool
    match_id: Optional[uuid.UUID] = None


class DiscoveryProfile(BaseModel):
    user_id: uuid.UUID
    display_name: str
    bio: Optional[str] = None
    age: Optional[int] = None
    photos: list[str] = []
    interests: list[str] = []
    location: Optional[str] = None
    verified: bool = False
    subscription_active: bool = False
    gender: Optional[str] = None
    founder: bool = False
    prompt: Optional[str] = None
    intent: Optional[str] = None
    availability: Optional[str] = None
    compatibility: Optional[str] = None
    verificationLevel: Optional[str] = None


@router.get("", response_model=list[DiscoveryProfile])
async def get_discover_feed(
    limit: int = Query(default=20, le=50),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get candidate profiles for discovery (requires verification). Excludes own profile."""
    # Get verified profiles excluding self
    stmt = (
        select(Profile)
        .join(User, Profile.user_id == User.id)
        .where(
            Profile.user_id != user.id,
            User.bot_shield_verified.is_(True),
        )
        .order_by(func.random())
        .limit(limit)
    )
    result = await db.scalars(stmt)
    profiles = result.all()

    return [
        DiscoveryProfile(
            user_id=p.user_id,
            display_name=p.user.display_name if p.user else "Anonymous",
            bio=p.bio,
            age=p.age,
            photos=p.photos or [],
            interests=p.interests or [],
            location=p.location,
            verified=p.verified,
            subscription_active=False,
            gender=p.gender,
            founder=False,
            prompt=None,
            intent=None,
            availability=None,
            compatibility=None,
            verificationLevel="Selfie verified" if p.verified else None,
        )
        for p in profiles
    ]


@router.get("/preview", response_model=list[DiscoveryProfile])
async def get_discover_preview(
    limit: int = Query(default=5, le=10),
    db: AsyncSession = Depends(get_db),
):
    """Public preview of profiles (no auth required). Shows limited profiles to incentivize signup."""
    stmt = (
        select(Profile)
        .join(User, Profile.user_id == User.id)
        .where(User.bot_shield_verified.is_(True))
        .order_by(func.random())
        .limit(limit)
    )
    result = await db.scalars(stmt)
    profiles = result.all()

    return [
        DiscoveryProfile(
            user_id=p.user_id,
            display_name=p.user.display_name if p.user else "Anonymous",
            bio=p.bio,
            age=p.age,
            photos=p.photos or [],
            interests=p.interests or [],
            location=p.location,
            verified=p.verified,
            subscription_active=False,
            gender=p.gender,
            founder=False,
            prompt=None,
            intent=None,
            availability=None,
            compatibility=None,
            verificationLevel="Selfie verified" if p.verified else None,
        )
        for p in profiles
    ]


@router.post("/like", response_model=LikeResponse)
async def send_like(
    payload: LikeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a like to another user. If mutual, creates a match."""
    if payload.target_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot like your own profile",
        )

    # Check for existing match (either direction)
    existing_match = await db.scalar(
        select(Match).where(
            or_(
                and_(Match.user_a == user.id, Match.user_b == payload.target_id),
                and_(Match.user_a == payload.target_id, Match.user_b == user.id),
            )
        )
    )

    if existing_match:
        return LikeResponse(matched=True, match_id=existing_match.id)

    # Check for mutual like: did the target user already like the current user?
    mutual_like = await db.scalar(
        select(Swipe).where(
            Swipe.user_id == payload.target_id,
            Swipe.target_id == user.id,
            Swipe.direction == "like",
        )
    )

    # Record this like as a swipe
    new_swipe = Swipe(
        user_id=user.id,
        target_id=payload.target_id,
        direction="like",
    )
    db.add(new_swipe)

    if mutual_like:
        # Create match only on mutual like
        new_match = Match(
            id=uuid.uuid4(),
            user_a=user.id,
            user_b=payload.target_id,
            compatibility_score=0.85,
            status="active",
            matched_at=datetime.now(timezone.utc),
        )
        db.add(new_match)
        await db.commit()
        await db.refresh(new_match)
        return LikeResponse(matched=True, match_id=new_match.id)

    # Like recorded but no match yet
    await db.commit()
    return LikeResponse(matched=False, match_id=None)
