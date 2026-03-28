"""Swipe and discovery router."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Match, Profile, Swipe, User
from app.schemas import DiscoverProfileResponse, MatchResponse, SwipeRequest, SwipeResponse
from app.subscriptions import user_has_active_subscription

router = APIRouter()


@router.post("/swipe", response_model=SwipeResponse)
async def swipe(
    payload: SwipeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SwipeResponse:
    if payload.target_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot swipe yourself")

    # Check for duplicate swipe
    existing = await db.scalar(
        select(Swipe).where(
            Swipe.user_id == user.id,
            Swipe.target_id == payload.target_id,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already swiped on this user")

    swipe = Swipe(
        id=uuid.uuid4(),
        user_id=user.id,
        target_id=payload.target_id,
        direction=payload.direction,
    )
    db.add(swipe)

    matched = False
    match_id = None

    # Check for mutual like
    if payload.direction == "like":
        mutual = await db.scalar(
            select(Swipe).where(
                Swipe.user_id == payload.target_id,
                Swipe.target_id == user.id,
                Swipe.direction == "like",
            )
        )
        if mutual:
            match = Match(
                id=uuid.uuid4(),
                user_a=user.id,
                user_b=payload.target_id,
                status="active",
            )
            db.add(match)
            matched = True
            match_id = match.id

    await db.commit()
    return SwipeResponse(matched=matched, match_id=match_id)


@router.get("/matches", response_model=list[MatchResponse])
async def get_matches(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MatchResponse]:
    matches = (
        await db.scalars(
            select(Match)
            .where(
                or_(Match.user_a == user.id, Match.user_b == user.id),
                Match.status == "active",
            )
            .order_by(Match.matched_at.desc())
        )
    ).all()

    results = []
    for match in matches:
        other_id = match.user_b if match.user_a == user.id else match.user_a
        other_user = await db.get(User, other_id)
        other_profile = await db.scalar(select(Profile).where(Profile.user_id == other_id))

        results.append(
            MatchResponse(
                match_id=match.id,
                user_id=other_id,
                display_name=other_user.display_name if other_user else "Unknown",
                photos=(other_profile.photos or []) if other_profile else [],
                matched_at=match.matched_at,
                last_message_at=match.last_message_at,
                verified=(other_profile.verified if other_profile else False),
                subscription_active=(user_has_active_subscription(other_user) if other_user else False),
                breeze_bypass_enabled=match.breeze_bypass_enabled,
            )
        )
    return results


@router.get("/discover", response_model=list[DiscoverProfileResponse])
async def discover(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
) -> list[DiscoverProfileResponse]:
    # Get IDs already swiped on
    swiped_subq = select(Swipe.target_id).where(Swipe.user_id == user.id)

    # Get profiles excluding self and already-swiped
    profiles = (
        await db.scalars(
            select(Profile)
            .where(
                Profile.user_id != user.id,
                Profile.user_id.notin_(swiped_subq),
            )
            .order_by(func.random())
            .limit(limit)
        )
    ).all()

    results = []
    for profile in profiles:
        profile_user = await db.get(User, profile.user_id)
        if not profile_user:
            continue
        results.append(
            DiscoverProfileResponse(
                user_id=profile.user_id,
                display_name=profile_user.display_name,
                bio=profile.bio,
                age=profile.age,
                photos=profile.photos or [],
                interests=profile.interests or [],
                location=profile.location,
                verified=profile.verified,
                subscription_active=user_has_active_subscription(profile_user),
                mission_impact_score=profile_user.mission_impact_score,
                intent_badge=profile_user.intent_badge,
            )
        )
    return results


@router.patch("/matches/{match_id}/breeze-bypass")
async def toggle_breeze_bypass(
    match_id: uuid.UUID,
    enabled: bool,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Breeze Bypass: Toggle zero-chat handshake mode for a specific match."""
    match = await db.get(Match, match_id)
    if not match or user.id not in (match.user_a, match.user_b):
        raise HTTPException(status_code=404, detail="Match not found")
    
    match.breeze_bypass_enabled = enabled
    await db.commit()
    return {"match_id": match_id, "breeze_bypass_enabled": enabled}
