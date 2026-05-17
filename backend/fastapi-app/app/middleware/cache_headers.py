"""Cache headers middleware for API responses.

Adds ETag, Last-Modified, and Cache-Control headers to GET responses
based on endpoint volatility. Handles 304 Not Modified responses.
"""

import hashlib
import json
import logging
import time
from collections.abc import Callable
from datetime import datetime, timezone

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Endpoint volatility tiers (prefix match)
# Each tuple: (path_prefix, cache_control, max_age_seconds)
CACHE_TIERS: list[tuple[str, str, int]] = [
    # Health endpoints - no caching
    ("/api/v1/health", "no-cache, no-store, must-revalidate", 0),
    # Auth endpoints - no caching
    ("/api/v1/auth", "no-cache, no-store, must-revalidate", 0),
    # User data - private, short cache
    ("/api/v1/profiles", "private, max-age=60", 60),
    ("/api/v1/users", "private, max-age=60", 60),
    ("/api/v1/messages", "private, max-age=30", 30),
    ("/api/v1/swipe", "private, max-age=30", 30),
    # Public content - public, medium cache
    ("/api/v1/boards", "public, max-age=300", 300),
    ("/api/v1/events", "public, max-age=300", 300),
    ("/api/v1/volunteering", "public, max-age=300", 300),
    ("/api/v1/marketing", "public, max-age=600", 600),
    # Static/config - public, long cache
    ("/api/v1/feature-flags", "public, max-age=3600", 3600),
    ("/api/v1/waitlist", "public, max-age=300", 300),
    # Metrics - no caching
    ("/api/v1/metrics", "no-cache, no-store", 0),
]

# Default for unmatched GET endpoints
DEFAULT_CACHE_CONTROL = "private, max-age=60"
DEFAULT_MAX_AGE = 60


def _match_cache_tier(path: str) -> tuple[str, int]:
    """Match a path to a cache tier. Returns (cache_control, max_age)."""
    for prefix, cache_control, max_age in CACHE_TIERS:
        if path.startswith(prefix):
            return cache_control, max_age
    return DEFAULT_CACHE_CONTROL, DEFAULT_MAX_AGE


def _compute_etag(content: bytes) -> str:
    """Compute an ETag from response content."""
    return f'"{hashlib.md5(content).hexdigest()}"'


class CacheHeadersMiddleware(BaseHTTPMiddleware):
    """Add caching headers to GET responses and handle 304 Not Modified."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only process GET and HEAD requests
        if request.method not in ("GET", "HEAD"):
            return await call_next(request)

        response = await call_next(request)

        # Only add cache headers to successful responses
        if response.status_code != 200:
            return response

        path = request.url.path
        cache_control, max_age = _match_cache_tier(path)

        # Add Cache-Control header
        response.headers["Cache-Control"] = cache_control

        # Add ETag based on response content
        body = b""
        async for chunk in response.body_iterator:
            body += chunk

        etag = _compute_etag(body)
        response.headers["ETag"] = etag

        # Add Last-Modified
        response.headers["Last-Modified"] = datetime.now(timezone.utc).strftime(
            "%a, %d %b %Y %H:%M:%S GMT"
        )

        # Check If-None-Match for 304
        if_none_match = request.headers.get("If-None-Match")
        if if_none_match and if_none_match == etag:
            return Response(
                status_code=304,
                headers={
                    "Cache-Control": cache_control,
                    "ETag": etag,
                    "Last-Modified": response.headers["Last-Modified"],
                },
            )

        # Reconstruct response with body
        return Response(
            content=body,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type,
        )
