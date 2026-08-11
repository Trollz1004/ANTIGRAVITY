"""Profile CRUD router."""

import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.age_gate import ensure_adult
from app.auth import get_current_user, require_verified_profile
from app.database import get_db
from app.error_responses import conflict, not_found
from app.models import Profile, User
from app.moderation import has_block_relationship
from app.schemas import ProfilePatchRequest, ProfileResponse, ProfileUpdateRequest
from app.utils import patch_model

router = APIRouter(prefix="/profiles")


def _profile_response(user: User, profile: Profile) -> ProfileResponse:
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


async def _get_or_create_profile(db: AsyncSession, user: User) -> Profile:
    profile = await db.scalar(select(Profile).where(Profile.user_id == user.id))
    if not profile:
        profile = Profile(id=uuid.uuid4(), user_id=user.id)
        db.add(profile)
    return profile


def _apply_date_of_birth(
    user: User, profile: Profile, date_of_birth: date | None
) -> None:
    """Write the caller's date of birth, which is locked once verified."""
    if user.date_of_birth is not None:
        if date_of_birth != user.date_of_birth:
            raise conflict(message="Date of birth is locked after verification")
        return
    if date_of_birth is None:
        return
    profile.age = ensure_adult(date_of_birth)
    user.date_of_birth = date_of_birth
    if user.adult_verified_at is None:
        user.adult_verified_at = datetime.now(timezone.utc)


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    profile = await db.scalar(select(Profile).where(Profile.user_id == user.id))
    if not profile:
        raise not_found(message="Profile not created yet")

    return _profile_response(user, profile)


@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    payload: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    profile = await _get_or_create_profile(db, user)

    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.age is not None:
        profile.age = payload.age
    if payload.date_of_birth is not None:
        _apply_date_of_birth(user, profile, payload.date_of_birth)
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

    return _profile_response(user, profile)


@router.patch("/me", response_model=ProfileResponse)
async def patch_my_profile(
    payload: ProfilePatchRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    profile = await _get_or_create_profile(db, user)

    # date_of_birth is special — it lives on User, not Profile
    if "date_of_birth" in payload.model_fields_set:
        _apply_date_of_birth(user, profile, payload.date_of_birth)

    # Apply all other explicitly-set fields via the generic helper
    patch_model(profile, payload, fields=payload.model_fields_set - {"date_of_birth"})

    await db.commit()
    await db.refresh(profile)

    return _profile_response(user, profile)


@router.get("/{user_id}", response_model=ProfileResponse)
async def get_user_profile(
    user_id: uuid.UUID,
    current_user: User = Depends(require_verified_profile),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    if await has_block_relationship(db, user_a=current_user.id, user_b=user_id):
        raise not_found(message="Profile not found")

    profile = await db.scalar(select(Profile).where(Profile.user_id == user_id))
    if not profile:
        raise not_found(message="Profile not found")

    user = await db.get(User, user_id)
    if not user or not user.bot_shield_verified:
        raise not_found(message="Profile not found")

    return _profile_response(user, profile)
