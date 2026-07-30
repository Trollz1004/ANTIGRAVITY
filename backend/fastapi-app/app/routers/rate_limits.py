"""Rate limit monitoring and statistics router.

Provides endpoints for querying current rate limit status,
usage statistics, and top endpoints by request count.
"""

import logging
import time
from collections import defaultdict

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth import get_current_user
from app.config import get_settings
from app.models import User

logger = logging.getLogger("youandinotai.api.rate_limits")
router = APIRouter(prefix="/api/v1/rate-limits", tags=["rate-limits"])
settings = get_settings()

# ---------------------------------------------------------------------------
# In-memory statistics store (resets on restart — sufficient for dashboard)
# ---------------------------------------------------------------------------

_request_counts: dict[str, int] = defaultdict(int)
_window_start: float = time.time()
_requests_this_minute: int = 0
_total_today: int = 0
_day_start: float = time.time()


def _reset_window_if_needed() -> None:
    global _window_start, _requests_this_minute
    now = time.time()
    if now - _window_start >= 60:
        _window_start = now
        _requests_this_minute = 0


def _reset_day_if_needed() -> None:
    global _day_start, _total_today
    now = time.time()
    if now - _day_start >= 86400:
        _day_start = now
        _total_today = 0
        _request_counts.clear()


def record_request(path: str) -> None:
    """Record an API request for rate limit tracking. Called by middleware."""
    global _requests_this_minute, _total_today
    _reset_window_if_needed()
    _reset_day_if_needed()
    _request_counts[path] += 1
    _requests_this_minute += 1
    _total_today += 1


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class EndpointStat(BaseModel):
    path: str
    count: int


class RateLimitStatus(BaseModel):
    requestsThisMinute: int
    requestsPerMinute: int
    resetInSeconds: int
    totalRequestsToday: int
    topEndpoints: list[EndpointStat]


class RateLimitConfig(BaseModel):
    requestsPerMinute: int
    burstSize: int
    windowSeconds: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/status", response_model=RateLimitStatus)
async def get_rate_limit_status(
    user: User = Depends(get_current_user),
) -> RateLimitStatus:
    """Return current rate limit status and usage statistics."""
    _reset_window_if_needed()
    _reset_day_if_needed()

    rpm = 60  # default requests per minute
    reset_in = max(0, int(60 - (time.time() - _window_start)))

    # Top 5 endpoints by count
    sorted_eps = sorted(_request_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    top = [EndpointStat(path=p, count=c) for p, c in sorted_eps]

    return RateLimitStatus(
        requestsThisMinute=_requests_this_minute,
        requestsPerMinute=rpm,
        resetInSeconds=reset_in,
        totalRequestsToday=_total_today,
        topEndpoints=top,
    )


@router.get("/stats", response_model=RateLimitStatus)
async def get_rate_limit_stats(
    user: User = Depends(get_current_user),
) -> RateLimitStatus:
    """Return rate limit statistics for authenticated dashboard users."""
    _reset_window_if_needed()
    _reset_day_if_needed()

    rpm = 60
    reset_in = max(0, int(60 - (time.time() - _window_start)))

    sorted_eps = sorted(_request_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    top = [EndpointStat(path=p, count=c) for p, c in sorted_eps]

    return RateLimitStatus(
        requestsThisMinute=_requests_this_minute,
        requestsPerMinute=rpm,
        resetInSeconds=reset_in,
        totalRequestsToday=_total_today,
        topEndpoints=top,
    )


@router.get("/config", response_model=RateLimitConfig)
async def get_rate_limit_config(
    user: User = Depends(get_current_user),
) -> RateLimitConfig:
    """Return rate limit configuration."""
    return RateLimitConfig(
        requestsPerMinute=60,
        burstSize=10,
        windowSeconds=60,
    )


@router.post("/reset")
async def reset_rate_limit_stats(
    user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Reset rate limit statistics (admin only)."""
    global _request_counts, _requests_this_minute, _total_today, _window_start, _day_start
    _request_counts = defaultdict(int)
    _requests_this_minute = 0
    _total_today = 0
    _window_start = time.time()
    _day_start = time.time()
    logger.info("Rate limit statistics reset by user %s", user.id)
    return {"status": "reset"}
