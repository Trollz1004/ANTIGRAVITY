"""Tests for the /api/v1/video/rooms router (Daily.co room management).

Coverage targets:
  - POST /api/v1/video/rooms/{match_id} — create or retrieve a Daily.co room

Risk surface:
  - Auth boundary: unauthenticated requests rejected
  - Invalid match_id (non-UUID) returns 422
  - Room capacity: max_participants = 2 (verified via mock response)
  - Access control: caller must be verified and an active-match participant,
    and the other participant must be currently verified too
  - Misconfiguration (no API key): 503, never a fabricated room URL
  - Daily.co API error: 502 propagated
"""

import uuid
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import httpx

from app.auth import get_current_user, hash_password
from app.main import app
from app.models import Match, User
from tests.helpers import override_user, seed

# ── Helpers ──────────────────────────────────────────────────────────────────


def _make_user(email: str = "rooms_user@example.com") -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash=hash_password("password123"),
        display_name="Rooms Tester",
        date_of_birth=date(1993, 9, 5),
        is_active=True,
        bot_shield_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _seed_active_match(user: User, db_session_factory) -> Match:
    """Create an active Match between ``user`` and a verified partner."""
    partner = User(
        id=uuid.uuid4(),
        email=f"rooms_partner_{uuid.uuid4().hex[:8]}@example.com",
        password_hash=hash_password("password123"),
        display_name="Rooms Partner",
        date_of_birth=date(1993, 9, 5),
        is_active=True,
        bot_shield_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    match = Match(
        id=uuid.uuid4(),
        user_a=user.id,
        user_b=partner.id,
        status="active",
        matched_at=datetime.now(timezone.utc),
    )
    seed(user, partner, match, db_session_factory=db_session_factory)
    return match


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


# ── Match-participation and verification gating ───────────────────────────────


def test_create_room_unknown_match_returns_404(client):
    """A match_id with no backing Match row must never hand out a room."""
    user = _make_user("rooms_no_match@example.com")
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.post(f"/api/v1/video/rooms/{uuid.uuid4()}")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_room_non_participant_returns_404(client, db_session_factory):
    """A caller who isn't in the match must not be able to create its room."""
    owner = _make_user("rooms_owner@example.com")
    match = _seed_active_match(owner, db_session_factory)
    outsider = _make_user("rooms_outsider@example.com")
    seed(outsider, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(outsider)
    try:
        resp = client.post(f"/api/v1/video/rooms/{match.id}")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_room_unverified_other_participant_returns_403(
    client, db_session_factory
):
    """The other participant losing verified status must close the room, too."""
    user = _make_user("rooms_caller@example.com")
    partner = User(
        id=uuid.uuid4(),
        email=f"rooms_unverified_{uuid.uuid4().hex[:8]}@example.com",
        password_hash=hash_password("password123"),
        display_name="Unverified Partner",
        date_of_birth=date(1993, 9, 5),
        is_active=True,
        bot_shield_verified=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    match = Match(
        id=uuid.uuid4(),
        user_a=user.id,
        user_b=partner.id,
        status="active",
        matched_at=datetime.now(timezone.utc),
    )
    seed(user, partner, match, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.post(f"/api/v1/video/rooms/{match.id}")
        assert resp.status_code == 403
        assert "not verified" in resp.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── Validation ────────────────────────────────────────────────────────────────


def test_create_room_non_uuid_match_id_returns_422(client):
    user = _make_user("rooms_bad_id@example.com")
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.post("/api/v1/video/rooms/not-a-uuid")
        assert resp.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── Misconfiguration: no API key is a 503, never a fake room ─────────────────


def test_create_room_without_api_key_returns_503(client, db_session_factory):
    """A missing Daily.co key must never fabricate a fake joinable room URL."""
    user = _make_user("rooms_dev@example.com")
    match = _seed_active_match(user, db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    match_id = match.id
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


def _mock_daily_post(create_response, token_response, update_response=None):
    """Route mocked POSTs by URL: create vs. privatize-existing vs. token issuance."""

    async def _post(url, **kwargs):
        if url.endswith("/meeting-tokens"):
            return token_response
        if url == "https://api.daily.co/v1/rooms":
            return create_response
        return update_response

    return _post


def test_create_room_live_mode_happy_path(client, db_session_factory):
    user = _make_user("rooms_live@example.com")
    match = _seed_active_match(user, db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    match_id = match.id
    room_name = f"match-{match_id}"
    room_url = f"https://youandinotai.daily.co/{room_name}"

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"url": room_url, "name": room_name}
    mock_response.text = ""

    token_response = MagicMock()
    token_response.status_code = 200
    token_response.json.return_value = {"token": "test-meeting-token"}
    token_response.text = ""

    try:
        with patch("app.routers.video_rooms.settings") as mock_settings:
            mock_settings.daily_api_key = "test-daily-key"

            mock_client = AsyncMock()
            mock_client.post = _mock_daily_post(mock_response, token_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("httpx.AsyncClient", return_value=mock_client):
                resp = client.post(f"/api/v1/video/rooms/{match_id}")

        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["room_url"] == room_url
        assert data["room_name"] == room_name
        assert data["token"] == "test-meeting-token"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── Room capacity: max_participants enforced in request ───────────────────────


def test_create_room_requests_max_2_participants_and_is_private(
    client, db_session_factory
):
    """Room payload must set max_participants=2 and privacy=private."""
    user = _make_user("rooms_capacity@example.com")
    match = _seed_active_match(user, db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    match_id = match.id

    captured_room_payload = {}

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "url": f"https://youandinotai.daily.co/match-{match_id}",
        "name": f"match-{match_id}",
    }
    mock_response.text = ""

    token_response = MagicMock()
    token_response.status_code = 200
    token_response.json.return_value = {"token": "test-meeting-token"}
    token_response.text = ""

    async def capture_post(url, **kwargs):
        if url.endswith("/meeting-tokens"):
            return token_response
        captured_room_payload.update(kwargs.get("json", {}))
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
        assert (
            captured_room_payload.get("privacy") == "private"
        ), "Room must be private -- a public room lets anyone with the link join, bypassing the verification gate"
        props = captured_room_payload.get("properties", {})
        assert (
            props.get("max_participants") == 2
        ), f"Room max_participants should be 2 to enforce pair-only access, got {props.get('max_participants')}"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── Daily.co API error: 502 propagated ───────────────────────────────────────


def test_create_room_daily_api_error_returns_502(client, db_session_factory):
    user = _make_user("rooms_api_error@example.com")
    match = _seed_active_match(user, db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    match_id = match.id

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


def test_create_room_token_issuance_failure_returns_502(client, db_session_factory):
    """A room without a joinable token defeats the private-room gate -- must 502."""
    user = _make_user("rooms_token_error@example.com")
    match = _seed_active_match(user, db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    match_id = match.id

    room_response = MagicMock()
    room_response.status_code = 200
    room_response.json.return_value = {
        "url": f"https://youandinotai.daily.co/match-{match_id}",
        "name": f"match-{match_id}",
    }
    room_response.text = ""

    token_error_response = MagicMock()
    token_error_response.status_code = 500
    token_error_response.text = "Token service unavailable"

    try:
        with patch("app.routers.video_rooms.settings") as mock_settings:
            mock_settings.daily_api_key = "test-daily-key"

            mock_client = AsyncMock()
            mock_client.post = _mock_daily_post(room_response, token_error_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("httpx.AsyncClient", return_value=mock_client):
                resp = client.post(f"/api/v1/video/rooms/{match_id}")

        assert resp.status_code == 502
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_room_daily_connection_error_returns_502(client, db_session_factory):
    user = _make_user("rooms_conn_error@example.com")
    match = _seed_active_match(user, db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    match_id = match.id

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


def test_create_room_handles_existing_room_conflict(client, db_session_factory):
    """A pre-existing PRIVATE room (already created by this code) skips the
    privatize step and goes straight to token issuance."""
    user = _make_user("rooms_existing@example.com")
    match = _seed_active_match(user, db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    match_id = match.id
    room_name = f"match-{match_id}"
    room_url = f"https://youandinotai.daily.co/{room_name}"

    conflict_response = MagicMock()
    conflict_response.status_code = 400
    conflict_response.text = "Room already exists"

    get_response = MagicMock()
    get_response.status_code = 200
    get_response.json.return_value = {
        "url": room_url,
        "name": room_name,
        "privacy": "private",
    }

    update_response = MagicMock()
    update_response.status_code = 200
    update_response.json.return_value = {}

    token_response = MagicMock()
    token_response.status_code = 200
    token_response.json.return_value = {"token": "test-meeting-token"}
    token_response.text = ""

    try:
        with patch("app.routers.video_rooms.settings") as mock_settings:
            mock_settings.daily_api_key = "test-daily-key"

            mock_client = AsyncMock()
            mock_client.post = _mock_daily_post(
                conflict_response, token_response, update_response
            )
            mock_client.get = AsyncMock(return_value=get_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("httpx.AsyncClient", return_value=mock_client):
                resp = client.post(f"/api/v1/video/rooms/{match_id}")

        assert resp.status_code == 200
        data = resp.json()
        assert data["room_url"] == room_url
        assert data["room_name"] == room_name
        assert data["token"] == "test-meeting-token"
        # Already private -- no privatize call should have been needed.
        update_response.json.assert_not_called()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_room_privatizes_legacy_public_room(client, db_session_factory):
    """A room left over from the pre-fix public-room code must be privatized
    before a token is issued -- otherwise the token is meaningless, since
    Daily still lets anyone with the URL join a public room without one."""
    user = _make_user("rooms_legacy_public@example.com")
    match = _seed_active_match(user, db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    match_id = match.id
    room_name = f"match-{match_id}"
    room_url = f"https://youandinotai.daily.co/{room_name}"

    conflict_response = MagicMock()
    conflict_response.status_code = 400
    conflict_response.text = "Room already exists"

    get_response = MagicMock()
    get_response.status_code = 200
    get_response.json.return_value = {
        "url": room_url,
        "name": room_name,
        "privacy": "public",
    }

    update_response = MagicMock()
    update_response.status_code = 200
    update_response.json.return_value = {
        "url": room_url,
        "name": room_name,
        "privacy": "private",
    }

    token_response = MagicMock()
    token_response.status_code = 200
    token_response.json.return_value = {"token": "test-meeting-token"}
    token_response.text = ""

    try:
        with patch("app.routers.video_rooms.settings") as mock_settings:
            mock_settings.daily_api_key = "test-daily-key"

            mock_client = AsyncMock()
            mock_client.post = _mock_daily_post(
                conflict_response, token_response, update_response
            )
            mock_client.get = AsyncMock(return_value=get_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("httpx.AsyncClient", return_value=mock_client):
                resp = client.post(f"/api/v1/video/rooms/{match_id}")

        assert resp.status_code == 200
        data = resp.json()
        assert data["room_url"] == room_url
        assert data["room_name"] == room_name
        assert data["token"] == "test-meeting-token"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_room_privatize_failure_returns_502(client, db_session_factory):
    """If Daily rejects the privatize call, never hand back a token for a
    room that's still public."""
    user = _make_user("rooms_privatize_fail@example.com")
    match = _seed_active_match(user, db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    match_id = match.id
    room_name = f"match-{match_id}"
    room_url = f"https://youandinotai.daily.co/{room_name}"

    conflict_response = MagicMock()
    conflict_response.status_code = 400
    conflict_response.text = "Room already exists"

    get_response = MagicMock()
    get_response.status_code = 200
    get_response.json.return_value = {
        "url": room_url,
        "name": room_name,
        "privacy": "public",
    }

    update_error_response = MagicMock()
    update_error_response.status_code = 500
    update_error_response.text = "Room update service unavailable"

    try:
        with patch("app.routers.video_rooms.settings") as mock_settings:
            mock_settings.daily_api_key = "test-daily-key"

            mock_client = AsyncMock()
            mock_client.post = _mock_daily_post(
                conflict_response, None, update_error_response
            )
            mock_client.get = AsyncMock(return_value=get_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("httpx.AsyncClient", return_value=mock_client):
                resp = client.post(f"/api/v1/video/rooms/{match_id}")

        assert resp.status_code == 502
    finally:
        app.dependency_overrides.pop(get_current_user, None)
