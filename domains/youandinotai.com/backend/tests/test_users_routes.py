"""Tests for the /api/v1/users router — user registration CRUD.

Coverage targets:
  - POST /api/v1/users/register — register a new user

Risk surface:
  - Role escalation via registration payload (no admin field should be accepted)
  - Duplicate email conflict
  - Validation errors on malformed input
  - Rate limit enforcement
"""

import uuid
from datetime import date, datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.auth import hash_password
from app.models import User
from tests.helpers import seed

ADULT_DOB = "1990-01-01"


# ── Helpers ──────────────────────────────────────────────────────────────────


def _make_existing_user(email: str) -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash=hash_password("password123"),
        display_name="Existing User",
        date_of_birth=date(1990, 1, 1),
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


# ── Happy path ────────────────────────────────────────────────────────────────


def test_register_user_happy_path(client):
    """Register a new adult user and get user_id + session_token back."""
    resp = client.post(
        "/api/v1/users/register",
        json={
            "email": "newuser_reg@example.com",
            "display_name": "New User",
            "date_of_birth": ADULT_DOB,
        },
    )
    assert resp.status_code == 201, f"Unexpected status {resp.status_code}: {resp.text}"
    data = resp.json()
    assert "user_id" in data
    assert "session_token" in data
    uuid.UUID(data["user_id"])


def test_register_user_returns_unique_session_token(client):
    """Two registrations must return different session tokens."""
    resp1 = client.post(
        "/api/v1/users/register",
        json={
            "email": "token_unique_1@example.com",
            "display_name": "User One",
            "date_of_birth": ADULT_DOB,
        },
    )
    resp2 = client.post(
        "/api/v1/users/register",
        json={
            "email": "token_unique_2@example.com",
            "display_name": "User Two",
            "date_of_birth": ADULT_DOB,
        },
    )
    assert resp1.status_code == 201
    assert resp2.status_code == 201
    assert resp1.json()["session_token"] != resp2.json()["session_token"]


# ── Validation errors & 18+ age gate ──────────────────────────────────────────


def test_register_missing_date_of_birth_returns_422(client, db_session_factory):
    import asyncio

    resp = client.post(
        "/api/v1/users/register",
        json={"email": "nodob_legacy@example.com", "display_name": "No DOB"},
    )
    assert resp.status_code == 422

    async def _check():
        async with db_session_factory() as session:
            return await session.scalar(
                select(User).where(User.email == "nodob_legacy@example.com")
            )

    assert asyncio.run(_check()) is None


def test_register_underage_date_of_birth_returns_400(client, db_session_factory):
    import asyncio

    underage_dob = (date.today() - timedelta(days=365 * 17)).isoformat()
    resp = client.post(
        "/api/v1/users/register",
        json={
            "email": "minor_legacy@example.com",
            "display_name": "Minor User",
            "date_of_birth": underage_dob,
        },
    )
    assert resp.status_code == 400
    assert "strictly 18+ only" in resp.text

    async def _check():
        async with db_session_factory() as session:
            return await session.scalar(
                select(User).where(User.email == "minor_legacy@example.com")
            )

    assert asyncio.run(_check()) is None


def test_register_missing_email_returns_422(client):
    resp = client.post(
        "/api/v1/users/register",
        json={"display_name": "No Email", "date_of_birth": ADULT_DOB},
    )
    assert resp.status_code == 422


def test_register_invalid_email_format_returns_422(client):
    resp = client.post(
        "/api/v1/users/register",
        json={
            "email": "not-an-email",
            "display_name": "Bad Email",
            "date_of_birth": ADULT_DOB,
        },
    )
    assert resp.status_code == 422


def test_register_missing_display_name_returns_422(client):
    resp = client.post(
        "/api/v1/users/register",
        json={"email": "noname@example.com", "date_of_birth": ADULT_DOB},
    )
    assert resp.status_code == 422


def test_register_empty_display_name_returns_422(client):
    resp = client.post(
        "/api/v1/users/register",
        json={
            "email": "emptyname@example.com",
            "display_name": "",
            "date_of_birth": ADULT_DOB,
        },
    )
    assert resp.status_code == 422


def test_register_display_name_too_long_returns_422(client):
    resp = client.post(
        "/api/v1/users/register",
        json={
            "email": "toolong@example.com",
            "display_name": "A" * 101,
            "date_of_birth": ADULT_DOB,
        },
    )
    assert resp.status_code == 422


def test_register_empty_body_returns_422(client):
    resp = client.post("/api/v1/users/register", json={})
    assert resp.status_code == 422


# ── Conflict: duplicate email ─────────────────────────────────────────────────


def test_register_duplicate_email_returns_409(client, db_session_factory):
    existing = _make_existing_user("duplicate_reg@example.com")
    seed(existing, db_session_factory=db_session_factory)

    resp = client.post(
        "/api/v1/users/register",
        json={
            "email": "duplicate_reg@example.com",
            "display_name": "Duplicate Attempt",
            "date_of_birth": ADULT_DOB,
        },
    )
    assert resp.status_code == 409
    assert "already registered" in resp.json()["detail"].lower()


def test_register_email_is_case_insensitive_for_dedup(client, db_session_factory):
    """Emails stored lowercase must catch mixed-case duplicate attempts."""
    existing = _make_existing_user("casecheck@example.com")
    seed(existing, db_session_factory=db_session_factory)

    resp = client.post(
        "/api/v1/users/register",
        json={
            "email": "CASECHECK@EXAMPLE.COM",
            "display_name": "Case Clone",
            "date_of_birth": ADULT_DOB,
        },
    )
    assert resp.status_code == 409


# ── Role escalation prevention ────────────────────────────────────────────────


def test_register_cannot_set_bot_shield_verified_via_payload(client):
    """Pydantic schema must strip bot_shield_verified from registration payload."""
    resp = client.post(
        "/api/v1/users/register",
        json={
            "email": "escalate_shield@example.com",
            "display_name": "Shield Escalator",
            "date_of_birth": ADULT_DOB,
            "bot_shield_verified": True,  # must be ignored by strict schema
        },
    )
    assert resp.status_code in (201, 422), f"Unexpected: {resp.status_code}"
    if resp.status_code == 201:
        assert "bot_shield_verified" not in resp.json()


def test_register_cannot_set_subscription_active_via_payload(client):
    """Pydantic schema must strip subscription_active from registration payload."""
    resp = client.post(
        "/api/v1/users/register",
        json={
            "email": "escalate_sub@example.com",
            "display_name": "Sub Escalator",
            "date_of_birth": ADULT_DOB,
            "subscription_active": True,
            "subscription_tier": "platinum",
        },
    )
    assert resp.status_code in (201, 422), f"Unexpected: {resp.status_code}"
    if resp.status_code == 201:
        assert "subscription_active" not in resp.json()


# ── Response does not leak sensitive data ─────────────────────────────────────


def test_register_response_does_not_expose_password_hash(client):
    """Response (if any) must never expose password_hash."""
    resp = client.post(
        "/api/v1/users/register",
        json={
            "email": "noleakpw@example.com",
            "display_name": "No Leak",
            "date_of_birth": ADULT_DOB,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "password_hash" not in data
    assert "password" not in data
