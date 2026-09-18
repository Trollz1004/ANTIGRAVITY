"""Tests for profile CRUD routes.

Endpoints covered:
- GET  /api/v1/profiles/me
- PUT  /api/v1/profiles/me
- GET  /api/v1/profiles/{user_id}
"""

import uuid
from datetime import datetime, timezone

from app.auth import get_current_user
from app.main import app
from app.models import Profile, User
from tests.helpers import override_user, seed


def _make_user(*, email: str, display_name: str = "Profile User") -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="hashed",
        display_name=display_name,
        bot_shield_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


# ── GET /api/v1/profiles/me ───────────────────────────────────────────────────


def test_get_my_profile_no_profile_returns_404(client, db_session_factory):
    user = _make_user(email="noprofile@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
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
    seed(user, profile, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
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
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
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
    seed(user, profile, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.put("/api/v1/profiles/me", json={"bio": "Updated bio"})
        assert resp.status_code == 200
        assert resp.json()["bio"] == "Updated bio"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_patch_profile_updates_only_specified_fields(client, db_session_factory):
    user = _make_user(email="patchbio@example.com")
    profile = Profile(
        id=uuid.uuid4(),
        user_id=user.id,
        bio="Original bio",
        age=30,
        location="NYC",
    )
    seed(user, profile, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.patch("/api/v1/profiles/me", json={"bio": "New bio"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["bio"] == "New bio"
        assert data["age"] == 30  # Age should remain unchanged
        assert data["location"] == "NYC"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_patch_profile_sets_field_to_null(client, db_session_factory):
    user = _make_user(email="patchtonull@example.com")
    profile = Profile(
        id=uuid.uuid4(),
        user_id=user.id,
        bio="Has a bio",
        location="San Francisco",
    )
    seed(user, profile, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.patch("/api/v1/profiles/me", json={"location": None})
        assert resp.status_code == 200
        data = resp.json()
        assert data["location"] is None
        assert data["bio"] == "Has a bio"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_patch_profile_empty_body_returns_200_no_changes(client, db_session_factory):
    user = _make_user(email="patchempty@example.com")
    profile = Profile(
        id=uuid.uuid4(),
        user_id=user.id,
        bio="Some bio",
        age=28,
    )
    seed(user, profile, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.patch("/api/v1/profiles/me", json={})
        assert resp.status_code == 200
        data = resp.json()
        assert data["bio"] == "Some bio"
        assert data["age"] == 28
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_patch_profile_unknown_field_returns_422(client, db_session_factory):
    user = _make_user(email="patchunknown@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.patch("/api/v1/profiles/me", json={"unknown_field": "some_value"})
        assert resp.status_code == 422
        assert "extra_forbidden" in resp.json()["detail"][0]["type"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_patch_profile_creates_when_none_exists(client, db_session_factory):
    user = _make_user(email="patchcreate@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.patch("/api/v1/profiles/me", json={"bio": "New bio via patch"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["bio"] == "New bio via patch"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_patch_profile_under_18_dob_returns_400(client, db_session_factory):
    user = _make_user(email="patchunderage@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.patch(
            "/api/v1/profiles/me",
            json={"date_of_birth": "2015-01-01"},  # ~10 years old
        )
        assert resp.status_code == 400
        assert "18+" in resp.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_patch_profile_dob_locked_after_verification(client, db_session_factory):
    """Once date_of_birth is set on User, a different value must be rejected."""
    from datetime import date

    user = _make_user(email="patchdoblocked@example.com")
    user.date_of_birth = date(1990, 1, 1)
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.patch(
            "/api/v1/profiles/me",
            json={"date_of_birth": "1991-01-01"},  # different from locked value
        )
        assert resp.status_code == 409
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_patch_profile_same_dob_as_locked_is_ok(client, db_session_factory):
    """Submitting the same DOB as the locked value is fine."""
    from datetime import date

    user = _make_user(email="patchdobsame@example.com")
    user.date_of_birth = date(1990, 1, 1)
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.patch(
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
    seed(viewer, target, profile, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(viewer)
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
    seed(viewer, target, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(viewer)
    try:
        resp = client.get(f"/api/v1/profiles/{target.id}")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_user_profile_nonexistent_user_returns_404(client, db_session_factory):
    viewer = _make_user(email="viewer3@example.com")
    seed(viewer, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(viewer)
    try:
        resp = client.get(f"/api/v1/profiles/{uuid.uuid4()}")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_user_profile_unverified_target_returns_404(client, db_session_factory):
    """A verified viewer must not be able to read an unverified member's profile."""
    viewer = _make_user(email="viewer4@example.com")
    target = User(
        id=uuid.uuid4(),
        email="unverified_target@example.com",
        password_hash="hashed",
        display_name="Unverified Target",
        bot_shield_verified=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    profile = Profile(id=uuid.uuid4(), user_id=target.id, bio="Should be hidden")
    seed(viewer, target, profile, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(viewer)
    try:
        resp = client.get(f"/api/v1/profiles/{target.id}")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)
