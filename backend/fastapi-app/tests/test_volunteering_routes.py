"""Tests for the Volunteering Hub routes.

Endpoints covered:
- GET  /api/v1/volunteer
- POST /api/v1/volunteer
- POST /api/v1/volunteer/{opp_id}/signup
- GET  /api/v1/volunteer/impact
- GET  /api/v1/volunteer/my-signups
"""

import asyncio
import uuid
from datetime import datetime, timezone

from app.auth import get_current_user
from app.main import app
from app.models import User, VolunteerOpportunity, VolunteerSignup


def _make_user(*, email: str, display_name: str = "Vol User") -> User:
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


def _opp_payload(**overrides) -> dict:
    payload = {
        "title": "Help at Food Bank",
        "organization": "Orlando Food Bank",
        "description": "Sort and pack food donations",
        "location": "Orlando, FL",
        "category": "food",
        "hours_estimate": 4.0,
        "spots": 10,
    }
    payload.update(overrides)
    return payload


# ── GET /api/v1/volunteer ─────────────────────────────────────────────────────


def test_list_opportunities_empty(client, db_session_factory):
    user = _make_user(email="vol_list_empty@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.get("/api/v1/volunteer")
        assert resp.status_code == 200
        assert resp.json() == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_list_opportunities_returns_created(client, db_session_factory):
    user = _make_user(email="vol_list_user@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        # Create one opportunity
        client.post("/api/v1/volunteer", json=_opp_payload())
        resp = client.get("/api/v1/volunteer")
        assert resp.status_code == 200
        assert len(resp.json()) == 1
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_list_opportunities_location_filter(client, db_session_factory):
    user = _make_user(email="vol_filter@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        client.post("/api/v1/volunteer", json=_opp_payload(location="Orlando, FL"))
        client.post(
            "/api/v1/volunteer",
            json=_opp_payload(title="Tampa Cleanup", location="Tampa, FL"),
        )
        resp = client.get("/api/v1/volunteer?near=Orlando")
        assert resp.status_code == 200
        data = resp.json()
        assert all("Orlando" in o["location"] for o in data)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── POST /api/v1/volunteer ────────────────────────────────────────────────────


def test_create_opportunity_returns_201(client, db_session_factory):
    user = _make_user(email="vol_create@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.post("/api/v1/volunteer", json=_opp_payload())
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Help at Food Bank"
        assert data["signup_count"] == 0
        assert data["id"] is not None
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── POST /api/v1/volunteer/{opp_id}/signup ────────────────────────────────────


def test_signup_success(client, db_session_factory):
    user = _make_user(email="vol_signup@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        create_resp = client.post("/api/v1/volunteer", json=_opp_payload())
        opp_id = create_resp.json()["id"]
        resp = client.post(f"/api/v1/volunteer/{opp_id}/signup")
        assert resp.status_code == 200
        assert resp.json()["status"] == "signed_up"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_duplicate_signup_returns_409(client, db_session_factory):
    user = _make_user(email="vol_dup@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        create_resp = client.post("/api/v1/volunteer", json=_opp_payload())
        opp_id = create_resp.json()["id"]
        client.post(f"/api/v1/volunteer/{opp_id}/signup")
        resp = client.post(f"/api/v1/volunteer/{opp_id}/signup")
        assert resp.status_code == 409
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_signup_capacity_full_returns_400(client, db_session_factory):
    user = _make_user(email="vol_full_creator@example.com")
    signer = _make_user(email="vol_full_signer@example.com")
    _seed(user, signer, db_session_factory=db_session_factory)

    # Create opp with spots=1
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        create_resp = client.post("/api/v1/volunteer", json=_opp_payload(spots=1))
        opp_id = create_resp.json()["id"]
        # First signup (user fills last spot)
        client.post(f"/api/v1/volunteer/{opp_id}/signup")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # Second user tries to sign up — should be full
    app.dependency_overrides[get_current_user] = _override_user(signer)
    try:
        resp = client.post(f"/api/v1/volunteer/{opp_id}/signup")
        assert resp.status_code == 400
        assert (
            "spots" in resp.json()["detail"].lower()
            or "No spots" in resp.json()["detail"]
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_signup_unknown_opportunity_returns_404(client, db_session_factory):
    user = _make_user(email="vol_404@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.post(f"/api/v1/volunteer/{uuid.uuid4()}/signup")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── GET /api/v1/volunteer/impact ─────────────────────────────────────────────


def test_impact_returns_zero_stats_when_empty(client, db_session_factory):
    user = _make_user(email="vol_impact_empty@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.get("/api/v1/volunteer/impact")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_opportunities"] == 0
        assert data["total_signups"] == 0
        assert data["unique_volunteers"] == 0
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_impact_counts_after_signup(client, db_session_factory):
    user = _make_user(email="vol_impact_count@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        create_resp = client.post("/api/v1/volunteer", json=_opp_payload())
        opp_id = create_resp.json()["id"]
        client.post(f"/api/v1/volunteer/{opp_id}/signup")
        resp = client.get("/api/v1/volunteer/impact")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_opportunities"] >= 1
        assert data["total_signups"] >= 1
        assert data["unique_volunteers"] >= 1
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── GET /api/v1/volunteer/my-signups ─────────────────────────────────────────


def test_my_signups_empty(client, db_session_factory):
    user = _make_user(email="my_signups_empty@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.get("/api/v1/volunteer/my-signups")
        assert resp.status_code == 200
        assert resp.json() == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_my_signups_returns_signed_up_opportunity(client, db_session_factory):
    user = _make_user(email="my_signups_user@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        create_resp = client.post(
            "/api/v1/volunteer", json=_opp_payload(title="Beach Cleanup")
        )
        opp_id = create_resp.json()["id"]
        client.post(f"/api/v1/volunteer/{opp_id}/signup")
        resp = client.get("/api/v1/volunteer/my-signups")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["title"] == "Beach Cleanup"
    finally:
        app.dependency_overrides.pop(get_current_user, None)
