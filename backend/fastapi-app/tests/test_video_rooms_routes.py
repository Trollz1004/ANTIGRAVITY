"""Tests for the /api/v1/video/rooms router (Daily.co room management).

Coverage targets:
  - POST /api/v1/video/rooms/{match_id} — create or retrieve a Daily.co room

Risk surface:
  - Auth boundary: unauthenticated requests rejected
  - Invalid match_id (non-UUID) returns 422
  - Room capacity: max_participants = 2 (verified via mock response)
  - Access control: only authenticated users can create rooms
  - Misconfiguration (no API key): 503, never a fabricated room URL
  - Daily.co API error: 502 propagated
"""

import uuid
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import httpx

from app.auth import get_current_user, hash_password
from app.main import app
from app.models import User

# ── Helpers ──────────────────────────────────────────────────────────────────


def _make_user(email: str = "rooms_user@example.com") -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash=hash_password("password123"),
        display_name="Rooms Tester",
        date_of_birth=date(1993, 9, 5),
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _override_user(user: User):
    async def _dep():
        return user

    return _dep


# ── Auth boundary ─────────────────────────────────────────────────────────────


def test_create_room_requires_auth(client):
    match_id = str(uuid.uuid4())
    resp = client.post(f"/api/v1/video/rooms/{match_id}")
    assert resp.status_code in (401, 403)


def test_create_room_invalid_token_rejected(client):
    match_id = str(uuid.uuid4())
    resp = client.post(
        f"/api/v1/video/rooms/{match_id}",
        headers={"Authorization": "Bearer bad.token.value"},
    )
    assert resp.status_code == 401


# ── Validation ────────────────────────────────────────────────────────────────


def test_create_room_non_uuid_match_id_returns_422(client):
    user = _make_user("rooms_bad_id@example.com")
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.post("/api/v1/video/rooms/not-a-uuid")
        assert resp.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── Misconfiguration: no API key is a 503, never a fake room ─────────────────


def test_create_room_without_api_key_returns_503(client):
    """A missing Daily.co key must never fabricate a fake joinable room URL."""
    user = _make_user("rooms_dev@example.com")
    app.dependency_overrides[get_current_user] = _override_user(user)
    match_id = uuid.uuid4()
    try:
        with patch("app.routers.video_rooms.settings") as mock_settings:
            mock_settings.daily_api_key = ""  # provider not configured

            resp = client.post(f"/api/v1/video/rooms/{match_id}")

        assert resp.status_code == 503, resp.text
        assert "not configured" in resp.json()["detail"]
        # No synthetic/mock room fields leak into the response.
        assert "room_url" not in resp.json()
        assert "is_mock" not in resp.json()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── Live mode: successful Daily.co API call ───────────────────────────────────


def test_create_room_live_mode_happy_path(client):
    user = _make_user("rooms_live@example.com")
    app.dependency_overrides[get_current_user] = _override_user(user)
    match_id = uuid.uuid4()
    room_name = f"match-{match_id}"
    room_url = f"https://youandinotai.daily.co/{room_name}"

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"url": room_url, "name": room_name}
    mock_response.text = ""

    try:
        with patch("app.routers.video_rooms.settings") as mock_settings:
            mock_settings.daily_api_key = "test-daily-key"

            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("httpx.AsyncClient", return_value=mock_client):
                resp = client.post(f"/api/v1/video/rooms/{match_id}")

        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["room_url"] == room_url
        assert data["room_name"] == room_name
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── Room capacity: max_participants enforced in request ───────────────────────


def test_create_room_requests_max_2_participants(client):
    """Room creation payload must set max_participants=2 to enforce pair-only calls."""
    user = _make_user("rooms_capacity@example.com")
    app.dependency_overrides[get_current_user] = _override_user(user)
    match_id = uuid.uuid4()

    captured_payload = {}

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "url": f"https://youandinotai.daily.co/match-{match_id}",
        "name": f"match-{match_id}",
    }
    mock_response.text = ""

    async def capture_post(url, **kwargs):
        captured_payload.update(kwargs.get("json", {}))
        return mock_response

    try:
        with patch("app.routers.video_rooms.settings") as mock_settings:
            mock_settings.daily_api_key = "test-daily-key"

            mock_client = AsyncMock()
            mock_client.post = capture_post
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("httpx.AsyncClient", return_value=mock_client):
                resp = client.post(f"/api/v1/video/rooms/{match_id}")

        assert resp.status_code == 200
        props = captured_payload.get("properties", {})
        assert (
            props.get("max_participants") == 2
        ), f"Room max_participants should be 2 to enforce pair-only access, got {props.get('max_participants')}"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── Daily.co API error: 502 propagated ───────────────────────────────────────


def test_create_room_daily_api_error_returns_502(client):
    user = _make_user("rooms_api_error@example.com")
    app.dependency_overrides[get_current_user] = _override_user(user)
    match_id = uuid.uuid4()

    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "Internal Server Error"

    try:
        with patch("app.routers.video_rooms.settings") as mock_settings:
            mock_settings.daily_api_key = "test-daily-key"

            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("httpx.AsyncClient", return_value=mock_client):
                resp = client.post(f"/api/v1/video/rooms/{match_id}")

        assert resp.status_code == 502
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_room_daily_connection_error_returns_502(client):
    user = _make_user("rooms_conn_error@example.com")
    app.dependency_overrides[get_current_user] = _override_user(user)
    match_id = uuid.uuid4()

    try:
        with patch("app.routers.video_rooms.settings") as mock_settings:
            mock_settings.daily_api_key = "test-daily-key"

            mock_client = AsyncMock()
            mock_client.post = AsyncMock(
                side_effect=httpx.RequestError(
                    "Connection refused", request=MagicMock()
                )
            )
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("httpx.AsyncClient", return_value=mock_client):
                resp = client.post(f"/api/v1/video/rooms/{match_id}")

        assert resp.status_code == 502
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── Existing room conflict (already exists) ───────────────────────────────────


def test_create_room_handles_existing_room_conflict(client):
    """If Daily.co returns 400 'already exists', router should retrieve existing room."""
    user = _make_user("rooms_existing@example.com")
    app.dependency_overrides[get_current_user] = _override_user(user)
    match_id = uuid.uuid4()
    room_name = f"match-{match_id}"
    room_url = f"https://youandinotai.daily.co/{room_name}"

    conflict_response = MagicMock()
    conflict_response.status_code = 400
    conflict_response.text = "Room already exists"

    get_response = MagicMock()
    get_response.status_code = 200
    get_response.json.return_value = {"url": room_url, "name": room_name}

    try:
        with patch("app.routers.video_rooms.settings") as mock_settings:
            mock_settings.daily_api_key = "test-daily-key"

            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=conflict_response)
            mock_client.get = AsyncMock(return_value=get_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("httpx.AsyncClient", return_value=mock_client):
                resp = client.post(f"/api/v1/video/rooms/{match_id}")

        assert resp.status_code == 200
        data = resp.json()
        assert data["room_url"] == room_url
        assert data["room_name"] == room_name
    finally:
        app.dependency_overrides.pop(get_current_user, None)
