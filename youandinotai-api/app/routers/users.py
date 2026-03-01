"""Users router with registration and basic rate limiting."""

from collections import defaultdict, deque
from threading import Lock
import secrets
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
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
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Try again in a minute.",
            )

        bucket.append(now)


@router.post("/register", response_model=UserRegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: UserRegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UserRegisterResponse:
    client_ip = request.client.host if request.client else "unknown"
    _enforce_registration_rate_limit(client_ip)

    existing_user = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered.")

    user = User(
        id=uuid.uuid4(),
        email=payload.email.lower(),
        display_name=payload.display_name.strip(),
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserRegisterResponse(
        user_id=user.id,
        session_token=secrets.token_urlsafe(32),
    )