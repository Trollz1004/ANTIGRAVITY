"""Tests for app.session_store — Redis-backed session CRUD.

Uses fakeredis (already in requirements) to avoid real Redis dependency.
"""

import json
from unittest.mock import AsyncMock, patch

import pytest

from app.session_store import (
    create_session,
    delete_session,
    get_session,
    touch_session,
)


@pytest.fixture
def mock_redis():
    """Provide a mock Redis client that behaves like an async store."""
    store = {}

    async def mock_set(key, value, ex=None):
        store[key] = value

    async def mock_get(key):
        return store.get(key)

    async def mock_delete(key):
        if key in store:
            del store[key]
            return 1
        return 0

    async def mock_expire(key, ttl):
        return key in store

    redis_mock = AsyncMock()
    redis_mock.set = AsyncMock(side_effect=mock_set)
    redis_mock.get = AsyncMock(side_effect=mock_get)
    redis_mock.delete = AsyncMock(side_effect=mock_delete)
    redis_mock.expire = AsyncMock(side_effect=mock_expire)

    return redis_mock, store


@pytest.mark.asyncio
async def test_create_session(mock_redis):
    redis_mock, store = mock_redis
    with patch("app.session_store.get_redis", return_value=redis_mock):
        session_id = await create_session("user-123", {"role": "admin"}, ttl=3600)
        assert isinstance(session_id, str)
        assert len(session_id) > 0
        # Verify it was stored
        key = f"session:{session_id}"
        assert key in store


@pytest.mark.asyncio
async def test_get_session_hit(mock_redis):
    redis_mock, store = mock_redis
    payload = json.dumps({"user_id": "user-123", "data": {"role": "admin"}})
    store["session:test-id"] = payload

    with patch("app.session_store.get_redis", return_value=redis_mock):
        result = await get_session("test-id")
        assert result is not None
        assert result["user_id"] == "user-123"
        assert result["data"]["role"] == "admin"


@pytest.mark.asyncio
async def test_get_session_miss(mock_redis):
    redis_mock, store = mock_redis
    with patch("app.session_store.get_redis", return_value=redis_mock):
        result = await get_session("nonexistent")
        assert result is None


@pytest.mark.asyncio
async def test_get_session_corrupt(mock_redis):
    redis_mock, store = mock_redis
    store["session:bad"] = b"not valid json {{"

    with patch("app.session_store.get_redis", return_value=redis_mock):
        result = await get_session("bad")
        assert result is None
        # Should have been deleted
        assert "session:bad" not in store


@pytest.mark.asyncio
async def test_delete_session(mock_redis):
    redis_mock, store = mock_redis
    store["session:to-delete"] = "payload"

    with patch("app.session_store.get_redis", return_value=redis_mock):
        result = await delete_session("to-delete")
        assert result is True


@pytest.mark.asyncio
async def test_delete_session_miss(mock_redis):
    redis_mock, store = mock_redis
    with patch("app.session_store.get_redis", return_value=redis_mock):
        result = await delete_session("nonexistent")
        assert result is False


@pytest.mark.asyncio
async def test_touch_session(mock_redis):
    redis_mock, store = mock_redis
    store["session:alive"] = "payload"

    with patch("app.session_store.get_redis", return_value=redis_mock):
        result = await touch_session("alive", ttl=7200)
        assert result is True
