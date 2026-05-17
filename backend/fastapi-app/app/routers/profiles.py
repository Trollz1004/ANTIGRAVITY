"""Profile CRUD router."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.age_gate import ensure_adult
from app.auth import get_current_user
from app.database import get_db
from app.error_responses import not_found, conflict
from app.models import Profile, User
from app.moderation import has_block_relationship
from app.schemas import ProfileResponse, ProfileUpdateRequest

router = APIRouter(prefix="/profiles")


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    profile = await db.scalar(select(Profile).where(Profile.user_id == user.id))
    if not profile:
        raise not_found(message="Profile not created yet")

    return ProfileResponse(
        user_id=user.id,
        display_name=user.display_name,
        bio=profile.bio,
        age=profile.age,
        gender=profile.gender,
        looking_for=profile.looking_for,
        location=profile.location,
        photos=profile.photos or [],
        interests=profile.interests or [],
        verified=profile.verified,
    )


@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    payload: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    profile = await db.scalar(select(Profile).where(Profile.user_id == user.id))

    if not profile:
        profile = Profile(id=uuid.uuid4(), user_id=user.id)
        db.add(profile)

    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.age is not None:
        profile.age = payload.age
    if payload.date_of_birth is not None:
        if user.date_of_birth is not None:
            if payload.date_of_birth != user.date_of_birth:
                raise conflict(message="Date of birth is locked after verification")
        else:
            profile.age = ensure_adult(payload.date_of_birth)
            user.date_of_birth = payload.date_of_birth
            if user.adult_verified_at is None:
                user.adult_verified_at = datetime.now(timezone.utc)
    if payload.gender is not None:
        profile.gender = payload.gender
    if payload.looking_for is not None:
        profile.looking_for = payload.looking_for
    if payload.location is not None:
        profile.location = payload.location
    if payload.interests is not None:
        profile.interests = payload.interests

    await db.commit()
    await db.refresh(profile)

    return ProfileResponse(
        user_id=user.id,
        display_name=user.display_name,
        bio=profile.bio,
        age=profile.age,
        gender=profile.gender,
        looking_for=profile.looking_for,
        location=profile.location,
        photos=profile.photos or [],
        interests=profile.interests or [],
        verified=profile.verified,
    )


@router.get("/{user_id}", response_model=ProfileResponse)
async def get_user_profile(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    if await has_block_relationship(db, user_a=current_user.id, user_b=user_id):
        raise not_found(message="Profile not found")

    profile = await db.scalar(select(Profile).where(Profile.user_id == user_id))
    if not profile:
        raise not_found(message="Profile not found")

    user = await db.get(User, user_id)
    if not user:
        raise not_found(message="User not found")

    return ProfileResponse(
        user_id=user.id,
        display_name=user.display_name,
        bio=profile.bio,
        age=profile.age,
        gender=profile.gender,
        looking_for=profile.looking_for,
        location=profile.location,
        photos=profile.photos or [],
        interests=profile.interests or [],
        verified=profile.verified,
    )
