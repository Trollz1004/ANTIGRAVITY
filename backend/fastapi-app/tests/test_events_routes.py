"""Tests for events and meetups routes.

Endpoints covered:
- GET  /api/v1/events
- POST /api/v1/events
- POST /api/v1/events/{event_id}/rsvp
"""

import asyncio
import uuid
from datetime import datetime, timezone

from app.auth import get_current_user
from app.main import app
from app.models import User


def _make_user(*, email: str, display_name: str = "Event User") -> User:
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


def _event_payload(**overrides) -> dict:
    payload = {
        "title": "Community Meetup",
        "description": "A friendly gathering",
        "location": "Central Park, Orlando",
        "event_date": "2026-06-01T18:00:00Z",
        "category": "social",
    }
    payload.update(overrides)
    return payload


# ── GET /api/v1/events ────────────────────────────────────────────────────────


def test_list_events_empty(client, db_session_factory):
    user = _make_user(email="events_empty@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.get("/api/v1/events")
        assert resp.status_code == 200
        assert resp.json() == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_list_events_returns_created(client, db_session_factory):
    user = _make_user(email="events_list@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        client.post("/api/v1/events", json=_event_payload())
        resp = client.get("/api/v1/events")
        assert resp.status_code == 200
        assert len(resp.json()) == 1
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_list_events_category_filter(client, db_session_factory):
    user = _make_user(email="events_filter@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        client.post("/api/v1/events", json=_event_payload(category="charity"))
        client.post(
            "/api/v1/events", json=_event_payload(title="Sports Day", category="sports")
        )
        resp = client.get("/api/v1/events?category=charity")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["category"] == "charity"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_list_events_includes_attendee_count(client, db_session_factory):
    user = _make_user(email="events_rsvp_count@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        create_resp = client.post("/api/v1/events", json=_event_payload())
        event_id = create_resp.json()["id"]
        client.post(f"/api/v1/events/{event_id}/rsvp")
        resp = client.get("/api/v1/events")
        assert resp.status_code == 200
        data = resp.json()
        assert data[0]["attendee_count"] == 1
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── POST /api/v1/events ───────────────────────────────────────────────────────


def test_create_event_returns_201(client, db_session_factory):
    user = _make_user(email="events_create@example.com", display_name="Organizer")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.post("/api/v1/events", json=_event_payload(max_attendees=50))
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Community Meetup"
        assert data["organizer_name"] == "Organizer"
        assert data["max_attendees"] == 50
        assert data["attendee_count"] == 0
        assert data["id"] is not None
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_event_no_max_attendees(client, db_session_factory):
    user = _make_user(email="events_unlimited@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.post("/api/v1/events", json=_event_payload())
        assert resp.status_code == 201
        assert resp.json()["max_attendees"] is None
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── POST /api/v1/events/{event_id}/rsvp ──────────────────────────────────────


def test_rsvp_success(client, db_session_factory):
    user = _make_user(email="rsvp_ok@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        create_resp = client.post("/api/v1/events", json=_event_payload())
        event_id = create_resp.json()["id"]
        resp = client.post(f"/api/v1/events/{event_id}/rsvp")
        assert resp.status_code == 200
        data = resp.json()
        assert data["event_id"] == event_id
        assert data["status"] == "going"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_duplicate_rsvp_returns_409(client, db_session_factory):
    user = _make_user(email="rsvp_dup@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        create_resp = client.post("/api/v1/events", json=_event_payload())
        event_id = create_resp.json()["id"]
        client.post(f"/api/v1/events/{event_id}/rsvp")
        resp = client.post(f"/api/v1/events/{event_id}/rsvp")
        assert resp.status_code == 409
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_rsvp_capacity_full_returns_400(client, db_session_factory):
    organizer = _make_user(email="rsvp_full_org@example.com")
    attendee = _make_user(email="rsvp_full_att@example.com")
    _seed(organizer, attendee, db_session_factory=db_session_factory)

    # Create event with capacity=1 and organizer takes the last spot
    app.dependency_overrides[get_current_user] = _override_user(organizer)
    try:
        create_resp = client.post(
            "/api/v1/events", json=_event_payload(max_attendees=1)
        )
        event_id = create_resp.json()["id"]
        client.post(f"/api/v1/events/{event_id}/rsvp")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # Attendee tries to RSVP — should be full
    app.dependency_overrides[get_current_user] = _override_user(attendee)
    try:
        resp = client.post(f"/api/v1/events/{event_id}/rsvp")
        assert resp.status_code == 400
        assert "full" in resp.json()["message"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_rsvp_unknown_event_returns_404(client, db_session_factory):
    user = _make_user(email="rsvp_404@example.com")
    _seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.post(f"/api/v1/events/{uuid.uuid4()}/rsvp")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)
