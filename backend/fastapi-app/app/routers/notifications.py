"""Notifications router — WebSocket endpoint for real-time notification broadcasts.

Provides a WebSocket endpoint that authenticated clients can connect to
for receiving real-time notifications about task status changes, new issue
creation, and agent activity.

Also exposes REST endpoints for triggering notifications (used by other
routers/services to broadcast events to connected clients).
"""

import json
import logging
from collections import defaultdict
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    WebSocket,
    WebSocketDisconnect,
)

from app.auth import require_verified_profile
from app.dependencies.websocket_auth import get_current_websocket_user
from app.models import User

logger = logging.getLogger("youandinotai.notifications")

router = APIRouter()


class NotificationConnectionManager:
    """Manages WebSocket connections and broadcasts notifications.

    Tracks all authenticated, connected clients and provides methods
    to broadcast events to all or specific users.
    """

    def __init__(self) -> None:
        # user_id -> list of WebSocket connections
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        """Accept a WebSocket connection and register it for the given user."""
        await websocket.accept()
        self._connections[user_id].append(websocket)
        logger.info(
            "User %s connected to notifications (total connections: %d)",
            user_id,
            self._total_connections(),
        )

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        """Remove a WebSocket connection for the given user."""
        conns = self._connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self._connections.pop(user_id, None)
        logger.info(
            "User %s disconnected from notifications (total connections: %d)",
            user_id,
            self._total_connections(),
        )

    async def broadcast(self, event: dict[str, Any]) -> int:
        """Send an event to all connected clients.

        Returns the number of clients the event was successfully delivered to.
        """
        payload = json.dumps(event)
        sent = 0
        dead_conns: list[tuple[str, WebSocket]] = []

        for user_id, conns in self._connections.items():
            for ws in conns:
                try:
                    await ws.send_text(payload)
                    sent += 1
                except Exception:
                    dead_conns.append((user_id, ws))

        # Clean up dead connections
        for user_id, ws in dead_conns:
            self.disconnect(ws, user_id)

        return sent

    async def send_to_user(self, user_id: str, event: dict[str, Any]) -> int:
        """Send an event to all connections for a specific user.

        Returns the number of connections the event was delivered to.
        """
        conns = self._connections.get(user_id, [])
        if not conns:
            return 0

        payload = json.dumps(event)
        sent = 0
        dead: list[WebSocket] = []

        for ws in conns:
            try:
                await ws.send_text(payload)
                sent += 1
            except Exception:
                dead.append(ws)

        for ws in dead:
            self.disconnect(ws, user_id)

        return sent

    def _total_connections(self) -> int:
        return sum(len(conns) for conns in self._connections.values())

    @property
    def active_users(self) -> list[str]:
        return list(self._connections.keys())


# Global connection manager instance
notification_manager = NotificationConnectionManager()


@router.websocket("/ws/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    user: User = Depends(get_current_websocket_user),
) -> None:
    """WebSocket endpoint for real-time notifications.

    Clients authenticate via the `token` query parameter (validated by
    get_current_websocket_user). Once connected, they receive broadcast
    notifications for task status changes, new issues, and agent activity.

    Protocol:
    - Server sends JSON messages with a `type` field:
      - "notification" — a new notification event
      - "connected" — sent upon successful connection
      - "pong" — response to client ping
    - Client can send JSON messages:
      - {"type": "ping"} — keepalive ping
      - {"type": "mark_read", "id": "<notification_id>"} — mark a notification as read
    """
    user_id = str(user.id)
    await notification_manager.connect(websocket, user_id)

    # Send connection acknowledgment
    try:
        await websocket.send_text(
            json.dumps(
                {
                    "type": "connected",
                    "user_id": user_id,
                }
            )
        )
    except Exception:
        notification_manager.disconnect(websocket, user_id)
        return

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type")

            if msg_type == "ping":
                try:
                    await websocket.send_text(json.dumps({"type": "pong"}))
                except Exception:
                    break

            elif msg_type == "mark_read":
                # Acknowledge the mark_read; actual persistence would require DB
                notification_id = msg.get("id", "")
                try:
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "marked_read",
                                "id": notification_id,
                            }
                        )
                    )
                except Exception:
                    break

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception(
            "Unexpected error in notifications WebSocket for user %s", user_id
        )
    finally:
        notification_manager.disconnect(websocket, user_id)


@router.post("/notifications/broadcast", status_code=202)
async def broadcast_notification(
    payload: dict[str, Any],
    user: User = Depends(require_verified_profile),
) -> dict[str, Any]:
    """Broadcast a notification to all connected WebSocket clients.

    This endpoint is used by other services/routers to trigger real-time
    notification broadcasts. The payload must include a `type` field
    describing the event type.

    Supported event types:
    - "task_status_change" — a task changed status
    - "new_issue" — a new issue was created
    - "agent_activity" — an agent performed an action

    Example payload:
    {
        "type": "task_status_change",
        "task_id": "abc-123",
        "task_title": "Deploy frontend",
        "old_status": "in_progress",
        "new_status": "completed"
    }
    """
    event = {
        "type": "notification",
        "event_type": payload.get("type", "unknown"),
        "data": payload,
    }
    sent = await notification_manager.broadcast(event)
    return {"status": "ok", "recipients": sent}
