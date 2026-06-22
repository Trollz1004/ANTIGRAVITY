"""Auth route integration tests."""

import asyncio
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select

from app.auth import create_access_token, create_refresh_token, hash_password
from app.config import get_settings
from app.models import User


def test_beta_access_issues_real_tokens(client, db_session_factory, monkeypatch):
    monkeypatch.setenv("BETA_ACCESS_CODES", "FOUNDING100,JOKER0001,TWINPOWER")
    get_settings.cache_clear()

    response = client.post("/api/v1/auth/beta-access", json={"code": "founding100"})

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["access_token"]
    assert payload["refresh_token"]
    user_id = uuid.UUID(payload["user_id"])

    async def fetch_user() -> User | None:
        async with db_session_factory() as session:
            return await session.scalar(select(User).where(User.id == user_id))

    user = asyncio.run(fetch_user())
    assert user is not None
    assert user.is_active is True
    assert user.bot_shield_verified is True
    assert user.subscription_active is True
    assert user.subscription_tier == "founding_member"
    assert user.engagement_score == 5.0
    assert user.member_badge == "Founder"

    get_settings.cache_clear()


def test_beta_access_rejects_invalid_code(client, monkeypatch):
    monkeypatch.setenv("BETA_ACCESS_CODES", "FOUNDING100")
    get_settings.cache_clear()

    response = client.post("/api/v1/auth/beta-access", json={"code": "NOPE"})

    assert response.status_code == 401
    payload = response.json()
    assert payload["message"] == "Invalid beta access code"
    assert payload["details"]["code"] == "BETA_ACCESS_DENIED"

    get_settings.cache_clear()


def test_inactive_user_is_blocked_across_auth_routes(client, db_session_factory):
    inactive_user_id = uuid.uuid4()

    async def seed_user() -> None:
        async with db_session_factory() as session:
            session.add(
                User(
                    id=inactive_user_id,
                    email="inactive@example.com",
                    password_hash=hash_password("super-secret-password"),
                    display_name="Inactive User",
                    date_of_birth=date(1990, 1, 1),
                    adult_verified_at=datetime.now(timezone.utc),
                    is_active=False,
                )
            )
            await session.commit()

    asyncio.run(seed_user())

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@example.com", "password": "super-secret-password"},
    )
    assert login_response.status_code == 403
    assert login_response.json()["message"] == "Account is inactive"

    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": create_refresh_token(str(inactive_user_id))},
    )
    assert refresh_response.status_code == 403
    assert refresh_response.json()["message"] == "Account is inactive"

    me_response = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {create_access_token(str(inactive_user_id))}"
        },
    )
    assert me_response.status_code == 403
    assert me_response.json()["message"] == "Account is inactive"
