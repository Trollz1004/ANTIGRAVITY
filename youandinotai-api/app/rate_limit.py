"""Lightweight in-memory rate limiter for auth and verify endpoints.

Uses a sliding-window counter per client IP. Proxy headers are trusted only
when the direct peer is a configured trusted proxy network.
"""

import time
from collections import defaultdict
from ipaddress import ip_address, ip_network
from threading import Lock

from fastapi import HTTPException, Request, status

from app.config import get_settings


def _parse_trusted_proxy_networks(entries: list[str]) -> tuple:
    networks = []
    for entry in entries:
        try:
            networks.append(ip_network(entry, strict=False))
        except ValueError:
            continue
    return tuple(networks)


class RateLimiter:
    """Per-client sliding window rate limiter."""

    def __init__(
        self,
        max_requests: int,
        window_seconds: int,
        *,
        trusted_proxy_networks: tuple = (),
    ) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.trusted_proxy_networks = trusted_proxy_networks
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def _is_trusted_proxy(self, host: str | None) -> bool:
        if not host:
            return False

        try:
            remote_ip = ip_address(host)
        except ValueError:
            return False

        return any(remote_ip in network for network in self.trusted_proxy_networks)

    def _validated_header_ip(self, value: str | None) -> str | None:
        candidate = (value or "").strip()
        if not candidate:
            return None

        try:
            ip_address(candidate)
        except ValueError:
            return None

        return candidate

    def _client_ip(self, request: Request) -> str:
        direct_host = request.client.host if request.client else None
        if self._is_trusted_proxy(direct_host):
            real_ip = self._validated_header_ip(request.headers.get("x-real-ip"))
            if real_ip:
                return real_ip

            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                first_hop = forwarded.split(",")[0].strip()
                forwarded_ip = self._validated_header_ip(first_hop)
                if forwarded_ip:
                    return forwarded_ip

        return direct_host or "unknown"

    def check(self, request: Request) -> None:
        ip = self._client_ip(request)
        now = time.monotonic()
        cutoff = now - self.window_seconds

        with self._lock:
            hits = self._hits[ip]
            self._hits[ip] = [hit for hit in hits if hit > cutoff]
            if len(self._hits[ip]) >= self.max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Try again in {self.window_seconds} seconds.",
                )
            self._hits[ip].append(now)


settings = get_settings()
trusted_proxy_networks = _parse_trusted_proxy_networks(
    settings.rate_limit_trusted_proxy_list
)

auth_limiter = RateLimiter(
    max_requests=settings.auth_rate_limit_per_minute,
    window_seconds=60,
    trusted_proxy_networks=trusted_proxy_networks,
)
verify_limiter = RateLimiter(
    max_requests=settings.verify_rate_limit_per_minute,
    window_seconds=60,
    trusted_proxy_networks=trusted_proxy_networks,
)
