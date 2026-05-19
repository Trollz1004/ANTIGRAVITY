"""Redis-backed session storage for the YouAndINotAI API.

Provides create, get, and delete operations with TTL-based expiry.
Each session is stored as a JSON blob in Redis with an auto-expiring key.
"""

import json
import logging
import uuid
from typing import Any, Optional

import redis.asyncio as redis

from app.cache import get_redis
from app.config import get_settings

logger = logging.getLogger("youandinotai.session_store")


async def create_session(
    user_id: str,
    data: dict[str, Any],
    ttl: Optional[int] = None,
) -> str:
    """Create a new session in Redis.

    Args:
        user_id: The user this session belongs to.
        data: Arbitrary session data to store.
        ttl: Time-to-live in seconds. Defaults to settings.redis_session_ttl.

    Returns:
        The generated session_id.
    """
    settings = get_settings()
    if ttl is None:
        ttl = settings.redis_session_ttl

    session_id = str(uuid.uuid4())
    key = f"session:{session_id}"

    payload = json.dumps({
        "user_id": user_id,
        "data": data,
    })

    r: redis.Redis = await get_redis()
    await r.set(key, payload, ex=ttl)

    logger.info(
        "Session created",
        extra={"session_id": session_id, "user_id": user_id, "ttl": ttl},
    )
    return session_id


async def get_session(session_id: str) -> Optional[dict[str, Any]]:
    """Retrieve session data from Redis.

    Args:
        session_id: The session ID to look up.

    Returns:
        The session dict with 'user_id' and 'data' keys, or None if not found.
    """
    key = f"session:{session_id}"
    r: redis.Redis = await get_redis()

    raw = await r.get(key)
    if raw is None:
        logger.debug("Session MISS: %s", session_id)
        return None

    try:
        session = json.loads(raw)
        logger.debug("Session HIT: %s", session_id)
        return session
    except (json.JSONDecodeError, TypeError) as exc:
        logger.warning("Session corrupt, deleting: %s (%s)", session_id, exc)
        await r.delete(key)
        return None


async def delete_session(session_id: str) -> bool:
    """Delete a session from Redis.

    Args:
        session_id: The session ID to delete.

    Returns:
        True if the session existed and was deleted, False otherwise.
    """
    key = f"session:{session_id}"
    r: redis.Redis = await get_redis()
    deleted = await r.delete(key)
    if deleted:
        logger.info("Session deleted: %s", session_id)
    return bool(deleted)


async def touch_session(session_id: str, ttl: Optional[int] = None) -> bool:
    """Refresh a session's TTL (sliding expiration).

    Args:
        session_id: The session ID to refresh.
        ttl: New TTL in seconds. Defaults to settings.redis_session_ttl.

    Returns:
        True if the session exists and was refreshed, False otherwise.
    """
    settings = get_settings()
    if ttl is None:
        ttl = settings.redis_session_ttl

    key = f"session:{session_id}"
    r: redis.Redis = await get_redis()
    return await r.expire(key, ttl)
