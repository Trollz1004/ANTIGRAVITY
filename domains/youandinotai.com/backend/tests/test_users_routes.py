"""Tests for the retired legacy /api/v1/users/register route."""

import asyncio

from sqlalchemy import select

from app.models import User

ADULT_DOB = "1990-01-01"


def test_legacy_users_register_returns_410_pointing_to_auth_register(
    client, db_session_factory
):
    """POST /api/v1/users/register answers 410 pointing to /api/v1/auth/register and creates no user."""
    resp = client.post(
        "/api/v1/users/register",
        json={
            "email": "newuser_reg@example.com",
            "display_name": "New User",
            "date_of_birth": ADULT_DOB,
        },
    )
    assert resp.status_code == 410, f"Unexpected status {resp.status_code}: {resp.text}"
    detail = resp.json().get("detail", "")
    assert "/api/v1/auth/register" in detail

    async def _check():
        async with db_session_factory() as session:
            return await session.scalar(
                select(User).where(User.email == "newuser_reg@example.com")
            )

    assert asyncio.run(_check()) is None


def test_legacy_users_register_empty_or_invalid_body_still_returns_410(client):
    """Even an empty or incomplete payload on POST /api/v1/users/register answers 410 pointing to /api/v1/auth/register."""
    resp = client.post("/api/v1/users/register", json={})
    assert resp.status_code == 410
    assert "/api/v1/auth/register" in resp.json().get("detail", "")
