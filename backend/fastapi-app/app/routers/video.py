"""WebRTC signaling router for matched pairs."""

import json
import uuid
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy import and_, or_, select

from app.database import SessionLocal
from app.dependencies.websocket_auth import get_current_websocket_user
from app.models import Match, User, VideoCall

router = APIRouter()

ALLOWED_SIGNAL_TYPES = {"ice_candidate", "sdp_offer", "sdp_answer", "hang_up"}

_video_connections: dict[str, dict[str, WebSocket]] = defaultdict(dict)
_buffered_frames: dict[str, list[str]] = defaultdict(list)
_call_initiators: dict[str, str] = {}


async def _find_active_match(
    user_a_id: uuid.UUID,
    user_b_id: uuid.UUID,
) -> Match | None:
    async with SessionLocal() as db:
        return await db.scalar(
            select(Match).where(
                Match.status == "active",
                or_(
                    and_(Match.user_a == user_a_id, Match.user_b == user_b_id),
                    and_(Match.user_a == user_b_id, Match.user_b == user_a_id),
                ),
            )
        )


async def _ensure_call_record(
    call_id: uuid.UUID,
    initiator_id: uuid.UUID,
    peer_id: uuid.UUID,
) -> VideoCall | None:
    async with SessionLocal() as db:
        call = await db.get(VideoCall, call_id)
        if call:
            return call

        match = await db.scalar(
            select(Match).where(
                Match.status == "active",
                or_(
                    and_(Match.user_a == initiator_id, Match.user_b == peer_id),
                    and_(Match.user_a == peer_id, Match.user_b == initiator_id),
                ),
            )
        )
        if not match:
            return None

        call = VideoCall(
            id=call_id,
            match_id=match.id,
            initiator_id=initiator_id,
            status="active",
            started_at=datetime.now(timezone.utc),
        )
        db.add(call)
        await db.commit()
        await db.refresh(call)
        return call


async def _mark_call_ended(call_id: uuid.UUID) -> None:
    async with SessionLocal() as db:
        call = await db.get(VideoCall, call_id)
        if not call or call.status == "ended":
            return

        call.status = "ended"
        call.ended_at = datetime.now(timezone.utc)
        if call.started_at:
            # SQLite returns naive datetimes; treat them as UTC so the
            # duration math never mixes naive and aware values.
            started_at = call.started_at
            if started_at.tzinfo is None:
                started_at = started_at.replace(tzinfo=timezone.utc)
            call.duration_seconds = max(
                0,
                int((call.ended_at - started_at).total_seconds()),
            )
        await db.commit()


async def _relay_to_peers(
    call_key: str,
    sender_id: str,
    payload: str,
) -> bool:
    room = _video_connections.get(call_key, {})
    delivered = False
    for peer_id, peer_socket in list(room.items()):
        if peer_id == sender_id:
            continue
        try:
            await peer_socket.send_text(payload)
            delivered = True
        except Exception:
            pass
    return delivered


@router.websocket("/ws/video/{call_id}")
async def websocket_video_signaling(
    websocket: WebSocket, call_id: str, user: User = Depends(get_current_websocket_user)
):
    try:
        user_id = str(user.id)
        call_uuid = uuid.UUID(call_id)
    except Exception:
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION, reason="Invalid call ID or user ID."
        )
        return

    room = _video_connections[call_id]
    if len(room) >= 2 and user_id not in room:
        await websocket.close(code=4008, reason="Call already has two peers")
        return

    await websocket.accept()

    existing_socket = room.get(user_id)
    if existing_socket:
        try:
            await existing_socket.close(code=4000, reason="Superseded connection")
        except Exception:
            pass

    room[user_id] = websocket
    _call_initiators.setdefault(call_id, user_id)

    peer_ids = list(room.keys())
    if len(peer_ids) == 2:
        first_peer_id = uuid.UUID(peer_ids[0])
        second_peer_id = uuid.UUID(peer_ids[1])
        match = await _find_active_match(first_peer_id, second_peer_id)
        if not match:
            room.pop(user_id, None)
            await websocket.close(code=4003, reason="Matched pair verification failed")
            if not room:
                _video_connections.pop(call_id, None)
                _buffered_frames.pop(call_id, None)
                _call_initiators.pop(call_id, None)
            return

        initiator_id = uuid.UUID(_call_initiators.get(call_id, user_id))
        await _ensure_call_record(call_uuid, initiator_id, uuid.UUID(user_id))

        buffered = _buffered_frames.get(call_id, [])
        if buffered:
            for frame in buffered:
                try:
                    await websocket.send_text(frame)
                except Exception:
                    break
            _buffered_frames.pop(call_id, None)

    try:
        while True:
            raw_frame = await websocket.receive_text()
            try:
                message = json.loads(raw_frame)
            except json.JSONDecodeError:
                continue

            frame_type = message.get("type")
            if frame_type not in ALLOWED_SIGNAL_TYPES:
                continue

            message["from_user_id"] = user_id
            outbound = json.dumps(message)

            if frame_type == "hang_up":
                await _relay_to_peers(call_id, user_id, outbound)
                await _mark_call_ended(call_uuid)
                break

            delivered = await _relay_to_peers(call_id, user_id, outbound)
            if not delivered:
                _buffered_frames[call_id].append(outbound)

    except WebSocketDisconnect:
        pass
    finally:
        room = _video_connections.get(call_id)
        if room and room.get(user_id) is websocket:
            room.pop(user_id, None)

        remaining_room = _video_connections.get(call_id, {})
        if remaining_room:
            hangup_frame = json.dumps({"type": "hang_up", "from_user_id": user_id})
            for peer_socket in list(remaining_room.values()):
                try:
                    await peer_socket.send_text(hangup_frame)
                except Exception:
                    pass
            await _mark_call_ended(call_uuid)
        else:
            _video_connections.pop(call_id, None)
            _buffered_frames.pop(call_id, None)
            _call_initiators.pop(call_id, None)
