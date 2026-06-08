"""Redis caching layer for the YouAndINotAI API.

Provides:
- Async Redis connection manager (redis-py)
- cache_response decorator for FastAPI endpoints
- invalidate_cache for pattern-based key deletion
- Redis health check
"""

import functools
import hashlib
import json
import logging
from typing import Any, Callable, Optional

import redis.asyncio as redis
from fastapi import Request

from app.config import get_settings

logger = logging.getLogger("youandinotai.cache")

_redis_pool: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    """Get or create the async Redis connection pool."""
    global _redis_pool
    if _redis_pool is None:
        settings = get_settings()
        redis_url = settings.redis_url
        _redis_pool = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=settings.redis_max_connections,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
        )
        logger.info("Redis connection pool created", extra={"url": redis_url})
    return _redis_pool


async def close_redis() -> None:
    """Close the Redis connection pool."""
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.close()
        _redis_pool = None
        logger.info("Redis connection pool closed")


async def redis_health_check() -> dict[str, Any]:
    """Check Redis connectivity and return status info."""
    try:
        r = await get_redis()
        start = __import__("time").time()
        pong = await r.ping()
        latency_ms = (__import__("time").time() - start) * 1000

        if not pong:
            return {"status": "error", "message": "Redis ping returned False"}

        try:
            info = await r.info("server")
        except Exception:
            info = {}
        return {
            "status": "ok",
            "latency_ms": round(latency_ms, 2),
            "redis_version": info.get("redis_version", "unknown"),
            "uptime_seconds": info.get("uptime_in_seconds", 0),
        }
    except Exception as exc:
        logger.error("Redis health check failed: %s", str(exc))
        return {"status": "error", "message": str(exc)}


def _build_cache_key(
    prefix: str, request: Request, vary_on: Optional[list[str]] = None
) -> str:
    """Build a deterministic cache key from the request."""
    parts = [prefix, request.method, request.url.path]
    vary_on = vary_on or []

    for header in vary_on:
        value = request.headers.get(header, "")
        parts.append(f"{header}={value}")

    # Include sorted query params for cache key
    qs = str(sorted(request.query_params.multi_items()))
    parts.append(qs)

    raw = "|".join(parts)
    digest = hashlib.sha256(raw.encode()).hexdigest()[:32]
    return f"cache:{prefix}:{request.url.path}:{digest}"


def cache_response(
    ttl: int = 300,
    prefix: str = "api",
    vary_on: Optional[list[str]] = None,
):
    """Decorator that caches FastAPI endpoint responses in Redis.

    Args:
        ttl: Time-to-live in seconds for the cached entry.
        prefix: Cache key prefix for namespacing.
        vary_on: List of request header names to include in the cache key.
                 e.g. ["authorization"] to cache per-user.
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract Request from args or kwargs
            request: Optional[Request] = kwargs.get("request")
            if request is None:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if request is None or request.method not in ("GET", "HEAD"):
                return await func(*args, **kwargs)

            redis_key = _build_cache_key(prefix, request, vary_on)

            try:
                r = await get_redis()
                cached = await r.get(redis_key)
                if cached is not None:
                    logger.debug("Cache HIT: %s", redis_key)
                    data = json.loads(cached)
                    from fastapi.responses import JSONResponse

                    return JSONResponse(
                        content=data["body"], status_code=data["status_code"]
                    )
            except Exception as exc:
                logger.warning(
                    "Redis cache read failed (%s), falling through: %s", redis_key, exc
                )

            response = await func(*args, **kwargs)

            # Only cache successful JSON-like responses
            try:
                status_code = getattr(response, "status_code", 200)
                if 200 <= status_code < 300:
                    body_bytes = b""
                    if hasattr(response, "body_iterator"):
                        async for chunk in response.body_iterator:
                            body_bytes += chunk
                    elif hasattr(response, "body"):
                        body_bytes = response.body
                    elif hasattr(response, "render"):
                        body_bytes = response.render()

                    if body_bytes:
                        # Reconstruct iterator for downstream consumption
                        payload = json.dumps(
                            {
                                "body": json.loads(body_bytes),
                                "status_code": status_code,
                            }
                        )
                        r = await get_redis()
                        await r.set(redis_key, payload, ex=ttl)
                        logger.debug("Cache SET: %s (TTL=%ds)", redis_key, ttl)

                    # Rebuild response so downstream can still read the body
                    from fastapi.responses import Response as StarletteResponse

                    response = StarletteResponse(
                        content=body_bytes,
                        status_code=status_code,
                        headers=dict(getattr(response, "headers", {})),
                        media_type=getattr(response, "media_type", None),
                    )
            except Exception as exc:
                logger.warning("Redis cache write failed (%s): %s", redis_key, exc)

            return response

        return wrapper

    return decorator


async def invalidate_cache(pattern: str = "api:*") -> int:
    """Invalidate cache entries matching a glob pattern.

    Returns the number of keys deleted.
    """
    try:
        r = await get_redis()
        deleted = 0
        async for key in r.scan_iter(match=pattern, count=100):
            await r.delete(key)
            deleted += 1
        logger.info("Cache invalidation: pattern=%s deleted=%d", pattern, deleted)
        return deleted
    except Exception as exc:
        logger.error("Cache invalidation failed for pattern %s: %s", pattern, exc)
        return 0
