"""Tests for messaging REST routes (WebSocket excluded).

Endpoints covered:
- GET  /api/v1/messages/{match_id}
- POST /api/v1/messages/{match_id}
"""

import uuid
from datetime import datetime, timezone

from app.auth import get_current_user
from app.main import app
from app.models import Match, Message, User
from tests.helpers import override_user, seed, verified_profile


def _make_user(*, email: str, display_name: str = "Msg User") -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="hashed",
        display_name=display_name,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _make_match(user_a: User, user_b: User, status: str = "active") -> Match:
    return Match(
        id=uuid.uuid4(),
        user_a=user_a.id,
        user_b=user_b.id,
        status=status,
    )


# ── GET /api/v1/messages/{match_id} ──────────────────────────────────────────


def test_get_messages_non_participant_returns_404(client, db_session_factory):
    stranger = _make_user(email="stranger_msg@example.com")
    user_a = _make_user(email="msg_a@example.com")
    user_b = _make_user(email="msg_b@example.com")
    match = _make_match(user_a, user_b)
    seed(stranger, user_a, user_b, match, db_session_factory=db_session_factory)

    app.dependency_overrides[get_current_user] = override_user(stranger)
    try:
        resp = client.get(f"/api/v1/messages/{match.id}")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_messages_participant_returns_200_empty(client, db_session_factory):
    user_a = _make_user(email="get_msg_a@example.com")
    user_b = _make_user(email="get_msg_b@example.com")
    match = _make_match(user_a, user_b)
    seed(user_a, user_b, match, db_session_factory=db_session_factory)

    app.dependency_overrides[get_current_user] = override_user(user_a)
    try:
        resp = client.get(f"/api/v1/messages/{match.id}")
        assert resp.status_code == 200
        assert resp.json() == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_messages_returns_oldest_first(client, db_session_factory):
    user_a = _make_user(email="order_msg_a@example.com")
    user_b = _make_user(email="order_msg_b@example.com")
    match = _make_match(user_a, user_b)

    msg1 = Message(
        id=uuid.uuid4(),
        match_id=match.id,
        sender_id=user_a.id,
        content="First",
        created_at=datetime(2025, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
    )
    msg2 = Message(
        id=uuid.uuid4(),
        match_id=match.id,
        sender_id=user_b.id,
        content="Second",
        created_at=datetime(2025, 1, 1, 11, 0, 0, tzinfo=timezone.utc),
    )

    seed(user_a, user_b, match, msg1, msg2, db_session_factory=db_session_factory)

    app.dependency_overrides[get_current_user] = override_user(user_a)
    try:
        resp = client.get(f"/api/v1/messages/{match.id}")
        assert resp.status_code == 200
        msgs = resp.json()
        assert len(msgs) == 2
        assert msgs[0]["content"] == "First"
        assert msgs[1]["content"] == "Second"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_messages_unknown_match_returns_404(client, db_session_factory):
    user = _make_user(email="unknown_match_user@example.com")
    seed(user, db_session_factory=db_session_factory)

    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.get(f"/api/v1/messages/{uuid.uuid4()}")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── POST /api/v1/messages/{match_id} ─────────────────────────────────────────


def test_send_message_non_participant_returns_404(client, db_session_factory):
    stranger = _make_user(email="send_stranger@example.com")
    user_a = _make_user(email="send_a@example.com")
    user_b = _make_user(email="send_b@example.com")
    match = _make_match(user_a, user_b)
    seed(
        stranger,
        user_a,
        user_b,
        verified_profile(stranger),
        match,
        db_session_factory=db_session_factory,
    )

    app.dependency_overrides[get_current_user] = override_user(stranger)
    try:
        resp = client.post(f"/api/v1/messages/{match.id}", json={"content": "Hello"})
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_send_message_returns_201_and_persists(client, db_session_factory):
    user_a = _make_user(email="send_ok_a@example.com")
    user_b = _make_user(email="send_ok_b@example.com")
    match = _make_match(user_a, user_b)
    seed(
        user_a,
        user_b,
        verified_profile(user_a),
        match,
        db_session_factory=db_session_factory,
    )

    app.dependency_overrides[get_current_user] = override_user(user_a)
    try:
        resp = client.post(
            f"/api/v1/messages/{match.id}", json={"content": "Hey there"}
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["content"] == "Hey there"
        assert data["sender_id"] == str(user_a.id)
        assert data["id"] is not None
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_send_message_to_inactive_match_returns_400(client, db_session_factory):
    user_a = _make_user(email="inactive_a@example.com")
    user_b = _make_user(email="inactive_b@example.com")
    match = _make_match(user_a, user_b, status="closed")
    seed(
        user_a,
        user_b,
        verified_profile(user_a),
        match,
        db_session_factory=db_session_factory,
    )

    app.dependency_overrides[get_current_user] = override_user(user_a)
    try:
        resp = client.post(f"/api/v1/messages/{match.id}", json={"content": "Hey"})
        assert resp.status_code == 400
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_send_message_unverified_sender_returns_403(client, db_session_factory):
    user_a = _make_user(email="unverified_sender_a@example.com")
    user_b = _make_user(email="unverified_sender_b@example.com")
    match = _make_match(user_a, user_b)
    seed(
        user_a,
        user_b,
        verified_profile(user_a, verified=False),
        match,
        db_session_factory=db_session_factory,
    )

    app.dependency_overrides[get_current_user] = override_user(user_a)
    try:
        resp = client.post(f"/api/v1/messages/{match.id}", json={"content": "Hey"})
        assert resp.status_code == 403
        assert "verification" in resp.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_send_message_sender_without_profile_returns_403(client, db_session_factory):
    user_a = _make_user(email="no_profile_sender_a@example.com")
    user_b = _make_user(email="no_profile_sender_b@example.com")
    match = _make_match(user_a, user_b)
    seed(user_a, user_b, match, db_session_factory=db_session_factory)

    app.dependency_overrides[get_current_user] = override_user(user_a)
    try:
        resp = client.post(f"/api/v1/messages/{match.id}", json={"content": "Hey"})
        assert resp.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_send_empty_content_returns_422(client, db_session_factory):
    user_a = _make_user(email="empty_content_a@example.com")
    user_b = _make_user(email="empty_content_b@example.com")
    match = _make_match(user_a, user_b)
    seed(
        user_a,
        user_b,
        verified_profile(user_a),
        match,
        db_session_factory=db_session_factory,
    )

    app.dependency_overrides[get_current_user] = override_user(user_a)
    try:
        resp = client.post(f"/api/v1/messages/{match.id}", json={"content": ""})
        assert resp.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)
