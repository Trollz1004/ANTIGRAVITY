"""Tests for profile CRUD routes.

Endpoints covered:
- GET  /api/v1/profiles/me
- PUT  /api/v1/profiles/me
- GET  /api/v1/profiles/{user_id}
"""

import asyncio
import uuid
from datetime import datetime, timezone

from app.auth import get_current_user
from app.main import app
from app.models import Profile, User


def _make_user(*, email: str, display_name: str = "Profile User") -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="hashed",
        display_name=display_name,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
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


# ── GET /api/v1/profiles/me ───────────────────────────────────────────────────


def test_get_my_profile_no_profile_returns_404(client, db_session_factory):
    user = _make_user(email="noprofile@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.get("/api/v1/profiles/me")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_my_profile_returns_profile(client, db_session_factory):
    user = _make_user(email="withprofile@example.com", display_name="Alice")
    profile = Profile(
        id=uuid.uuid4(),
        user_id=user.id,
        bio="Hello world",
        age=25,
        gender="female",
    )
    _seed(user, profile, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.get("/api/v1/profiles/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["display_name"] == "Alice"
        assert data["bio"] == "Hello world"
        assert data["age"] == 25
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── PUT /api/v1/profiles/me ───────────────────────────────────────────────────


def test_put_profile_creates_when_none_exists(client, db_session_factory):
    user = _make_user(email="createprofile@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.put("/api/v1/profiles/me", json={"bio": "New bio", "age": 30})
        assert resp.status_code == 200
        data = resp.json()
        assert data["bio"] == "New bio"
        assert data["age"] == 30
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_put_profile_updates_existing(client, db_session_factory):
    user = _make_user(email="updateprofile@example.com")
    profile = Profile(id=uuid.uuid4(), user_id=user.id, bio="Old bio", age=22)
    _seed(user, profile, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.put("/api/v1/profiles/me", json={"bio": "Updated bio"})
        assert resp.status_code == 200
        assert resp.json()["bio"] == "Updated bio"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_put_profile_under_18_dob_returns_400(client, db_session_factory):
    user = _make_user(email="underage@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.put(
            "/api/v1/profiles/me",
            json={"date_of_birth": "2015-01-01"},  # ~10 years old
        )
        assert resp.status_code == 400
        assert "18+" in resp.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_put_profile_dob_locked_after_verification(client, db_session_factory):
    """Once date_of_birth is set on User, a different value must be rejected."""
    from datetime import date

    user = _make_user(email="doblocked@example.com")
    user.date_of_birth = date(1990, 1, 1)
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.put(
            "/api/v1/profiles/me",
            json={"date_of_birth": "1991-01-01"},  # different from locked value
        )
        assert resp.status_code == 409
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_put_profile_same_dob_as_locked_is_ok(client, db_session_factory):
    """Submitting the same DOB as the locked value is fine."""
    from datetime import date

    user = _make_user(email="dobsame@example.com")
    user.date_of_birth = date(1990, 1, 1)
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.put(
            "/api/v1/profiles/me",
            json={"date_of_birth": "1990-01-01"},
        )
        assert resp.status_code == 200
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── GET /api/v1/profiles/{user_id} ───────────────────────────────────────────


def test_get_user_profile_returns_200(client, db_session_factory):
    viewer = _make_user(email="viewer@example.com")
    target = _make_user(email="target_profile@example.com", display_name="Bob")
    profile = Profile(id=uuid.uuid4(), user_id=target.id, bio="Bob's bio", age=28)
    _seed(viewer, target, profile, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(viewer)
    try:
        resp = client.get(f"/api/v1/profiles/{target.id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["display_name"] == "Bob"
        assert data["bio"] == "Bob's bio"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_user_profile_no_profile_returns_404(client, db_session_factory):
    viewer = _make_user(email="viewer2@example.com")
    target = _make_user(email="noprofile_target@example.com")
    _seed(viewer, target, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(viewer)
    try:
        resp = client.get(f"/api/v1/profiles/{target.id}")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_user_profile_nonexistent_user_returns_404(client, db_session_factory):
    viewer = _make_user(email="viewer3@example.com")
    _seed(viewer, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(viewer)
    try:
        resp = client.get(f"/api/v1/profiles/{uuid.uuid4()}")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)
