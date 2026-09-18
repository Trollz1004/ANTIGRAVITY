"""Unit coverage for the Redis-backed rate limiter helpers and middleware."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app import rate_limit_redis
from app.rate_limit_redis import (
    RedisRateLimitMiddleware,
    _client_ip,
    _parse_trusted_proxy_networks,
    _validated_ip,
    check_rate_limit,
    enforce_route_rate_limit,
    reset_test_rate_limits,
)


class _FakePipeline:
    def __init__(self, counts: list[int]):
        self._counts = counts

    def incr(self, key):  # noqa: D401 - mimics redis pipeline API
        return self

    def expire(self, key, ttl):
        return self

    async def execute(self):
        return [self._counts.pop(0), True]


class _FakeRedis:
    def __init__(self, counts: list[int]):
        self._counts = counts

    def pipeline(self):
        return _FakePipeline(self._counts)


class _BrokenRedis:
    def pipeline(self):
        raise RuntimeError("redis is down")


def _patch_redis(redis_obj):
    return patch("app.rate_limit_redis.get_redis", AsyncMock(return_value=redis_obj))


def _make_request(host: str | None = "1.2.3.4", headers: dict | None = None) -> Request:
    raw_headers = [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()]
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/v1/health",
        "query_string": b"",
        "headers": raw_headers,
    }
    if host is not None:
        scope["client"] = (host, 5555)
    return Request(scope)


@pytest.fixture(autouse=True)
def _reset_limiter_state():
    reset_test_rate_limits()
    if hasattr(_client_ip, "_trusted_networks"):
        del _client_ip._trusted_networks
    yield
    reset_test_rate_limits()
    if hasattr(_client_ip, "_trusted_networks"):
        del _client_ip._trusted_networks


def test_parse_trusted_proxy_networks_skips_invalid_entries():
    networks = _parse_trusted_proxy_networks(["10.0.0.0/8", "not-a-network", "::1/128"])
    assert len(networks) == 2
    assert str(networks[0]) == "10.0.0.0/8"


def test_validated_ip_accepts_only_real_addresses():
    assert _validated_ip(" 192.168.1.10 ") == "192.168.1.10"
    assert _validated_ip("::1") == "::1"
    assert _validated_ip("not-an-ip") is None
    assert _validated_ip("") is None
    assert _validated_ip(None) is None


def _settings(**overrides):
    base = {
        "app_env": "test",
        "rate_limit_trusted_proxy_list": ["127.0.0.1/32"],
    }
    base.update(overrides)
    return SimpleNamespace(**base)


def test_client_ip_uses_direct_peer_when_not_trusted():
    with patch("app.rate_limit_redis.get_settings", return_value=_settings()):
        request = _make_request("8.8.8.8", {"x-real-ip": "9.9.9.9"})
        assert _client_ip(request) == "8.8.8.8"


def test_client_ip_prefers_x_real_ip_from_trusted_proxy():
    with patch("app.rate_limit_redis.get_settings", return_value=_settings()):
        request = _make_request("127.0.0.1", {"x-real-ip": "9.9.9.9"})
        assert _client_ip(request) == "9.9.9.9"


def test_client_ip_falls_back_to_first_forwarded_hop():
    with patch("app.rate_limit_redis.get_settings", return_value=_settings()):
        request = _make_request(
            "127.0.0.1", {"x-forwarded-for": "203.0.113.7, 70.41.3.18"}
        )
        assert _client_ip(request) == "203.0.113.7"


def test_client_ip_ignores_spoofed_forwarded_values():
    with patch("app.rate_limit_redis.get_settings", return_value=_settings()):
        request = _make_request(
            "127.0.0.1", {"x-real-ip": "bogus", "x-forwarded-for": "also-bogus"}
        )
        assert _client_ip(request) == "127.0.0.1"


def test_client_ip_returns_unknown_without_client():
    with patch("app.rate_limit_redis.get_settings", return_value=_settings()):
        assert _client_ip(_make_request(None)) == "unknown"


async def test_check_rate_limit_allows_until_limit_reached():
    with _patch_redis(_FakeRedis([1, 5, 6])):
        allowed, remaining, reset_time = await check_rate_limit("rl:t", 5, 60)
        assert (allowed, remaining) == (True, 4)
        assert reset_time > 0

        allowed, remaining, _ = await check_rate_limit("rl:t", 5, 60)
        assert (allowed, remaining) == (True, 0)

        allowed, remaining, _ = await check_rate_limit("rl:t", 5, 60)
        assert (allowed, remaining) == (False, 0)


async def test_check_rate_limit_fails_open_when_redis_errors():
    with _patch_redis(_BrokenRedis()):
        allowed, remaining, reset_time = await check_rate_limit("rl:t", 7, 60)
    assert allowed is True
    assert remaining == 7
    assert reset_time > 0


async def test_enforce_route_rate_limit_uses_deterministic_counter_in_test_env():
    with patch("app.rate_limit_redis.get_settings", return_value=_settings()):
        request = _make_request("5.5.5.5")
        for _ in range(2):
            await enforce_route_rate_limit(
                request, bucket="unit", limit=2, window_seconds=60
            )

        with pytest.raises(HTTPException) as exc:
            await enforce_route_rate_limit(
                request, bucket="unit", limit=2, window_seconds=60
            )

    assert exc.value.status_code == 429
    assert exc.value.headers["X-RateLimit-Limit"] == "2"
    assert exc.value.headers["X-RateLimit-Remaining"] == "0"
    assert int(exc.value.headers["Retry-After"]) >= 0


async def test_enforce_route_rate_limit_window_resets():
    with patch("app.rate_limit_redis.get_settings", return_value=_settings()):
        request = _make_request("6.6.6.6")
        await enforce_route_rate_limit(
            request, bucket="unit", limit=1, window_seconds=0
        )
        await enforce_route_rate_limit(
            request, bucket="unit", limit=1, window_seconds=0
        )


async def test_enforce_route_rate_limit_delegates_to_redis_outside_tests():
    settings = _settings(app_env="production")
    with patch("app.rate_limit_redis.get_settings", return_value=settings):
        with _patch_redis(_FakeRedis([1, 2])):
            request = _make_request("7.7.7.7")
            await enforce_route_rate_limit(
                request, bucket="unit", limit=1, window_seconds=60
            )
            with pytest.raises(HTTPException) as exc:
                await enforce_route_rate_limit(
                    request, bucket="unit", limit=1, window_seconds=60
                )
    assert exc.value.status_code == 429


async def test_middleware_adds_rate_limit_headers_when_allowed():
    middleware = RedisRateLimitMiddleware(app=None, calls_per_minute=10)
    response = SimpleNamespace(headers={})

    async def call_next(_request):
        return response

    with patch("app.rate_limit_redis.get_settings", return_value=_settings()):
        with _patch_redis(_FakeRedis([1])):
            result = await middleware.dispatch(_make_request(), call_next)

    assert result is response
    assert response.headers["X-RateLimit-Limit"] == "10"
    assert response.headers["X-RateLimit-Remaining"] == "9"
    assert response.headers["X-RateLimit-Reset"]


async def test_middleware_raises_when_limit_exceeded():
    middleware = RedisRateLimitMiddleware(app=None, calls_per_minute=1)

    async def call_next(_request):  # pragma: no cover - must not be reached
        raise AssertionError("request should have been rejected")

    with patch("app.rate_limit_redis.get_settings", return_value=_settings()):
        with _patch_redis(_FakeRedis([2])):
            with pytest.raises(HTTPException) as exc:
                await middleware.dispatch(_make_request(), call_next)

    assert exc.value.status_code == 429
    assert exc.value.headers["X-RateLimit-Limit"] == "1"


def test_reset_test_rate_limits_clears_state():
    rate_limit_redis._test_rate_limit_counts[("bucket", "1.1.1.1")] = (0.0, 9)
    reset_test_rate_limits()
    assert rate_limit_redis._test_rate_limit_counts == {}
