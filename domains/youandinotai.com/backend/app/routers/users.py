"""Users router with registration and basic rate limiting."""

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.error_responses import rate_limit

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
    status_code=status.HTTP_410_GONE,
    summary="Register a user (retired)",
    description="Retired legacy user registration endpoint. Use `POST /api/v1/auth/register` instead.",
)
async def register_user() -> None:
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Legacy registration at /api/v1/users/register is retired. Use POST /api/v1/auth/register.",
    )
