"""Authentication router - register, login, refresh, me."""

import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request, status
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
    rotate_refresh_token,
    verify_google_token,
    verify_password,
)
from app.config import get_settings
from app.database import get_db
from app.error_responses import (
    ErrorCode,
    bad_request,
    conflict,
    unauthorized,
)
from app.models import Profile, User
from app.rate_limit_redis import enforce_route_rate_limit
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
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "description": "User registered successfully",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIs...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
                        "token_type": "bearer",
                        "user_id": "550e8400-e29b-41d4-a716-446655440000",
                    }
                }
            },
        },
        409: {
            "description": "Email already registered",
            "content": {
                "application/json": {
                    "example": {
                        "code": "ALREADY_EXISTS",
                        "message": "Email already registered",
                        "details": None,
                    }
                }
            },
        },
        422: {
            "description": "Validation error — invalid request body",
            "content": {
                "application/json": {
                    "example": {
                        "code": "VALIDATION_ERROR",
                        "message": "Request validation failed",
                        "details": {"errors": []},
                    }
                }
            },
        },
    },
    summary="Register a new user",
    description="Create a new user account. Requires email, password (8-128 chars), display name, date of birth, and acceptance of terms.",
)
async def register(
    request: Request,
    payload: AuthRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthTokenResponse:
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


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    responses={
        200: {
            "description": "Login successful",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIs...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
                        "token_type": "bearer",
                        "user_id": "550e8400-e29b-41d4-a716-446655440000",
                    }
                }
            },
        },
        401: {
            "description": "Invalid email or password",
            "content": {
                "application/json": {
                    "example": {
                        "code": "INVALID_CREDENTIALS",
                        "message": "Invalid email or password",
                        "details": None,
                    }
                }
            },
        },
    },
    summary="Log in",
    description="Authenticate with email and password. Returns JWT access and refresh tokens.",
)
async def login(
    request: Request,
    payload: AuthLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthTokenResponse:
    settings = get_settings()
    await enforce_route_rate_limit(
        request,
        bucket="auth:login",
        limit=settings.auth_rate_limit_per_minute,
        window_seconds=settings.redis_rate_limit_window,
    )
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
    normalized_code = _normalize_beta_code(payload.code)
    allowed_codes = get_settings().beta_access_code_list
    if not allowed_codes or normalized_code not in allowed_codes:
        raise unauthorized(
            message="Invalid beta access code",
            details={"code": ErrorCode.BETA_ACCESS_DENIED},
        )

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


@router.post(
    "/refresh",
    response_model=AuthTokenResponse,
    responses={
        200: {
            "description": "Tokens refreshed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIs...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
                        "token_type": "bearer",
                        "user_id": "550e8400-e29b-41d4-a716-446655440000",
                    }
                }
            },
        },
        401: {
            "description": "Invalid or expired refresh token",
            "content": {
                "application/json": {
                    "example": {
                        "code": "TOKEN_INVALID",
                        "message": "Not a refresh token",
                        "details": None,
                    }
                }
            },
        },
    },
    summary="Refresh tokens",
    description="Refresh an access token using refresh token rotation (OPU-47). The old refresh token is validated, revoked, and replaced with a new one.",
)
async def refresh_token(
    payload: AuthRefreshRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AuthTokenResponse:
    """Refresh an access token using refresh token rotation (OPU-47).

    The old refresh token is validated, revoked, and replaced with a new one.
    If token reuse is detected (already revoked), ALL tokens for the user are
    revoked as a security measure against potential token theft.
    """
    data = decode_token(payload.refresh_token)
    if data.get("type") != "refresh":
        raise unauthorized(
            message="Not a refresh token", details={"code": ErrorCode.TOKEN_INVALID}
        )

    user_id = data.get("sub")
    try:
        parsed_user_id = uuid.UUID(str(user_id))
    except ValueError as exc:
        raise unauthorized(
            message="Invalid token payload", details={"code": ErrorCode.TOKEN_INVALID}
        ) from exc

    user = await db.scalar(select(User).where(User.id == parsed_user_id))
    if not user:
        raise unauthorized(
            message="User not found", details={"code": ErrorCode.TOKEN_INVALID}
        )
    ensure_active_user(user)

    # OPU-47: Rotate the refresh token instead of just creating a new one
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    new_refresh_token = await rotate_refresh_token(
        db=db,
        raw_token=payload.refresh_token,
        user_id=parsed_user_id,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    new_access_token = create_access_token(str(user.id))

    return AuthTokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user_id=user.id,
    )


@router.get(
    "/me",
    response_model=UserMeResponse,
    responses={
        200: {
            "description": "Current user profile",
            "content": {
                "application/json": {
                    "example": {
                        "user_id": "550e8400-e29b-41d4-a716-446655440000",
                        "email": "user@example.com",
                        "display_name": "Jane Doe",
                        "bot_shield_verified": True,
                        "subscription_tier": "founding_member",
                        "subscription_active": True,
                        "subscription_expires_at": None,
                        "has_profile": True,
                        "adult_verified": True,
                        "mission_impact_score": 5.0,
                        "intent_badge": "Intentional",
                    }
                }
            },
        },
        401: {
            "description": "Missing or invalid authentication token",
            "content": {
                "application/json": {
                    "example": {
                        "code": "INVALID_CREDENTIALS",
                        "message": "Authentication required",
                        "details": None,
                    }
                }
            },
        },
    },
    summary="Get current user",
    description="Return the authenticated user's profile including subscription status, verification badges, and mission impact score.",
)
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
