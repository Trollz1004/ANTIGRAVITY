"""Live WebRTC signaling flow tests — two-peer websocket choreography."""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from starlette.websockets import WebSocketDisconnect

from app.auth import create_access_token
from app.database import Base, get_db
from app.main import app
from app.models import Match, User, VideoCall
from app.routers import video as video_module


@pytest.fixture()
def ws_session_factory(tmp_path, client):
    """Isolated file-backed SQLite engine for the WS portal thread.

    The shared in-memory StaticPool cannot serve two interleaved websocket
    sessions at once; a file-backed engine uses separate connections. The
    get_db dependency is re-pointed here as well so WS token auth resolves
    users from the same store the signaling code queries.
    """
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path}/video.db")

    async def _setup():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(_setup())
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async def _override_get_db():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    yield factory
    app.dependency_overrides.pop(get_db, None)
    asyncio.run(engine.dispose())


@pytest.fixture(autouse=True)
def _clean_signaling_state():
    video_module._video_connections.clear()
    video_module._buffered_frames.clear()
    video_module._call_initiators.clear()
    yield
    video_module._video_connections.clear()
    video_module._buffered_frames.clear()
    video_module._call_initiators.clear()


def _seed_pair(db_session_factory):
    # /ws/video requires verification like every other interaction endpoint;
    # this file tests signaling behavior, not the gate itself, so its actors
    # are verified by default.
    alice = User(
        id=uuid.uuid4(),
        email=f"alice-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed",
        display_name="Alice",
        bot_shield_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    bob = User(
        id=uuid.uuid4(),
        email=f"bob-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed",
        display_name="Bob",
        bot_shield_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    match = Match(
        id=uuid.uuid4(),
        user_a=alice.id,
        user_b=bob.id,
        status="active",
        matched_at=datetime.now(timezone.utc),
    )

    async def _run():
        async with db_session_factory() as session:
            session.add_all([alice, bob, match])
            await session.commit()

    asyncio.run(_run())
    return alice, bob, match


def _ws_url(call_id, user):
    token = create_access_token(str(user.id))
    return f"/api/v1/ws/video/{call_id}?token={token}"


def test_room_full_rejects_third_peer(client, ws_session_factory):
    db_session_factory = ws_session_factory
    """A call room with two peers refuses a third distinct user."""
    alice, bob, match = _seed_pair(db_session_factory)
    carol = User(
        id=uuid.uuid4(),
        email=f"carol-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed",
        display_name="Carol",
        bot_shield_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    async def _seed_carol():
        async with db_session_factory() as session:
            session.add(carol)
            await session.commit()

    asyncio.run(_seed_carol())

    call_id = str(uuid.uuid4())
    with patch.object(video_module, "SessionLocal", db_session_factory):
        with client.websocket_connect(_ws_url(call_id, alice)):
            with client.websocket_connect(_ws_url(call_id, bob)):
                with pytest.raises(WebSocketDisconnect):
                    with client.websocket_connect(_ws_url(call_id, carol)):
                        pass


def test_superseded_connection_replaces_old_socket(client, ws_session_factory):
    db_session_factory = ws_session_factory
    """A second connection from the same user closes the stale socket."""
    alice, bob, match = _seed_pair(db_session_factory)
    call_id = str(uuid.uuid4())
    with patch.object(video_module, "SessionLocal", db_session_factory):
        with client.websocket_connect(_ws_url(call_id, alice)):
            first_socket = video_module._video_connections[call_id][str(alice.id)]
            with client.websocket_connect(_ws_url(call_id, alice)):
                new_socket = video_module._video_connections[call_id][str(alice.id)]
                assert new_socket is not first_socket


def test_two_peer_flow_buffers_relays_hangs_up(client, ws_session_factory):
    db_session_factory = ws_session_factory
    """Full choreography: buffer → deliver → relay → hang up → call record."""
    alice, bob, match = _seed_pair(db_session_factory)
    call_id = str(uuid.uuid4())

    with patch.object(video_module, "SessionLocal", db_session_factory):
        with client.websocket_connect(_ws_url(call_id, alice)) as ws_a:
            # Alice's early offer has no peer yet → buffered
            ws_a.send_text(json.dumps({"type": "sdp_offer", "sdp": "offer-1"}))
            # Bad JSON and unsupported frame types are ignored
            ws_a.send_text("not json")
            ws_a.send_text(json.dumps({"type": "bogus_type"}))
            assert video_module._buffered_frames[call_id]  # buffered

            with client.websocket_connect(_ws_url(call_id, bob)) as ws_b:
                # Pairing completes: Bob receives Alice's buffered offer
                delivered = json.loads(ws_b.receive_text())
                assert delivered["type"] == "sdp_offer"
                assert delivered["from_user_id"] == str(alice.id)

                # Call record created for the pair
                async def _call():
                    async with db_session_factory() as session:
                        return await session.get(VideoCall, uuid.UUID(call_id))

                call = asyncio.run(_call())
                assert call is not None
                assert call.match_id == match.id
                assert call.status == "active"
                assert call.initiator_id in (alice.id, bob.id)

                # Bob's answer relays straight to Alice
                ws_b.send_text(json.dumps({"type": "sdp_answer", "sdp": "answer-1"}))
                reply = json.loads(ws_a.receive_text())
                assert reply["type"] == "sdp_answer"
                assert reply["from_user_id"] == str(bob.id)

                # ICE candidates relay too
                ws_a.send_text(
                    json.dumps({"type": "ice_candidate", "candidate": "c-1"})
                )
                ice = json.loads(ws_b.receive_text())
                assert ice["type"] == "ice_candidate"

                # Alice hangs up → relayed to Bob, server closes her loop
                ws_a.send_text(json.dumps({"type": "hang_up"}))
                hangup = json.loads(ws_b.receive_text())
                assert hangup["type"] == "hang_up"

            # Bob leaves; the server marks the call ended while Alice's
            # handler task is still alive (poll while her socket stays open).
            import time

            deadline = time.time() + 5
            call = None
            while time.time() < deadline:

                async def _final_call():
                    async with db_session_factory() as session:
                        return await session.get(VideoCall, uuid.UUID(call_id))

                call = asyncio.run(_final_call())
                if call.status == "ended":
                    break
                time.sleep(0.05)

            assert call is not None
            assert call.status == "ended"
            assert call.ended_at is not None
            assert call.duration_seconds is not None


def test_pairing_without_match_closes(client, ws_session_factory):
    db_session_factory = ws_session_factory
    """Two peers without an active match fail pair verification (4003)."""
    alice = User(
        id=uuid.uuid4(),
        email=f"n1-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed",
        display_name="N1",
        bot_shield_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    bob = User(
        id=uuid.uuid4(),
        email=f"n2-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed",
        display_name="N2",
        bot_shield_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    async def _seed():
        async with db_session_factory() as session:
            session.add_all([alice, bob])
            await session.commit()

    asyncio.run(_seed())

    call_id = str(uuid.uuid4())
    with patch.object(video_module, "SessionLocal", db_session_factory):
        with client.websocket_connect(_ws_url(call_id, alice)):
            # Pair verification closes with 4003 *after* accept, so the
            # failure surfaces on the first receive, not at connect time.
            with client.websocket_connect(_ws_url(call_id, bob)) as ws_b:
                with pytest.raises(WebSocketDisconnect):
                    ws_b.receive_text()
            # Bob was evicted; Alice's lone socket still occupies the room
            room = video_module._video_connections.get(call_id, {})
            assert list(room.keys()) == [str(alice.id)]
