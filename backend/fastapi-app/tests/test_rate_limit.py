"""Rate limiter tests for auth and verify endpoint protection."""

import os
from ipaddress import ip_network
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

os.environ["JWT_SECRET"] = (
    "test-secret-that-is-at-least-32-characters-long-for-security"
)

from app.rate_limit import RateLimiter


def _request(*, client_host: str, headers: dict[str, str] | None = None):
    return SimpleNamespace(
        headers=headers or {},
        client=SimpleNamespace(host=client_host),
    )


def test_rate_limiter_ignores_forwarded_headers_from_untrusted_peer():
    limiter = RateLimiter(max_requests=10, window_seconds=60)
    request = _request(
        client_host="198.51.100.20",
        headers={"x-forwarded-for": "203.0.113.10"},
    )

    assert limiter._client_ip(request) == "198.51.100.20"


def test_rate_limiter_uses_forwarded_headers_from_trusted_proxy():
    limiter = RateLimiter(
        max_requests=10,
        window_seconds=60,
        trusted_proxy_networks=(ip_network("127.0.0.1/32"),),
    )
    request = _request(
        client_host="127.0.0.1",
        headers={"x-forwarded-for": "203.0.113.10, 127.0.0.1"},
    )

    assert limiter._client_ip(request) == "203.0.113.10"


def test_rate_limiter_rejects_after_limit():
    limiter = RateLimiter(max_requests=2, window_seconds=60)
    request = _request(client_host="198.51.100.20")

    limiter.check(request)
    limiter.check(request)

    with pytest.raises(HTTPException) as exc_info:
        limiter.check(request)

    assert exc_info.value.status_code == 429
