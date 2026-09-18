"""Tests for swipe / match / discover routes.

Endpoints covered:
- POST /api/v1/swipe
- GET  /api/v1/matches
- GET  /api/v1/discover
- PATCH /api/v1/matches/{match_id}/breeze-bypass
"""

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.auth import get_current_user
from app.main import app
from app.models import Match, Swipe, User
from tests.helpers import override_user, seed, verified_profile


def _make_user(*, email: str, display_name: str = "Test User") -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="hashed",
        display_name=display_name,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


# ── POST /api/v1/swipe ────────────────────────────────────────────────────────


def test_swipe_self_returns_400(client, db_session_factory):
    actor = _make_user(email="actor@example.com")
    seed(actor, verified_profile(actor), db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.post(
            "/api/v1/swipe", json={"target_id": str(actor.id), "direction": "like"}
        )
        assert resp.status_code == 400
        assert "yourself" in resp.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_swipe_like_no_mutual_no_match(client, db_session_factory):
    actor = _make_user(email="actor2@example.com")
    target = _make_user(email="target2@example.com")
    seed(
        actor,
        target,
        verified_profile(actor),
        verified_profile(target),
        db_session_factory=db_session_factory,
    )
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.post(
            "/api/v1/swipe", json={"target_id": str(target.id), "direction": "like"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["matched"] is False
        assert data["match_id"] is None
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_swipe_pass_never_creates_match(client, db_session_factory):
    actor = _make_user(email="actor3@example.com")
    target = _make_user(email="target3@example.com")
    seed(
        actor,
        target,
        verified_profile(actor),
        verified_profile(target),
        db_session_factory=db_session_factory,
    )
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.post(
            "/api/v1/swipe", json={"target_id": str(target.id), "direction": "pass"}
        )
        assert resp.status_code == 200
        assert resp.json()["matched"] is False
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_swipe_mutual_like_creates_match(client, db_session_factory):
    actor = _make_user(email="actor4@example.com")
    target = _make_user(email="target4@example.com")

    # Pre-seed target liking actor
    mutual_swipe = Swipe(
        id=uuid.uuid4(),
        user_id=target.id,
        target_id=actor.id,
        direction="like",
    )

    async def _run():
        async with db_session_factory() as session:
            session.add(actor)
            session.add(target)
            session.add(verified_profile(actor))
            session.add(verified_profile(target))
            session.add(mutual_swipe)
            await session.commit()

    asyncio.run(_run())

    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.post(
            "/api/v1/swipe", json={"target_id": str(target.id), "direction": "like"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["matched"] is True
        assert data["match_id"] is not None
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_duplicate_swipe_returns_409(client, db_session_factory):
    actor = _make_user(email="actor5@example.com")
    target = _make_user(email="target5@example.com")
    existing = Swipe(
        id=uuid.uuid4(),
        user_id=actor.id,
        target_id=target.id,
        direction="like",
    )

    async def _run():
        async with db_session_factory() as session:
            session.add(actor)
            session.add(target)
            session.add(verified_profile(actor))
            session.add(verified_profile(target))
            session.add(existing)
            await session.commit()

    asyncio.run(_run())

    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.post(
            "/api/v1/swipe", json={"target_id": str(target.id), "direction": "like"}
        )
        assert resp.status_code == 409
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_swipe_unverified_target_returns_404_and_never_stores_swipe(
    client, db_session_factory
):
    """An unverified target (e.g. UUID obtained from the open event/
    volunteering listings) must be rejected before any Swipe row is stored --
    otherwise a later 409 permanently blocks retrying once they verify."""
    actor = _make_user(email="actor_unverified_target@example.com")
    target = _make_user(email="target_unverified@example.com")
    seed(actor, target, verified_profile(actor), db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.post(
            "/api/v1/swipe", json={"target_id": str(target.id), "direction": "like"}
        )
        assert resp.status_code == 404

        async def _count_swipes():
            async with db_session_factory() as session:
                return (await session.scalars(select(Swipe))).all()

        assert asyncio.run(_count_swipes()) == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_swipe_nonexistent_target_returns_404(client, db_session_factory):
    actor = _make_user(email="actor_nonexistent_target@example.com")
    seed(actor, verified_profile(actor), db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.post(
            "/api/v1/swipe",
            json={"target_id": str(uuid.uuid4()), "direction": "like"},
        )
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_swipe_unauthenticated_returns_403(client):
    resp = client.post(
        "/api/v1/swipe", json={"target_id": str(uuid.uuid4()), "direction": "like"}
    )
    assert resp.status_code in (401, 403)


def test_swipe_unverified_actor_returns_403(client, db_session_factory):
    actor = _make_user(email="unverified_swiper@example.com")
    target = _make_user(email="unverified_swipe_target@example.com")
    unverified = verified_profile(actor, verified=False)
    seed(actor, target, unverified, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.post(
            "/api/v1/swipe", json={"target_id": str(target.id), "direction": "like"}
        )
        assert resp.status_code == 403
        assert "verification" in resp.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_swipe_actor_without_profile_returns_403(client, db_session_factory):
    actor = _make_user(email="no_profile_swiper@example.com")
    target = _make_user(email="no_profile_target@example.com")
    seed(actor, target, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.post(
            "/api/v1/swipe", json={"target_id": str(target.id), "direction": "like"}
        )
        assert resp.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── GET /api/v1/matches ───────────────────────────────────────────────────────


def test_get_matches_empty(client, db_session_factory):
    actor = _make_user(email="matches_empty@example.com")
    actor.bot_shield_verified = True
    seed(actor, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.get("/api/v1/matches")
        assert resp.status_code == 200
        assert resp.json() == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_matches_returns_active_match(client, db_session_factory):
    actor = _make_user(email="matches_actor@example.com")
    actor.bot_shield_verified = True
    other = _make_user(email="matches_other@example.com")
    other.bot_shield_verified = True
    match = Match(
        id=uuid.uuid4(),
        user_a=actor.id,
        user_b=other.id,
        status="active",
    )

    async def _run():
        async with db_session_factory() as session:
            session.add(actor)
            session.add(other)
            session.add(match)
            await session.commit()

    asyncio.run(_run())

    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.get("/api/v1/matches")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["match_id"] == str(match.id)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── GET /api/v1/discover ──────────────────────────────────────────────────────


def test_discover_excludes_self(client, db_session_factory):
    actor = _make_user(email="discover_actor@example.com")
    actor_profile = verified_profile(actor)

    async def _run():
        async with db_session_factory() as session:
            session.add(actor)
            session.add(actor_profile)
            await session.commit()

    asyncio.run(_run())

    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.get("/api/v1/discover")
        assert resp.status_code == 200
        data = resp.json()
        user_ids = [p["user_id"] for p in data]
        assert str(actor.id) not in user_ids
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_discover_unverified_actor_returns_403(client, db_session_factory):
    actor = _make_user(email="unverified_discoverer@example.com")
    unverified = verified_profile(actor, verified=False)
    seed(actor, unverified, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.get("/api/v1/discover")
        assert resp.status_code == 403
        assert "verification" in resp.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_discover_excludes_unverified_profiles(client, db_session_factory):
    actor = _make_user(email="discover_verified_actor@example.com")
    verified_target = _make_user(email="discover_verified_target@example.com")
    unverified_target = _make_user(email="discover_unverified_target@example.com")
    seed(
        actor,
        verified_target,
        unverified_target,
        verified_profile(actor),
        verified_profile(verified_target),
        verified_profile(unverified_target, verified=False),
        db_session_factory=db_session_factory,
    )
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.get("/api/v1/discover")
        assert resp.status_code == 200
        user_ids = {p["user_id"] for p in resp.json()}
        assert str(verified_target.id) in user_ids
        assert str(unverified_target.id) not in user_ids
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── PATCH /api/v1/matches/{match_id}/breeze-bypass ────────────────────────────


def test_breeze_bypass_toggle(client, db_session_factory):
    actor = _make_user(email="breeze_actor@example.com")
    actor.bot_shield_verified = True
    other = _make_user(email="breeze_other@example.com")
    match = Match(
        id=uuid.uuid4(),
        user_a=actor.id,
        user_b=other.id,
        status="active",
        breeze_bypass_enabled=False,
    )

    async def _run():
        async with db_session_factory() as session:
            session.add(actor)
            session.add(other)
            session.add(match)
            await session.commit()

    asyncio.run(_run())

    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.patch(f"/api/v1/matches/{match.id}/breeze-bypass?enabled=true")
        assert resp.status_code == 200
        assert resp.json()["breeze_bypass_enabled"] is True
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_breeze_bypass_non_participant_returns_404(client, db_session_factory):
    actor = _make_user(email="breeze_actor2@example.com")
    actor.bot_shield_verified = True
    user_a = _make_user(email="breeze_a@example.com")
    user_b = _make_user(email="breeze_b@example.com")
    match = Match(
        id=uuid.uuid4(),
        user_a=user_a.id,
        user_b=user_b.id,
        status="active",
    )

    async def _run():
        async with db_session_factory() as session:
            session.add(actor)
            session.add(user_a)
            session.add(user_b)
            session.add(match)
            await session.commit()

    asyncio.run(_run())

    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.patch(f"/api/v1/matches/{match.id}/breeze-bypass?enabled=true")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)
