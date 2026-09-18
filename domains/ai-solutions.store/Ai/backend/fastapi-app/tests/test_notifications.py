"""Tests for the notifications router — WebSocket endpoint + broadcast API."""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest
from starlette.websockets import WebSocketDisconnect

from app.auth import create_access_token, get_current_user
from app.main import app
from app.models import User
from app.routers.notifications import (
    NotificationConnectionManager,
    notification_manager,
)


def _seed_user(db_session_factory, **overrides) -> User:
    user = User(
        id=uuid.uuid4(),
        email=overrides.get("email", f"ws-{uuid.uuid4().hex[:8]}@example.com"),
        password_hash="hashed",
        display_name="WS User",
        is_active=overrides.get("is_active", True),
        bot_shield_verified=overrides.get("bot_shield_verified", True),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    async def _run():
        async with db_session_factory() as session:
            session.add(user)
            await session.commit()

    asyncio.run(_run())
    return user


class TestConnectionManager:
    @pytest.mark.asyncio
    async def test_connect_registers_and_disconnect_cleans_up(self):
        manager = NotificationConnectionManager()
        ws = AsyncMock()
        await manager.connect(ws, "user-1")
        assert "user-1" in manager.active_users
        ws.accept.assert_awaited_once()

        manager.disconnect(ws, "user-1")
        assert manager.active_users == []

    @pytest.mark.asyncio
    async def test_disconnect_unknown_connection_is_noop(self):
        manager = NotificationConnectionManager()
        ws = AsyncMock()
        manager.disconnect(ws, "ghost")  # must not raise

    @pytest.mark.asyncio
    async def test_broadcast_delivers_and_evicts_dead_connections(self):
        manager = NotificationConnectionManager()
        good = AsyncMock()
        bad = AsyncMock()
        bad.send_text.side_effect = RuntimeError("closed")
        await manager.connect(good, "user-1")
        await manager.connect(bad, "user-2")

        sent = await manager.broadcast({"type": "notification", "data": {}})
        assert sent == 1
        assert "user-2" not in manager.active_users
        assert "user-1" in manager.active_users

    @pytest.mark.asyncio
    async def test_send_to_user_targets_and_evicts(self):
        manager = NotificationConnectionManager()
        first = AsyncMock()
        second = AsyncMock()
        dead = AsyncMock()
        dead.send_text.side_effect = RuntimeError("closed")
        await manager.connect(first, "user-1")
        await manager.connect(second, "user-1")
        await manager.connect(dead, "user-1")

        sent = await manager.send_to_user("user-1", {"type": "x"})
        assert sent == 2
        assert manager._total_connections() == 2

        # Unknown user → 0 deliveries
        assert await manager.send_to_user("nobody", {"type": "x"}) == 0


@pytest.fixture()
def clean_manager():
    """Reset the global connection manager around websocket tests."""
    notification_manager._connections.clear()
    yield
    notification_manager._connections.clear()


class TestWebSocketEndpoint:
    def test_connect_and_ping_pong(self, client, db_session_factory, clean_manager):
        user = _seed_user(db_session_factory)
        token = create_access_token(str(user.id))
        with client.websocket_connect(f"/api/v1/ws/notifications?token={token}") as ws:
            hello = json.loads(ws.receive_text())
            assert hello["type"] == "connected"
            assert hello["user_id"] == str(user.id)

            ws.send_text(json.dumps({"type": "ping"}))
            assert json.loads(ws.receive_text()) == {"type": "pong"}

            ws.send_text(json.dumps({"type": "mark_read", "id": "n-1"}))
            reply = json.loads(ws.receive_text())
            assert reply == {"type": "marked_read", "id": "n-1"}

            # Invalid JSON payloads are ignored, connection stays alive
            ws.send_text("not-json")
            ws.send_text(json.dumps({"type": "ping"}))
            assert json.loads(ws.receive_text()) == {"type": "pong"}

    def test_broadcast_reaches_connected_client(
        self, client, db_session_factory, clean_manager
    ):
        user = _seed_user(db_session_factory)
        token = create_access_token(str(user.id))

        async def _noop():
            return user

        app.dependency_overrides[get_current_user] = _noop
        try:
            with client.websocket_connect(
                f"/api/v1/ws/notifications?token={token}"
            ) as ws:
                json.loads(ws.receive_text())  # connected ack

                resp = client.post(
                    "/api/v1/notifications/broadcast",
                    json={"type": "task_status_change", "task_id": "t-1"},
                )
                assert resp.status_code == 202
                assert resp.json()["recipients"] == 1

                pushed = json.loads(ws.receive_text())
                assert pushed["type"] == "notification"
                assert pushed["event_type"] == "task_status_change"
                assert pushed["data"]["task_id"] == "t-1"
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_broadcast_requires_auth(self, client):
        resp = client.post("/api/v1/notifications/broadcast", json={"type": "x"})
        assert resp.status_code in (401, 403)

    def test_broadcast_without_subscribers_returns_zero(
        self, client, db_session_factory, clean_manager
    ):
        user = _seed_user(db_session_factory)

        async def _noop():
            return user

        app.dependency_overrides[get_current_user] = _noop
        try:
            resp = client.post(
                "/api/v1/notifications/broadcast", json={"type": "agent_activity"}
            )
            assert resp.status_code == 202
            assert resp.json()["recipients"] == 0
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_websocket_rejects_invalid_token(self, client):
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect("/api/v1/ws/notifications?token=bad-token"):
                pass

    def test_websocket_rejects_unknown_user(self, client, db_session_factory):
        token = create_access_token(str(uuid.uuid4()))
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(f"/api/v1/ws/notifications?token={token}"):
                pass

    def test_websocket_rejects_inactive_user(self, client, db_session_factory):
        user = _seed_user(db_session_factory, is_active=False)
        token = create_access_token(str(user.id))
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(f"/api/v1/ws/notifications?token={token}"):
                pass

    def test_websocket_requires_token(self, client):
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect("/api/v1/ws/notifications"):
                pass
