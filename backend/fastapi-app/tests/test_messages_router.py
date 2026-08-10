"""Tests for the messages router — REST history + WebSocket chat.

Coverage targets:
- GET  /api/v1/messages/{match_id}      — history, membership gate, block gate
- POST /api/v1/messages/{match_id}      — persistence, status gate, broadcast
- WS   /api/v1/ws/chat/{match_id}       — auth, membership, live roundtrip
"""

import asyncio
import json
import uuid
from datetime import date, datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest
from starlette.websockets import WebSocketDisconnect

from app.auth import create_access_token, get_current_user, hash_password
from app.main import app
from app.models import Match, Message, User, UserBlock
from app.routers import messages as messages_module


def _make_user(email: str | None = None, *, is_active: bool = True) -> User:
    return User(
        id=uuid.uuid4(),
        email=email or f"msg-{uuid.uuid4().hex[:8]}@example.com",
        password_hash=hash_password("password123"),
        display_name="Chat User",
        date_of_birth=date(1993, 9, 5),
        is_active=is_active,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _make_match(user_a: User, user_b: User, *, status: str = "active") -> Match:
    return Match(
        id=uuid.uuid4(),
        user_a=user_a.id,
        user_b=user_b.id,
        compatibility_score=0.9,
        status=status,
        matched_at=datetime.now(timezone.utc),
    )


def _seed(*items, db_session_factory) -> None:
    async def _run():
        async with db_session_factory() as session:
            for item in items:
                session.add(item)
            await session.commit()

    asyncio.run(_run())


def _override_user(user: User):
    async def _dep():
        return user

    return _dep


@pytest.fixture()
def clean_connections():
    messages_module._connections.clear()
    yield
    messages_module._connections.clear()


# ── GET history ──────────────────────────────────────────────────────────────


def test_get_messages_returns_oldest_first(client, db_session_factory):
    alice, bob = _make_user(), _make_user()
    match = _make_match(alice, bob)
    old = Message(
        id=uuid.uuid4(),
        match_id=match.id,
        sender_id=alice.id,
        content="first",
        created_at=datetime.now(timezone.utc) - timedelta(minutes=5),
    )
    new = Message(
        id=uuid.uuid4(),
        match_id=match.id,
        sender_id=bob.id,
        content="second",
        created_at=datetime.now(timezone.utc),
    )
    _seed(alice, bob, match, old, new, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(alice)
    try:
        resp = client.get(f"/api/v1/messages/{match.id}")
        assert resp.status_code == 200
        items = resp.json()
        assert [m["content"] for m in items] == ["first", "second"]
        assert items[0]["sender_id"] == str(alice.id)
        assert items[0]["read_at"] is None
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_messages_before_filter(client, db_session_factory):
    alice, bob = _make_user(), _make_user()
    match = _make_match(alice, bob)
    stale = Message(
        id=uuid.uuid4(),
        match_id=match.id,
        sender_id=alice.id,
        content="old",
        created_at=datetime.now(timezone.utc) - timedelta(days=2),
    )
    recent = Message(
        id=uuid.uuid4(),
        match_id=match.id,
        sender_id=bob.id,
        content="recent",
        created_at=datetime.now(timezone.utc),
    )
    _seed(alice, bob, match, stale, recent, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(alice)
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        resp = client.get(f"/api/v1/messages/{match.id}?before={cutoff}&limit=10")
        assert resp.status_code == 200
        assert [m["content"] for m in resp.json()] == ["old"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_messages_non_member_returns_404(client, db_session_factory):
    alice, bob, eve = _make_user(), _make_user(), _make_user()
    match = _make_match(alice, bob)
    _seed(alice, bob, eve, match, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(eve)
    try:
        resp = client.get(f"/api/v1/messages/{match.id}")
        assert resp.status_code == 404

        # Unknown match id is also 404
        resp = client.get(f"/api/v1/messages/{uuid.uuid4()}")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_messages_blocked_relationship_returns_403(client, db_session_factory):
    alice, bob = _make_user(), _make_user()
    match = _make_match(alice, bob)
    block = UserBlock(id=uuid.uuid4(), blocker_id=bob.id, blocked_id=alice.id)
    _seed(alice, bob, match, block, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(alice)
    try:
        resp = client.get(f"/api/v1/messages/{match.id}")
        assert resp.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── POST send ────────────────────────────────────────────────────────────────


def test_send_message_persists_and_broadcasts(
    client, db_session_factory, clean_connections
):
    alice, bob = _make_user(), _make_user()
    match = _make_match(alice, bob)
    _seed(alice, bob, match, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(alice)

    listener = AsyncMock()
    messages_module._connections[str(match.id)].append(listener)
    broken = AsyncMock()
    broken.send_text.side_effect = RuntimeError("closed")
    messages_module._connections[str(match.id)].append(broken)

    try:
        resp = client.post(f"/api/v1/messages/{match.id}", json={"content": "hello"})
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["content"] == "hello"
        assert data["sender_id"] == str(alice.id)

        # Live listeners received the broadcast; broken ones are skipped
        listener.send_text.assert_awaited_once()
        pushed = json.loads(listener.send_text.call_args.args[0])
        assert pushed["type"] == "message"
        assert pushed["content"] == "hello"

        # Persisted + match timestamp bumped
        async def _fetch():
            async with db_session_factory() as session:
                stored = await session.get(Message, uuid.UUID(data["id"]))
                match_row = await session.get(Match, match.id)
                return stored, match_row

        stored, match_row = asyncio.run(_fetch())
        assert stored is not None and stored.content == "hello"
        assert match_row.last_message_at is not None
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_send_message_gates(client, db_session_factory, clean_connections):
    alice, bob, eve = _make_user(), _make_user(), _make_user()
    match = _make_match(alice, bob)
    _seed(alice, bob, eve, match, db_session_factory=db_session_factory)

    # Non-member → 404
    app.dependency_overrides[get_current_user] = _override_user(eve)
    try:
        resp = client.post(f"/api/v1/messages/{match.id}", json={"content": "hi"})
        assert resp.status_code == 404
        resp = client.post(f"/api/v1/messages/{uuid.uuid4()}", json={"content": "hi"})
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # Inactive match → 400
    match.status = "unmatched"

    async def _update():
        async with db_session_factory() as session:
            merged = await session.merge(match)
            merged.status = "unmatched"
            await session.commit()

    asyncio.run(_update())
    app.dependency_overrides[get_current_user] = _override_user(alice)
    try:
        resp = client.post(f"/api/v1/messages/{match.id}", json={"content": "hi"})
        assert resp.status_code == 400
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # Blocked → 403
    block = UserBlock(id=uuid.uuid4(), blocker_id=alice.id, blocked_id=bob.id)
    _seed(block, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(alice)
    try:
        resp = client.post(f"/api/v1/messages/{match.id}", json={"content": "hi"})
        assert resp.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_send_message_validation_rejects_empty(client, db_session_factory):
    alice, bob = _make_user(), _make_user()
    match = _make_match(alice, bob)
    _seed(alice, bob, match, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(alice)
    try:
        resp = client.post(f"/api/v1/messages/{match.id}", json={"content": ""})
        assert resp.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── WebSocket chat ───────────────────────────────────────────────────────────


def _patched_session_local(db_session_factory):
    return patch.object(messages_module, "SessionLocal", db_session_factory)


def test_ws_chat_full_roundtrip(client, db_session_factory, clean_connections):
    alice, bob = _make_user(), _make_user()
    match = _make_match(alice, bob)
    _seed(alice, bob, match, db_session_factory=db_session_factory)
    token = create_access_token(str(alice.id))

    with _patched_session_local(db_session_factory):
        with client.websocket_connect(
            f"/api/v1/ws/chat/{match.id}?token={token}"
        ) as ws:
            ws.send_text(json.dumps({"type": "message", "content": "live hi"}))
            pushed = json.loads(ws.receive_text())
            assert pushed["type"] == "message"
            assert pushed["content"] == "live hi"
            assert pushed["sender_id"] == str(alice.id)

    async def _messages():
        async with db_session_factory() as session:
            from sqlalchemy import select

            return list(
                (
                    await session.scalars(
                        select(Message).where(Message.match_id == match.id)
                    )
                ).all()
            )

    stored = asyncio.run(_messages())
    assert len(stored) == 1
    assert stored[0].content == "live hi"


def test_ws_chat_rejects_non_member(client, db_session_factory, clean_connections):
    alice, bob, eve = _make_user(), _make_user(), _make_user()
    match = _make_match(alice, bob)
    _seed(alice, bob, eve, match, db_session_factory=db_session_factory)
    token = create_access_token(str(eve.id))

    with _patched_session_local(db_session_factory):
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(f"/api/v1/ws/chat/{match.id}?token={token}"):
                pass


def test_ws_chat_rejects_unknown_match(client, db_session_factory, clean_connections):
    alice = _make_user()
    _seed(alice, db_session_factory=db_session_factory)
    token = create_access_token(str(alice.id))

    with _patched_session_local(db_session_factory):
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(
                f"/api/v1/ws/chat/{uuid.uuid4()}?token={token}"
            ):
                pass


def test_ws_chat_rejects_blocked_relationship(
    client, db_session_factory, clean_connections
):
    alice, bob = _make_user(), _make_user()
    match = _make_match(alice, bob)
    block = UserBlock(id=uuid.uuid4(), blocker_id=bob.id, blocked_id=alice.id)
    _seed(alice, bob, match, block, db_session_factory=db_session_factory)
    token = create_access_token(str(alice.id))

    with _patched_session_local(db_session_factory):
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(f"/api/v1/ws/chat/{match.id}?token={token}"):
                pass
