"""Tests for the Redis caching layer.

Uses fakeredis to mock Redis for unit tests.
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import Request
from fastapi.responses import JSONResponse

from app.cache import (
    _build_cache_key,
    cache_response,
    get_redis,
    invalidate_cache,
    redis_health_check,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _clear_redis_singleton():
    """Reset the global Redis pool between tests."""
    import app.cache as cache_mod

    cache_mod._redis_pool = None
    yield
    cache_mod._redis_pool = None


@pytest.fixture
def fake_redis():
    """Provide a fakeredis instance and patch the cache module."""
    try:
        import fakeredis.aioredis as fakeredis_aioredis
    except ImportError:
        pytest.skip("fakeredis not installed")

    r = fakeredis_aioredis.FakeRedis(decode_responses=True)
    with patch("app.cache._redis_pool", r):
        yield r


# ---------------------------------------------------------------------------
# cache.py tests
# ---------------------------------------------------------------------------


class TestGetRedis:
    @pytest.mark.asyncio
    async def test_get_redis_returns_instance(self, fake_redis):
        r = await get_redis()
        assert r is not None

    @pytest.mark.asyncio
    async def test_get_redis_singleton(self, fake_redis):
        r1 = await get_redis()
        r2 = await get_redis()
        assert r1 is r2


class TestRedisHealthCheck:
    @pytest.mark.asyncio
    async def test_health_check_ok(self, fake_redis):
        health = await redis_health_check()
        assert health["status"] == "ok"
        assert "latency_ms" in health

    @pytest.mark.asyncio
    async def test_health_check_error(self):
        """When Redis is unreachable, health check returns error."""
        import app.cache as cache_mod

        cache_mod._redis_pool = None

        mock_pool = AsyncMock()
        mock_pool.ping.side_effect = Exception("Connection refused")
        with patch("app.cache._redis_pool", mock_pool):
            health = await redis_health_check()
            assert health["status"] == "error"


class TestBuildCacheKey:
    def test_build_cache_key_deterministic(self):
        req = MagicMock(spec=Request)
        req.method = "GET"
        req.url.path = "/api/v1/test"
        req.query_params.multi_items.return_value = []
        req.headers.get.return_value = ""

        key1 = _build_cache_key("api", req)
        key2 = _build_cache_key("api", req)
        assert key1 == key2

    def test_build_cache_key_varies_by_path(self):
        req1 = MagicMock(spec=Request)
        req1.method = "GET"
        req1.url.path = "/api/v1/a"
        req1.query_params.multi_items.return_value = []
        req1.headers.get.return_value = ""

        req2 = MagicMock(spec=Request)
        req2.method = "GET"
        req2.url.path = "/api/v1/b"
        req2.query_params.multi_items.return_value = []
        req2.headers.get.return_value = ""

        key1 = _build_cache_key("api", req1)
        key2 = _build_cache_key("api", req2)
        assert key1 != key2

    def test_build_cache_key_varies_by_query(self):
        req1 = MagicMock(spec=Request)
        req1.method = "GET"
        req1.url.path = "/api/v1/test"
        req1.query_params.multi_items.return_value = [("page", "1")]
        req1.headers.get.return_value = ""

        req2 = MagicMock(spec=Request)
        req2.method = "GET"
        req2.url.path = "/api/v1/test"
        req2.query_params.multi_items.return_value = [("page", "2")]
        req2.headers.get.return_value = ""

        key1 = _build_cache_key("api", req1)
        key2 = _build_cache_key("api", req2)
        assert key1 != key2


class TestCacheResponseDecorator:
    @pytest.mark.asyncio
    async def test_cache_miss_calls_endpoint(self, fake_redis):
        """On cache miss, the endpoint is called and result is cached."""
        call_count = 0

        @cache_response(ttl=60, prefix="test")
        async def endpoint(request: Request):
            nonlocal call_count
            call_count += 1
            return JSONResponse(content={"count": call_count})

        req = MagicMock(spec=Request)
        req.method = "GET"
        req.url.path = "/api/v1/test"
        req.query_params.multi_items.return_value = []
        req.headers.get.return_value = ""

        resp1 = await endpoint(request=req)
        body1 = json.loads(resp1.body)
        assert body1["count"] == 1

        # Second call should hit cache
        resp2 = await endpoint(request=req)
        body2 = json.loads(resp2.body)
        assert body2["count"] == 1  # Same as first call (cached)
        assert call_count == 1  # Endpoint only called once

    @pytest.mark.asyncio
    async def test_non_get_not_cached(self, fake_redis):
        """POST requests should not be cached."""
        call_count = 0

        @cache_response(ttl=60, prefix="test")
        async def endpoint(request: Request):
            nonlocal call_count
            call_count += 1
            return JSONResponse(content={"count": call_count})

        req = MagicMock(spec=Request)
        req.method = "POST"
        req.url.path = "/api/v1/test"
        req.query_params.multi_items.return_value = []
        req.headers.get.return_value = ""

        await endpoint(request=req)
        await endpoint(request=req)
        assert call_count == 2  # Called twice, not cached


class TestInvalidateCache:
    @pytest.mark.asyncio
    async def test_invalidate_removes_keys(self, fake_redis):
        """invalidate_cache should delete matching keys."""
        await fake_redis.set("api:test:1", "data1")
        await fake_redis.set("api:test:2", "data2")
        await fake_redis.set("other:keep", "data3")

        deleted = await invalidate_cache("api:test:*")
        assert deleted == 2
        assert await fake_redis.get("other:keep") == "data3"

    @pytest.mark.asyncio
    async def test_invalidate_empty_pattern(self, fake_redis):
        deleted = await invalidate_cache("nonexistent:*")
        assert deleted == 0


# ---------------------------------------------------------------------------
# session_store.py tests
# ---------------------------------------------------------------------------


class TestSessionStore:
    @pytest.mark.asyncio
    async def test_create_and_get_session(self, fake_redis):
        from app.session_store import create_session, get_session

        sid = await create_session("user-1", {"role": "admin"}, ttl=3600)
        assert sid is not None

        session = await get_session(sid)
        assert session is not None
        assert session["user_id"] == "user-1"
        assert session["data"]["role"] == "admin"

    @pytest.mark.asyncio
    async def test_get_nonexistent_session(self, fake_redis):
        from app.session_store import get_session

        session = await get_session("nonexistent-id")
        assert session is None

    @pytest.mark.asyncio
    async def test_delete_session(self, fake_redis):
        from app.session_store import create_session, delete_session, get_session

        sid = await create_session("user-1", {"role": "admin"})
        assert await get_session(sid) is not None

        deleted = await delete_session(sid)
        assert deleted is True
        assert await get_session(sid) is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent_session(self, fake_redis):
        from app.session_store import delete_session

        deleted = await delete_session("nonexistent-id")
        assert deleted is False

    @pytest.mark.asyncio
    async def test_session_ttl(self, fake_redis):
        from app.session_store import create_session

        sid = await create_session("user-1", {"role": "admin"}, ttl=10)
        ttl = await fake_redis.ttl(f"session:{sid}")
        assert 0 < ttl <= 10

    @pytest.mark.asyncio
    async def test_touch_session(self, fake_redis):
        from app.session_store import create_session, touch_session

        sid = await create_session("user-1", {"role": "admin"}, ttl=10)
        result = await touch_session(sid, ttl=600)
        assert result is True
        ttl = await fake_redis.ttl(f"session:{sid}")
        assert ttl > 10


# ---------------------------------------------------------------------------
# rate_limit_redis.py tests
# ---------------------------------------------------------------------------


class TestCheckRateLimit:
    @pytest.mark.asyncio
    async def test_allows_under_limit(self, fake_redis):
        from app.rate_limit_redis import check_rate_limit

        allowed, remaining, reset_time = await check_rate_limit(
            "test:key", limit=5, window_seconds=60
        )
        assert allowed is True
        assert remaining == 4

    @pytest.mark.asyncio
    async def test_blocks_over_limit(self, fake_redis):
        from app.rate_limit_redis import check_rate_limit

        for _ in range(5):
            await check_rate_limit("test:block", limit=5, window_seconds=60)

        allowed, remaining, _ = await check_rate_limit(
            "test:block", limit=5, window_seconds=60
        )
        assert allowed is False
        assert remaining == 0

    @pytest.mark.asyncio
    async def test_separate_keys_independent(self, fake_redis):
        from app.rate_limit_redis import check_rate_limit

        for _ in range(5):
            await check_rate_limit("test:indep-a", limit=5, window_seconds=60)

        # Different key should still be allowed
        allowed, _, _ = await check_rate_limit(
            "test:indep-b", limit=5, window_seconds=60
        )
        assert allowed is True

    @pytest.mark.asyncio
    async def test_fail_open_on_redis_error(self):
        from app.rate_limit_redis import check_rate_limit

        mock_pool = AsyncMock()
        mock_pool.pipeline.side_effect = Exception("Redis down")
        with patch("app.cache._redis_pool", mock_pool):
            allowed, remaining, _ = await check_rate_limit(
                "test:failopen", limit=5, window_seconds=60
            )
            assert allowed is True  # Fail open


class TestClientIp:
    def test_direct_ip(self):
        from app.rate_limit_redis import _client_ip

        req = MagicMock(spec=Request)
        req.client.host = "192.168.1.100"
        req.headers.get.return_value = None

        # Clear cached trusted networks
        _client_ip._trusted_networks = ()  # type: ignore[attr-defined]

        ip = _client_ip(req)
        assert ip == "192.168.1.100"

    def test_no_client(self):
        from app.rate_limit_redis import _client_ip

        req = MagicMock(spec=Request)
        req.client = None
        req.headers.get.return_value = None

        _client_ip._trusted_networks = ()  # type: ignore[attr-defined]

        ip = _client_ip(req)
        assert ip == "unknown"
