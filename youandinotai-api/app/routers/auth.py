"""Authentication router — register, login, refresh, me."""

import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    ensure_active_user,
    get_current_user,
    hash_password,
    verify_password,
)
from app.age_gate import ensure_adult
from app.config import get_settings
from app.database import get_db
from app.models import Profile, User
from app.rate_limit import auth_limiter
from app.schemas import (
    AuthBetaAccessRequest,
    AuthLoginRequest,
    AuthRefreshRequest,
    AuthRegisterRequest,
    AuthTokenResponse,
    UserMeResponse,
)

router = APIRouter(prefix="/auth")


def _normalize_beta_code(code: str) -> str:
    return code.strip().upper()


def _beta_identity(code: str, secret: str) -> tuple[str, str, str]:
    normalized = _normalize_beta_code(code)
    digest = hashlib.sha256(f"{secret}:{normalized}".encode("utf-8")).hexdigest()
    email = f"beta-{digest[:12]}@youandinotai.com"
    password_seed = hashlib.sha256(f"beta-password:{secret}:{normalized}".encode("utf-8")).hexdigest()
    display_name = "Beta Tester"
    return email, password_seed, display_name


def _beta_password_hash(password_seed: str, secret: str, code: str) -> str:
    try:
        return hash_password(password_seed)
    except Exception:
        # Beta testers always re-enter through the beta-access code path, so a
        # deterministic fallback keeps the account creatable even if bcrypt
        # backend compilation/runtime drifts in production.
        return hashlib.sha256(
            f"beta-stored:{secret}:{_normalize_beta_code(code)}:{password_seed}".encode("utf-8")
        ).hexdigest()


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
    ensure_active_user(user)

    return AuthTokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user_id=user.id,
    )


@router.post("/beta-access", response_model=AuthTokenResponse)
async def beta_access(
    payload: AuthBetaAccessRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AuthTokenResponse:
    auth_limiter.check(request)
    normalized_code = _normalize_beta_code(payload.code)
    allowed_codes = get_settings().beta_access_code_list
    if not allowed_codes or normalized_code not in allowed_codes:
        raise HTTPException(status_code=401, detail="Invalid beta access code")

    settings = get_settings()
    email, password_seed, display_name = _beta_identity(normalized_code, settings.jwt_secret)
    user = await db.scalar(select(User).where(User.email == email))

    if not user:
        user = User(
            id=uuid.uuid4(),
            email=email,
            password_hash=_beta_password_hash(password_seed, settings.jwt_secret, normalized_code),
            display_name=display_name,
            date_of_birth=datetime(2000, 1, 1, tzinfo=timezone.utc).date(),
            adult_verified_at=datetime.now(timezone.utc),
            bot_shield_verified=True,
            subscription_tier="founding_member",
            subscription_active=True,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif not user.is_active:
        user.is_active = True
        user.subscription_active = True
        if not user.subscription_tier or user.subscription_tier == "beta":
            user.subscription_tier = "founding_member"
        await db.commit()
        await db.refresh(user)

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
    try:
        parsed_user_id = uuid.UUID(str(user_id))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token payload") from exc

    user = await db.scalar(select(User).where(User.id == parsed_user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    ensure_active_user(user)

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
