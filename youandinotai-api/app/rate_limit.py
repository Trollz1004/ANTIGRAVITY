"""Lightweight in-memory rate limiter for auth and verify endpoints.

Uses a sliding-window counter per IP. No external dependency needed.
For production with multiple replicas, swap to Redis-backed limiter.
"""

import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request, status


class RateLimiter:
    """Per-IP sliding window rate limiter."""

    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def _client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def check(self, request: Request) -> None:
        ip = self._client_ip(request)
        now = time.monotonic()
        cutoff = now - self.window_seconds

        with self._lock:
            hits = self._hits[ip]
            # Prune old entries
            self._hits[ip] = [t for t in hits if t > cutoff]
            if len(self._hits[ip]) >= self.max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Try again in {self.window_seconds} seconds.",
                )
            self._hits[ip].append(now)


# Shared instances — imported by routers
auth_limiter = RateLimiter(max_requests=10, window_seconds=60)
verify_limiter = RateLimiter(max_requests=5, window_seconds=60)
