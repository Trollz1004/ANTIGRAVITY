"""Users router with registration and basic rate limiting."""

import secrets
import time
import uuid
from collections import defaultdict, deque
from threading import Lock

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.error_responses import conflict, rate_limit
from app.models import User
from app.schemas import UserRegisterRequest, UserRegisterResponse

router = APIRouter(prefix="/users")
settings = get_settings()

_rate_limit_lock = Lock()
_rate_buckets: dict[str, deque[float]] = defaultdict(deque)


def _enforce_registration_rate_limit(client_ip: str) -> None:
    now = time.time()
    window_seconds = 60
    limit = settings.registration_rate_limit_per_minute

    with _rate_limit_lock:
        bucket = _rate_buckets[client_ip]
        while bucket and now - bucket[0] > window_seconds:
            bucket.popleft()

        if len(bucket) >= limit:
            raise rate_limit(message="Rate limit exceeded. Try again in a minute.")

        bucket.append(now)


@router.post(
    "/register",
    response_model=UserRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "description": "User created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "user_id": "550e8400-e29b-41d4-a716-446655440000",
                        "session_token": "dBkFyLXa3RjHmNq8pT...",
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
                        "message": "Email is already registered.",
                        "details": None,
                    }
                }
            },
        },
        429: {
            "description": "Rate limit exceeded",
            "content": {
                "application/json": {
                    "example": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Rate limit exceeded. Try again in a minute.",
                        "details": None,
                    }
                }
            },
        },
    },
    summary="Register a user (legacy)",
    description="Legacy user registration endpoint with IP-based rate limiting. Prefer `POST /api/v1/auth/register` for new integrations.",
)
async def register_user(
    payload: UserRegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UserRegisterResponse:
    client_ip = request.client.host if request.client else "unknown"
    _enforce_registration_rate_limit(client_ip)

    existing_user = await db.scalar(
        select(User).where(User.email == payload.email.lower())
    )
    if existing_user:
        raise conflict(message="Email is already registered.")

    user = User(
        id=uuid.uuid4(),
        email=payload.email.lower(),
        display_name=payload.display_name.strip(),
        # Placeholder hash satisfies NOT NULL constraint.
        # This value is cryptographically random and cannot be used to log in.
        # It is overwritten when the user sets a real password via a separate endpoint.
        password_hash=secrets.token_urlsafe(32),
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserRegisterResponse(
        user_id=user.id,
        session_token=secrets.token_urlsafe(32),
    )
