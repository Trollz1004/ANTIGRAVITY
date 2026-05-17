"""Authentication router - register, login, refresh, me."""

import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.age_gate import ensure_adult
from app.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    ensure_active_user,
    get_current_user,
    hash_password,
    verify_google_token,
    verify_password,
)
from app.config import get_settings
from app.database import get_db
from app.error_responses import api_exception, ErrorCode, unauthorized, not_found, conflict, bad_request, forbidden
from app.models import Profile, User
from app.rate_limit import auth_limiter
from app.schemas import (
    AuthBetaAccessRequest,
    AuthLoginRequest,
    AuthRefreshRequest,
    AuthRegisterRequest,
    AuthTokenResponse,
    GoogleLoginRequest,
    UserMeResponse,
)
from app.subscriptions import user_has_active_subscription

router = APIRouter(prefix="/auth")


def _normalize_beta_code(code: str) -> str:
    return code.strip().upper()


def _beta_identity(code: str, secret: str) -> tuple[str, str, str]:
    normalized = _normalize_beta_code(code)
    digest = hashlib.sha256(f"{secret}:{normalized}".encode()).hexdigest()
    email = f"beta-{digest[:12]}@youandinotai.com"
    password_seed = hashlib.sha256(
        f"beta-password:{secret}:{normalized}".encode()
    ).hexdigest()
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
            f"beta-stored:{secret}:{_normalize_beta_code(code)}:{password_seed}".encode()
        ).hexdigest()


@router.post(
    "/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    request: Request,
    payload: AuthRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthTokenResponse:
    auth_limiter.check(request)
    existing = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise conflict(message="Email already registered")

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
        raise unauthorized(message="Invalid email or password")
    ensure_active_user(user)

    return AuthTokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user_id=user.id,
    )


@router.post("/google", response_model=AuthTokenResponse)
async def google_login(
    request: Request,
    payload: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthTokenResponse:
    auth_limiter.check(request)
    try:
        id_info = verify_google_token(payload.id_token)
    except Exception as e:
        raise unauthorized(message=f"Invalid Google token: {e}")

    email = id_info.get("email")
    if not email:
        raise bad_request(message="Email not present in Google token")

    user = await db.scalar(select(User).where(User.email == email.lower()))

    if not user:
        # Create a new user
        user = User(
            id=uuid.uuid4(),
            email=email.lower(),
            password_hash=hash_password(str(uuid.uuid4())),  # Create a random password
            display_name=id_info.get("name", "New User"),
            google_id=id_info.get("sub"),
            adult_verified_at=datetime.now(timezone.utc),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif not user.google_id:
        # Link existing user to Google account
        user.google_id = id_info.get("sub")
        await db.commit()
        await db.refresh(user)

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
        raise unauthorized(message="Invalid beta access code", details={"code": ErrorCode.BETA_ACCESS_DENIED})

    settings = get_settings()
    email, password_seed, display_name = _beta_identity(
        normalized_code, settings.jwt_secret
    )
    user = await db.scalar(select(User).where(User.email == email))

    if not user:
        user = User(
            id=uuid.uuid4(),
            email=email,
            password_hash=_beta_password_hash(
                password_seed, settings.jwt_secret, normalized_code
            ),
            display_name=display_name,
            date_of_birth=datetime(2000, 1, 1, tzinfo=timezone.utc).date(),
            adult_verified_at=datetime.now(timezone.utc),
            bot_shield_verified=True,
            subscription_tier="founding_member",
            subscription_active=True,
            is_active=True,
            mission_impact_score=5.0,  # Starting boost for mission-aligned entry
            intent_badge="Intentional" if normalized_code == "FORTHEKIDS" else None,
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
        raise unauthorized(message="Not a refresh token", details={"code": ErrorCode.TOKEN_INVALID})

    user_id = data.get("sub")
    try:
        parsed_user_id = uuid.UUID(str(user_id))
    except ValueError as exc:
        raise unauthorized(message="Invalid token payload", details={"code": ErrorCode.TOKEN_INVALID}) from exc

    user = await db.scalar(select(User).where(User.id == parsed_user_id))
    if not user:
        raise unauthorized(message="User not found", details={"code": ErrorCode.TOKEN_INVALID})
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
        subscription_active=user_has_active_subscription(user),
        subscription_expires_at=user.subscription_expires_at,
        has_profile=profile is not None,
        adult_verified=user.date_of_birth is not None,
        mission_impact_score=user.mission_impact_score,
        intent_badge=user.intent_badge,
    )
