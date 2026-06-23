"""Tests for app.routers.notifications — NotificationConnectionManager."""

from unittest.mock import AsyncMock

import pytest

from app.routers.notifications import NotificationConnectionManager


class TestNotificationConnectionManager:
    def test_initial_state(self):
        mgr = NotificationConnectionManager()
        assert mgr.active_users == []

    @pytest.mark.asyncio
    async def test_connect_and_disconnect(self):
        mgr = NotificationConnectionManager()
        ws = AsyncMock()
        await mgr.connect(ws, "user-1")
        assert "user-1" in mgr.active_users

        mgr.disconnect(ws, "user-1")
        assert "user-1" not in mgr.active_users

    @pytest.mark.asyncio
    async def test_broadcast_no_connections(self):
        mgr = NotificationConnectionManager()
        sent = await mgr.broadcast({"type": "test"})
        assert sent == 0

    @pytest.mark.asyncio
    async def test_broadcast_to_connected(self):
        mgr = NotificationConnectionManager()
        ws = AsyncMock()
        await mgr.connect(ws, "user-1")

        sent = await mgr.broadcast({"type": "test", "data": "hello"})
        assert sent == 1
        ws.send_text.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_to_user(self):
        mgr = NotificationConnectionManager()
        ws1 = AsyncMock()
        ws2 = AsyncMock()
        await mgr.connect(ws1, "user-1")
        await mgr.connect(ws2, "user-2")

        sent = await mgr.send_to_user("user-1", {"type": "personal"})
        assert sent == 1
        ws1.send_text.assert_called_once()
        ws2.send_text.assert_not_called()

    @pytest.mark.asyncio
    async def test_send_to_nonexistent_user(self):
        mgr = NotificationConnectionManager()
        sent = await mgr.send_to_user("nobody", {"type": "test"})
        assert sent == 0

    @pytest.mark.asyncio
    async def test_dead_connection_cleanup(self):
        mgr = NotificationConnectionManager()
        ws = AsyncMock()
        ws.send_text.side_effect = Exception("connection closed")
        await mgr.connect(ws, "user-1")

        sent = await mgr.broadcast({"type": "test"})
        assert sent == 0
        # Dead connection should be cleaned up
        assert "user-1" not in mgr.active_users

    @pytest.mark.asyncio
    async def test_multiple_connections_per_user(self):
        mgr = NotificationConnectionManager()
        ws1 = AsyncMock()
        ws2 = AsyncMock()
        await mgr.connect(ws1, "user-1")
        await mgr.connect(ws2, "user-1")

        sent = await mgr.send_to_user("user-1", {"type": "test"})
        assert sent == 2

    def test_total_connections(self):
        mgr = NotificationConnectionManager()
        assert mgr._total_connections() == 0
