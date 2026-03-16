"""Authentication router — register, login, refresh, me."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.age_gate import ensure_adult
from app.database import get_db
from app.models import Profile, User
from app.rate_limit import auth_limiter
from app.schemas import (
    AuthLoginRequest,
    AuthRefreshRequest,
    AuthRegisterRequest,
    AuthTokenResponse,
    UserMeResponse,
)

router = APIRouter(prefix="/auth")


@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    payload: AuthRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthTokenResponse:
    auth_limiter.check(request)
    existing = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        id=uuid.uuid4(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        display_name=payload.display_name.strip(),
        date_of_birth=payload.date_of_birth,
        adult_verified_at=datetime.now(timezone.utc),
    )
    ensure_adult(payload.date_of_birth)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return AuthTokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user_id=user.id,
    )


@router.post("/login", response_model=AuthTokenResponse)
async def login(
    request: Request,
    payload: AuthLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthTokenResponse:
    auth_limiter.check(request)
    user = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return AuthTokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user_id=user.id,
    )


@router.post("/refresh", response_model=AuthTokenResponse)
async def refresh_token(
    payload: AuthRefreshRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AuthTokenResponse:
    auth_limiter.check(request)
    data = decode_token(payload.refresh_token)
    if data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Not a refresh token")

    user_id = data.get("sub")
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return AuthTokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user_id=user.id,
    )


@router.get("/me", response_model=UserMeResponse)
async def get_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserMeResponse:
    profile = await db.scalar(select(Profile).where(Profile.user_id == user.id))
    return UserMeResponse(
        user_id=user.id,
        email=user.email,
        display_name=user.display_name,
        bot_shield_verified=user.bot_shield_verified,
        subscription_tier=user.subscription_tier,
        subscription_active=user.subscription_active,
        has_profile=profile is not None,
        adult_verified=user.date_of_birth is not None,
    )
