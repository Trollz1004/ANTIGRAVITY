"""Messaging router — REST + WebSocket for real-time chat."""

import json
import uuid
from collections import defaultdict

from fastapi import (
    APIRouter,
    Depends,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi import WebSocketException
from app.error_responses import bad_request, forbidden, not_found
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import SessionLocal, get_db
from app.dependencies.websocket_auth import get_current_websocket_user
from app.models import Match, Message, User
from app.moderation import has_block_relationship
from app.schemas import MessageResponse, MessageSendRequest

router = APIRouter()

# In-memory WebSocket connections keyed by match_id
# For production, replace with Redis pub/sub
_connections: dict[str, list[WebSocket]] = defaultdict(list)


@router.get("/messages/{match_id}", response_model=list[MessageResponse])
async def get_messages(
    match_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    before: str | None = None,
    limit: int = 50,
) -> list[MessageResponse]:
    # Verify user is part of this match
    match = await db.get(Match, match_id)
    if not match or (match.user_a != user.id and match.user_b != user.id):
        raise not_found(message="Match not found")
    other_id = match.user_b if match.user_a == user.id else match.user_a
    if await has_block_relationship(db, user_a=user.id, user_b=other_id):
        raise forbidden(message="Conversation unavailable due to safety settings")

    query = select(Message).where(Message.match_id == match_id)
    if before:
        query = query.where(Message.created_at < before)
    query = query.order_by(Message.created_at.desc()).limit(limit)

    messages = (await db.scalars(query)).all()

    return [
        MessageResponse(
            id=msg.id,
            sender_id=msg.sender_id,
            content=msg.content,
            read_at=msg.read_at,
            created_at=msg.created_at,
        )
        for msg in reversed(messages)  # Return oldest-first for display
    ]


@router.post("/messages/{match_id}", response_model=MessageResponse, status_code=201)
async def send_message(
    match_id: uuid.UUID,
    payload: MessageSendRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    match = await db.get(Match, match_id)
    if not match or (match.user_a != user.id and match.user_b != user.id):
        raise not_found(message="Match not found")
    other_id = match.user_b if match.user_a == user.id else match.user_a
    if await has_block_relationship(db, user_a=user.id, user_b=other_id):
        raise forbidden(message="Conversation unavailable due to safety settings")
    if match.status != "active":
        raise bad_request(message="Match is not active")

    msg = Message(
        id=uuid.uuid4(),
        match_id=match_id,
        sender_id=user.id,
        content=payload.content,
    )
    db.add(msg)
    match.last_message_at = func.now()
    await db.commit()
    await db.refresh(msg)

    # Broadcast to WebSocket connections
    ws_data = json.dumps(
        {
            "type": "message",
            "id": str(msg.id),
            "sender_id": str(msg.sender_id),
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
        }
    )
    for ws in _connections.get(str(match_id), []):
        try:
            await ws.send_text(ws_data)
        except Exception:
            pass

    return MessageResponse(
        id=msg.id,
        sender_id=msg.sender_id,
        content=msg.content,
        read_at=msg.read_at,
        created_at=msg.created_at,
    )


@router.websocket("/ws/chat/{match_id}")
async def websocket_chat(
    websocket: WebSocket,
    match_id: str,
    user: User = Depends(get_current_websocket_user),
):
    user_id = str(user.id)

    # Verify match membership
    async with SessionLocal() as db:
        match = await db.get(Match, uuid.UUID(match_id))
        if not match or (str(match.user_a) != user_id and str(match.user_b) != user_id):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Match not found")
            return
        other_id = match.user_b if str(match.user_a) == user_id else match.user_a
        if await has_block_relationship(db, user_a=uuid.UUID(user_id), user_b=other_id):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Conversation unavailable")
            return

    await websocket.accept()
    _connections[match_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)

            if msg_data.get("type") == "message":
                # Save to DB
                async with SessionLocal() as db:
                    msg = Message(
                        id=uuid.uuid4(),
                        match_id=uuid.UUID(match_id),
                        sender_id=uuid.UUID(user_id),
                        content=msg_data["content"][:2000],
                    )
                    db.add(msg)
                    match_obj = await db.get(Match, uuid.UUID(match_id))
                    if match_obj:
                        match_obj.last_message_at = func.now()
                    await db.commit()
                    await db.refresh(msg)

                    broadcast = json.dumps(
                        {
                            "type": "message",
                            "id": str(msg.id),
                            "sender_id": user_id,
                            "content": msg.content,
                            "created_at": msg.created_at.isoformat(),
                        }
                    )

                # Broadcast to all connections in this match
                for ws in _connections[match_id]:
                    try:
                        await ws.send_text(broadcast)
                    except Exception:
                        pass

    except WebSocketDisconnect:
        pass
    finally:
        _connections[match_id].remove(websocket)
        if not _connections[match_id]:
            del _connections[match_id]
