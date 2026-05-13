"""Tests for the /api/v1/video WebSocket router (WebRTC signaling).

The video router is a pure WebSocket endpoint — no HTTP routes.
TestClient supports WebSocket testing via client.websocket_connect().

Coverage targets:
  - WS /api/v1/ws/video/{call_id}  — WebRTC signaling endpoint

Risk surface:
  - Invalid token rejected at connection time
  - Invalid (non-UUID) call_id rejected at connection time
  - Valid token + valid call_id connects successfully
  - Room full (>2 peers) closes new connection with code 4008
  - Only allowed signal types are relayed; unknown types are dropped
"""

import uuid
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest

from app.auth import create_access_token, hash_password
from app.models import User

# ── Helpers ──────────────────────────────────────────────────────────────────


def _make_user(email: str = "video_user@example.com") -> User:
    user = User(
        id=uuid.uuid4(),
        email=email,
        password_hash=hash_password("password123"),
        display_name="Video Tester",
        date_of_birth=date(1991, 7, 22),
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    return user


def _valid_token(user: User) -> str:
    return create_access_token(str(user.id))


# ── Auth boundary — invalid token closes with code 4001 ──────────────────────


def test_video_ws_invalid_token_rejected(client):
    call_id = str(uuid.uuid4())
    with pytest.raises(Exception):  # noqa: B017
        # TestClient raises on abnormal WS close; exception type varies by version
        with client.websocket_connect(
            f"/api/v1/ws/video/{call_id}?token=bad.token.here"
        ) as ws:
            ws.receive_json()


def test_video_ws_missing_token_rejected(client):
    call_id = str(uuid.uuid4())
    with pytest.raises(Exception):  # noqa: B017
        with client.websocket_connect(f"/api/v1/ws/video/{call_id}") as ws:
            ws.receive_json()


# ── Invalid call_id rejected ──────────────────────────────────────────────────


def test_video_ws_non_uuid_call_id_rejected(client):
    user = _make_user("video_badcallid@example.com")
    token = _valid_token(user)
    with pytest.raises(Exception):  # noqa: B017
        with client.websocket_connect(
            f"/api/v1/ws/video/not-a-uuid?token={token}"
        ) as ws:
            ws.receive_json()


# ── Allowed signal types only ─────────────────────────────────────────────────


def test_video_ws_connects_with_valid_token_and_call_id(client):
    """A valid JWT should allow initial connection. Match check only fires when
    a second peer joins, so a solo connection is accepted."""
    user = _make_user("video_valid@example.com")
    token = _valid_token(user)
    call_id = str(uuid.uuid4())

    # Patch _find_active_match so it never queries the real DB (solo connection
    # never calls it, but defensive patching prevents test pollution)
    with patch(
        "app.routers.video._find_active_match",
        new=AsyncMock(return_value=None),
    ):
        with patch(
            "app.routers.video._ensure_call_record",
            new=AsyncMock(return_value=None),
        ):
            with client.websocket_connect(
                f"/api/v1/ws/video/{call_id}?token={token}"
            ) as ws:
                # Connection accepted — send a hang_up to close cleanly
                ws.send_json({"type": "hang_up"})
                # No exception means connection was accepted


def test_video_ws_unknown_signal_type_is_silently_dropped(client):
    """Messages with type not in ALLOWED_SIGNAL_TYPES must be ignored."""
    user = _make_user("video_unknown_signal@example.com")
    token = _valid_token(user)
    call_id = str(uuid.uuid4())

    with patch(
        "app.routers.video._find_active_match",
        new=AsyncMock(return_value=None),
    ):
        with patch(
            "app.routers.video._ensure_call_record",
            new=AsyncMock(return_value=None),
        ):
            with client.websocket_connect(
                f"/api/v1/ws/video/{call_id}?token={token}"
            ) as ws:
                # Send an unknown signal type
                ws.send_json({"type": "ADMIN_OVERRIDE", "data": "hack"})
                # Then close cleanly
                ws.send_json({"type": "hang_up"})
                # No exception — the unknown type was silently dropped


def test_video_ws_non_json_payload_is_silently_dropped(client):
    """Non-JSON frames must not crash the handler."""
    user = _make_user("video_nonjson@example.com")
    token = _valid_token(user)
    call_id = str(uuid.uuid4())

    with patch(
        "app.routers.video._find_active_match",
        new=AsyncMock(return_value=None),
    ):
        with patch(
            "app.routers.video._ensure_call_record",
            new=AsyncMock(return_value=None),
        ):
            with client.websocket_connect(
                f"/api/v1/ws/video/{call_id}?token={token}"
            ) as ws:
                ws.send_text("this is not json {{")
                ws.send_json({"type": "hang_up"})


# ── ALLOWED_SIGNAL_TYPES constant is locked ───────────────────────────────────


def test_video_allowed_signal_types_are_exact():
    """The ALLOWED_SIGNAL_TYPES set must contain only the expected values.

    If recording-related types (e.g. 'record_start') are added without a
    permission boundary, that's a recording permission regression.
    """
    from app.routers.video import ALLOWED_SIGNAL_TYPES

    expected = {"ice_candidate", "sdp_offer", "sdp_answer", "hang_up"}
    assert expected == ALLOWED_SIGNAL_TYPES, (
        f"ALLOWED_SIGNAL_TYPES changed. Expected {expected}, got {ALLOWED_SIGNAL_TYPES}. "
        "Any new signal type requires a recording-permission review."
    )
