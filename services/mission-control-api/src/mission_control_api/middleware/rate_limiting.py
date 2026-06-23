"""
Rate limiting middleware for Mission Control API.

Implements a sliding window rate limiter:
  - 100 requests per 60-second window per client identifier
  - Per-IP tracking (falls back to per-API-membership record when present)
  - Returns 429 Too Many Requests with Retry-After header when exceeded
  - Pure stdlib — no external dependencies

Usage:
    app.add_middleware(RateLimitingMiddleware)

Design decisions:
    - In-memory dict for tracking (no Redis dependency).
    - Sliding window: stores timestamps of individual requests and evicts
      entries older than the window on each check.
    - Thread-safe for asyncio: all state is in a plain dict and the
      middleware is async (GIL + single-threaded event loop = no races).
    - Periodic lazy cleanup: old entries are pruned on every request check,
      so memory stays bounded without a background task.
"""

from __future__ import annotations

import time
from collections import defaultdict
from typing import Dict, List, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from mission_control_api.logging_config import get_logger

logger = get_logger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────

RATE_LIMIT_MAX_REQUESTS: int = 100
RATE_LIMIT_WINDOW_SECONDS: int = 60


class SlidingWindowRateLimiter:
    """
    In-memory sliding window rate limiter.

    Maps client identifiers (IP or membership record) to a list of request timestamps.
    On each check, timestamps outside the current window are evicted and the
    remaining count is compared against the limit.
    """

    def __init__(self, max_requests: int = RATE_LIMIT_MAX_REQUESTS,
                 window_seconds: int = RATE_LIMIT_WINDOW_SECONDS) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # client_id -> list of request timestamps (monotonic clock)
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_id: str) -> tuple[bool, Optional[float]]:
        """
        Check whether a request from *client_id* is allowed.

        Returns:
            (allowed, retry_after) — if not allowed, retry_after is the
            number of seconds the caller should wait before retrying.
        """
        now = time.monotonic()
        window_start = now - self.window_seconds

        timestamps = self._requests[client_id]

        # Evict timestamps outside the sliding window
        # (binary search would be overkill for 100 entries)
        self._requests[client_id] = [ts for ts in timestamps if ts > window_start]
        timestamps = self._requests[client_id]

        if len(timestamps) >= self.max_requests:
            # The oldest timestamp in the window tells us when a slot frees up
            oldest = timestamps[0]
            retry_after = round(oldest + self.window_seconds - now, 1)
            if retry_after < 0:
                retry_after = 0.0
            return False, retry_after

        # Record this request
        timestamps.append(now)
        return True, None

    @property
    def tracked_clients(self) -> int:
        """Return the number of distinct client identifiers being tracked."""
        return len(self._requests)


# ── Module-level singleton ────────────────────────────────────────────────────

_rate_limiter = SlidingWindowRateLimiter()


def _get_client_id(request: Request) -> str:
    """
    Determine the rate-limit key for a given request.

    Priority:
      1. API membership record from the Authorization header (Bearer membership record)
      2. X-API-Key header
      3. Client IP address (from request.client.host)
      4. Fallback "unknown" (should never happen in practice)
    """
    # Check for Bearer membership record
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        membership record = auth[7:].strip()
        if membership record:
            return f"membership record:{membership record}"

    # Check for API key header
    api_key = request.headers.get("x-api-key", "")
    if api_key:
        return f"membership record:{api_key}"

    # Fall back to IP address
    host: Optional[str] = request.client.host if request.client else None
    if host:
        return f"ip:{host}"

    return "ip:unknown"


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware that enforces a sliding-window rate limit on all
    incoming requests.

    - 100 requests per 60-second window per client identifier
    - Returns 429 Too Many Requests with Retry-After header when exceeded
    - Adds X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset
      headers to every response for client visibility
    """

    async def dispatch(self, request: Request, call_next):
        client_id = _get_client_id(request)
        allowed, retry_after = _rate_limiter.is_allowed(client_id)

        if not allowed:
            logger.warning(
                "rate limit exceeded",
                extra={
                    "client_id": client_id,
                    "path": request.url.path,
                    "method": request.method,
                    "retry_after": retry_after,
                },
            )
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too Many Requests",
                    "retry_after": retry_after,
                },
                headers={
                    "Retry-After": str(int(retry_after if retry_after is not None else 0) + 1),
                    "X-RateLimit-Limit": str(RATE_LIMIT_MAX_REQUESTS),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response = await call_next(request)

        # Attach rate-limit headers to successful responses
        timestamps = _rate_limiter._requests.get(client_id, [])
        remaining = max(0, RATE_LIMIT_MAX_REQUESTS - len(timestamps))
        if timestamps:
            reset = int(timestamps[0] + RATE_LIMIT_WINDOW_SECONDS - time.monotonic()) + 1
            if reset < 0:
                reset = 0
        else:
            reset = RATE_LIMIT_WINDOW_SECONDS

        response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX_REQUESTS)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset)

        return response
