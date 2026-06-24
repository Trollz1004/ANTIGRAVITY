"""Tests for WebSocket authentication handler.

Covers the get_current_websocket_user dependency in
app/dependencies/websocket_auth.py with mocked membership record decode
and database session to avoid needing a real DB or JWT secret.
"""

# ---------------------------------------------------------------------------
# Ensure the app root is importable (mirrors conftest.py pattern)
# ---------------------------------------------------------------------------
import os
import sys
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import WebSocketException, status

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault(
    "JWT_SECRET", "test-secret-that-is-at-least-32-characters-long-for-security"
)
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

from app.dependencies.websocket_auth import get_current_websocket_user  # noqa: E402

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_user(*, is_active: bool = True) -> MagicMock:
    """Return a lightweight mock User with the attributes the auth code uses."""
    user = MagicMock()
    user.id = uuid.uuid4()
    user.email = "test@example.com"
    user.display_name = "Test User"
    user.is_active = is_active
    return user


def _make_websocket() -> MagicMock:
    """Return a minimal mock WebSocket object."""
    ws = MagicMock()
    ws.query_params = {"token": "valid-membership record"}
    return ws


def _make_db_session(return_value=None) -> AsyncMock:
    """Return a mock AsyncSession whose .scalar() returns *return_value*."""
    session = AsyncMock()
    session.scalar = AsyncMock(return_value=return_value)
    return session


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_valid_token_returns_user():
    """Successful authentication returns the correct User object."""
    user = _make_user()
    db = _make_db_session(return_value=user)
    websocket = _make_websocket()
    membership_record = "valid-membership record"
    user_id_str = str(user.id)

    with patch(
        "app.dependencies.websocket_auth.decode_token",
        return_value={"sub": user_id_str},
    ):
        result = await get_current_websocket_user(
            websocket=websocket,
            token=membership_record,
            db=db,
        )

    assert result is user
    db.scalar.assert_called_once()


@pytest.mark.asyncio
async def test_invalid_token_raises_websocket_exception():
    """An invalid (malformed / expired) membership record should raise WS 1008."""
    db = _make_db_session()
    websocket = _make_websocket()

    with patch(
        "app.dependencies.websocket_auth.decode_token",
        side_effect=Exception("membership record expired"),
    ):
        with pytest.raises(WebSocketException) as exc_info:
            await get_current_websocket_user(
                websocket=websocket,
                token="bad-membership record",
                db=db,
            )

    assert exc_info.value.code == status.WS_1008_POLICY_VIOLATION
    assert exc_info.value.reason == "Could not validate credentials"


@pytest.mark.asyncio
async def test_missing_token_raises_websocket_exception():
    """A missing/empty membership record string should raise WS 1008."""
    db = _make_db_session()
    websocket = MagicMock()
    websocket.query_params = {}

    # FastAPI will not even call the dependency when the Query param is
    # missing, but if it does (e.g. token=""), decode_token will fail.
    with patch(
        "app.dependencies.websocket_auth.decode_token",
        side_effect=Exception("missing membership record"),
    ):
        with pytest.raises(WebSocketException) as exc_info:
            await get_current_websocket_user(
                websocket=websocket,
                token="",
                db=db,
            )

    assert exc_info.value.code == status.WS_1008_POLICY_VIOLATION


@pytest.mark.asyncio
async def test_token_missing_sub_claim_raises_websocket_exception():
    """A membership record payload without a 'sub' key should raise WS 1008."""
    db = _make_db_session()
    websocket = _make_websocket()

    with patch(
        "app.dependencies.websocket_auth.decode_token",
        return_value={"exp": 1234567890},  # no 'sub'
    ):
        with pytest.raises(WebSocketException) as exc_info:
            await get_current_websocket_user(
                websocket=websocket,
                token="membership record-without-sub",
                db=db,
            )

    assert exc_info.value.code == status.WS_1008_POLICY_VIOLATION
    assert exc_info.value.reason == "Invalid membership record payload"


@pytest.mark.asyncio
async def test_user_not_found_raises_websocket_exception():
    """When the user ID from the membership record doesn't exist in DB → WS 1008."""
    db = _make_db_session(return_value=None)
    websocket = _make_websocket()
    fake_user_id = str(uuid.uuid4())

    with patch(
        "app.dependencies.websocket_auth.decode_token",
        return_value={"sub": fake_user_id},
    ):
        with pytest.raises(WebSocketException) as exc_info:
            await get_current_websocket_user(
                websocket=websocket,
                token="valid-membership record-but-no-user",
                db=db,
            )

    assert exc_info.value.code == status.WS_1008_POLICY_VIOLATION
    assert exc_info.value.reason == "User not found"


@pytest.mark.asyncio
async def test_inactive_user_raises_websocket_exception():
    """An inactive user should raise WS 1008."""
    user = _make_user(is_active=False)
    db = _make_db_session(return_value=user)
    websocket = _make_websocket()
    user_id_str = str(user.id)

    with patch(
        "app.dependencies.websocket_auth.decode_token",
        return_value={"sub": user_id_str},
    ):
        with pytest.raises(WebSocketException) as exc_info:
            await get_current_websocket_user(
                websocket=websocket,
                token="valid-membership record-inactive-user",
                db=db,
            )

    assert exc_info.value.code == status.WS_1008_POLICY_VIOLATION
    assert exc_info.value.reason == "Account is inactive"


@pytest.mark.asyncio
async def test_sub_is_uuid_string():
    """The 'sub' claim is correctly parsed as a UUID."""
    user = _make_user()
    db = _make_db_session(return_value=user)
    websocket = _make_websocket()
    # Pass the UUID as a string (as JWT stores it)
    user_id_str = str(user.id)

    with patch(
        "app.dependencies.websocket_auth.decode_token",
        return_value={"sub": user_id_str},
    ) as mock_decode:
        result = await get_current_websocket_user(
            websocket=websocket,
            token="valid-membership record",
            db=db,
        )

    assert result is user
    mock_decode.assert_called_once_with("valid-membership record")
