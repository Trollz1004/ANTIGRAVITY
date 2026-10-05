"""Referral attribution tests.

Regression guard for the register route reading ``payload.referral_code``:
if the field is absent from ``AuthRegisterRequest``, every registration
raises AttributeError. These tests pin the field, its persistence, and
the opt-in/opt-out behaviour.
"""

import asyncio
import uuid

from sqlalchemy import select

from app.models import User


def _valid_payload(**overrides):
    payload = {
        "email": "ref-attribution@example.com",
        "password": "password123",
        "display_name": "Ref Test",
        "date_of_birth": "1990-01-01",
        "accepted_terms": True,
        "accepted_cookie_policy": True,
        "confirmed_over_18": True,
    }
    payload.update(overrides)
    return payload


def test_register_without_referral_code_still_succeeds(client):
    """Omitting referral_code must not break registration."""
    response = client.post("/api/v1/auth/register", json=_valid_payload())

    assert response.status_code in (200, 201), response.text
    assert response.json()["access_token"]
    assert response.json()["user_id"]


def test_register_accepts_referral_code_and_persists_it(client, db_session_factory):
    """A supplied referral_code is accepted and stored on the user record."""
    email = "ref-with-code@example.com"
    response = client.post(
        "/api/v1/auth/register",
        json=_valid_payload(email=email, referral_code="bot-slayer"),
    )

    assert response.status_code in (200, 201), response.text
    user_id = uuid.UUID(response.json()["user_id"])

    async def fetch_user() -> User | None:
        async with db_session_factory() as session:
            return await session.scalar(select(User).where(User.id == user_id))

    user = asyncio.run(fetch_user())
    assert user is not None
    assert user.referral_code == "bot-slayer"


def test_register_referral_code_is_optional_and_null_when_absent(
    client, db_session_factory
):
    """No referral_code means the stored value is NULL, not an empty string."""
    email = "ref-no-code@example.com"
    response = client.post("/api/v1/auth/register", json=_valid_payload(email=email))

    assert response.status_code in (200, 201), response.text
    user_id = uuid.UUID(response.json()["user_id"])

    async def fetch_user() -> User | None:
        async with db_session_factory() as session:
            return await session.scalar(select(User).where(User.id == user_id))

    user = asyncio.run(fetch_user())
    assert user is not None
    assert user.referral_code is None


def test_register_rejects_overlong_referral_code(client):
    """referral_code is bounded to 64 chars."""
    response = client.post(
        "/api/v1/auth/register",
        json=_valid_payload(referral_code="x" * 65),
    )

    assert response.status_code == 422, response.text
