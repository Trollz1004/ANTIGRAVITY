"""Redis-backed rate limiter for the YouAndINotAI API.

Replaces the in-memory RateLimiter with a distributed sliding-window counter
using Redis INCR + EXPIRE. Suitable for multi-worker / multi-node deployments.

Also provides a FastAPI middleware that applies rate limiting globally.
"""

import logging
import time
from collections.abc import Callable
from ipaddress import ip_address, ip_network
from typing import Tuple

import redis.asyncio as redis
from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.cache import get_redis
from app.config import get_settings

logger = logging.getLogger("youandinotai.rate_limit")

_test_rate_limit_counts: dict[tuple[str, str, int], int] = {}


def reset_test_rate_limits() -> None:
    """Reset deterministic in-memory route limits used only under tests."""
    _test_rate_limit_counts.clear()


def _parse_trusted_proxy_networks(entries: list[str]) -> tuple:
    networks = []
    for entry in entries:
        try:
            networks.append(ip_network(entry, strict=False))
        except ValueError:
            continue
    return tuple(networks)


def _validated_ip(value: str | None) -> str | None:
    candidate = (value or "").strip()
    if not candidate:
        return None
    try:
        ip_address(candidate)
    except ValueError:
        return None
    return candidate


async def check_rate_limit(
    key: str,
    limit: int,
    window_seconds: int,
) -> Tuple[int, int, float]:
    """Check a sliding-window rate limit using Redis.

    Uses a simple INCR + EXPIRE strategy on a per-window key.
    The key is namespaced by the current window bucket.

    Args:
        key: Rate limit key (e.g. "rl:global:192.168.1.1").
        limit: Maximum number of requests allowed in the window.
        window_seconds: Size of the sliding window in seconds.

    Returns:
        A tuple of (allowed: bool, remaining: int, reset_time: float).
    """
    r: redis.Redis = await get_redis()
    now = time.time()
    window_bucket = int(now // window_seconds)
    redis_key = f"{key}:{window_bucket}"

    try:
        pipe = r.pipeline()
        pipe.incr(redis_key)
        pipe.expire(redis_key, window_seconds + 1)
        results = await pipe.execute()
        count = results[0]

        reset_time = (window_bucket + 1) * window_seconds
        remaining = max(0, limit - count)
        allowed = count <= limit

        if not allowed:
            logger.warning(
                "Rate limit exceeded",
                extra={"key": key, "count": count, "limit": limit},
            )

        return allowed, remaining, reset_time
    except Exception as exc:
        # Fail open: if Redis is down, allow the request
        logger.error("Redis rate limit check failed (%s): %s", key, exc)
        return True, limit, now + window_seconds


async def enforce_route_rate_limit(
    request: Request,
    *,
    bucket: str,
    limit: int,
    window_seconds: int = 60,
) -> None:
    """Enforce per-route limits without requiring global Redis middleware in tests."""
    settings = get_settings()
    client_ip = _client_ip(request)

    if settings.app_env == "test":
        now = time.time()
        window_bucket = int(now // window_seconds)
        key = (bucket, client_ip, window_bucket)
        count = _test_rate_limit_counts.get(key, 0) + 1
        _test_rate_limit_counts[key] = count
        if count <= limit:
            return
        reset_time = (window_bucket + 1) * window_seconds
    else:
        allowed, _remaining, reset_time = await check_rate_limit(
            key=f"rl:{bucket}:{client_ip}",
            limit=limit,
            window_seconds=window_seconds,
        )
        if allowed:
            return

    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Rate limit exceeded",
        headers={
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": str(int(reset_time)),
            "Retry-After": str(max(0, int(reset_time - time.time()))),
        },
    )


def _client_ip(request: Request) -> str:
    """Extract client IP, respecting trusted proxy headers."""
    settings = get_settings()
    direct_host = request.client.host if request.client else None

    # Check if direct peer is a trusted proxy
    trusted = getattr(_client_ip, "_trusted_networks", None)  # type: ignore[attr-defined]
    if trusted is None:
        trusted = _parse_trusted_proxy_networks(settings.rate_limit_trusted_proxy_list)
        _client_ip._trusted_networks = trusted

    if direct_host:
        try:
            remote = ip_address(direct_host)
            if any(remote in net for net in trusted):
                real_ip = _validated_ip(request.headers.get("x-real-ip"))
                if real_ip:
                    return real_ip
                forwarded = request.headers.get("x-forwarded-for")
                if forwarded:
                    first_hop = forwarded.split(",")[0].strip()
                    forwarded_ip = _validated_ip(first_hop)
                    if forwarded_ip:
                        return forwarded_ip
        except ValueError:
            pass

    return direct_host or "unknown"


class RedisRateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware that applies Redis-backed rate limiting per IP.

    Uses a sliding window counter via Redis INCR + EXPIRE.
    """

    def __init__(
        self,
        app,
        calls_per_minute: int = 60,
        trusted_proxy_networks: tuple = (),
    ):
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        self.trusted_proxy_networks = trusted_proxy_networks

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = _client_ip(request)
        key = f"rl:global:{client_ip}"

        allowed, remaining, reset_time = await check_rate_limit(
            key=key,
            limit=self.calls_per_minute,
            window_seconds=60,
        )

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
                headers={
                    "X-RateLimit-Limit": str(self.calls_per_minute),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(reset_time)),
                    "Retry-After": str(int(reset_time - time.time())),
                },
            )

        response = await call_next(request)

        # Add rate limit headers to successful responses
        response.headers["X-RateLimit-Limit"] = str(self.calls_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(reset_time))

        return response
