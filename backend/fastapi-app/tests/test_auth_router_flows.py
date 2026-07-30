"""Additional auth router branch tests: beta access, registration conflicts,
refresh payload guards, and the bcrypt-fallback beta password path."""

import asyncio
import uuid
from datetime import date, datetime, timezone
from unittest.mock import patch

import jose
from jose import jwt as jose_jwt

from app.auth import create_access_token, decode_token
from app.routers import auth as auth_router


def _seed(*items, db_session_factory) -> None:
    async def _run():
        async with db_session_factory() as session:
            for item in items:
                session.add(item)
            await session.commit()

    asyncio.run(_run())


def _register_payload(email="new-user@example.com", **overrides):
    payload = {
        "email": email,
        "password": "Password123!",
        "display_name": "New User",
        "date_of_birth": "1993-09-05",
        "accepted_terms": True,
        "accepted_cookie_policy": True,
        "confirmed_over_18": True,
    }
    payload.update(overrides)
    return payload


# ── Registration ─────────────────────────────────────────────────────────────


def test_register_duplicate_email_returns_409(client, db_session_factory):
    from app.models import User

    existing = User(
        id=uuid.uuid4(),
        email="dup@example.com",
        password_hash="hashed",
        display_name="Dup",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    _seed(existing, db_session_factory=db_session_factory)

    resp = client.post("/api/v1/auth/register", json=_register_payload("dup@example.com"))
    assert resp.status_code == 409
    assert "already registered" in resp.json()["message"].lower() or "already registered" in resp.text.lower()


# ── Beta access ──────────────────────────────────────────────────────────────


def test_beta_access_invalid_code_rejected(client):
    with patch.object(auth_router, "get_settings") as mock_settings:
        from app.config import Settings

        mock_settings.return_value = Settings(beta_access_codes="GOOD-CODE-1")
        resp = client.post("/api/v1/auth/beta-access", json={"code": "BAD-CODE-2"})
    assert resp.status_code == 401
    assert "BETA_ACCESS_DENIED" in resp.text


def test_beta_access_creates_and_reactivates_user(client, db_session_factory):
    from app.config import Settings
    from app.models import User

    settings = Settings(beta_access_codes="GOOD-CODE-1")
    with patch.object(auth_router, "get_settings", return_value=settings):
        # First visit creates the beta account
        resp = client.post("/api/v1/auth/beta-access", json={"code": "GOOD-CODE-1"})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["token_type"] == "bearer"
        claims = decode_token(data["access_token"])
        assert claims["sub"] == str(data["user_id"])

        # Deactivate the user, then re-enter through beta access → reactivated
        async def _deactivate():
            async with db_session_factory() as session:
                user = await session.get(User, uuid.UUID(data["user_id"]))
                user.is_active = False
                user.subscription_active = False
                user.subscription_tier = "beta"
                await session.commit()

        asyncio.run(_deactivate())

        resp = client.post("/api/v1/auth/beta-access", json={"code": "GOOD-CODE-1"})
        assert resp.status_code == 200, resp.text

        async def _check():
            async with db_session_factory() as session:
                return await session.get(User, uuid.UUID(data["user_id"]))

        user = asyncio.run(_check())
        assert user.is_active is True
        assert user.subscription_active is True
        assert user.subscription_tier == "founding_member"


def test_beta_password_hash_bcrypt_fallback():
    """When the bcrypt backend drifts/fails, the deterministic fallback works."""
    with patch.object(
        auth_router, "hash_password", side_effect=RuntimeError("bcrypt broken")
    ):
        digest = auth_router._beta_password_hash("seed", "secret", "CODE1")
        # Deterministic — same inputs always succeed with the same digest
        assert digest == auth_router._beta_password_hash("seed", "secret", "CODE1")
        assert digest != auth_router._beta_password_hash("seed", "secret", "CODE2")
    assert len(digest) == 64


# ── Refresh endpoint payload guards ──────────────────────────────────────────


def test_refresh_rejects_access_token_type(client):
    token = create_access_token(str(uuid.uuid4()))
    resp = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": token}
    )
    assert resp.status_code == 401
    assert "Not a refresh token" in resp.text


def test_refresh_rejects_unparseable_subject(client):
    from app.config import get_settings

    settings = get_settings()
    bad = jose_jwt.encode(
        {"sub": "not-a-uuid", "type": "refresh", "exp": 4_000_000_000},
        settings.jwt_secret,
        algorithm="HS256",
    )
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": bad})
    assert resp.status_code == 401
    assert "Invalid token payload" in resp.text


# ── Register / login / google / refresh happy paths ──────────────────────────


def test_register_success_returns_tokens(client):
    resp = client.post("/api/v1/auth/register", json=_register_payload())
    assert resp.status_code == 201, resp.text
    data = resp.json()
    claims = decode_token(data["access_token"])
    assert claims["sub"] == str(data["user_id"])
    assert decode_token(data["refresh_token"])["type"] == "refresh"


def test_login_success_and_invalid_credentials(client):
    client.post(
        "/api/v1/auth/register",
        json=_register_payload("login-user@example.com", password="Password123!"),
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "login-user@example.com", "password": "Password123!"},
    )
    assert resp.status_code == 200, resp.text

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "login-user@example.com", "password": "WrongPass999!"},
    )
    assert resp.status_code == 401

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "ghost@example.com", "password": "Password123!"},
    )
    assert resp.status_code == 401


def test_google_login_creates_and_reuses_account(client, db_session_factory):
    from app.models import User

    claims = {
        "sub": "google-sub-1",
        "email": "google.user@example.com",
        "name": "Google User",
    }
    with patch.object(auth_router, "verify_google_token", return_value=claims):
        resp = client.post("/api/v1/auth/google", json={"id_token": "token"})
        assert resp.status_code == 200, resp.text
        user_id = resp.json()["user_id"]

        # Second login reuses the same account
        resp = client.post("/api/v1/auth/google", json={"id_token": "token"})
        assert resp.status_code == 200
        assert resp.json()["user_id"] == user_id

    async def _fetch():
        async with db_session_factory() as session:
            return await session.get(User, uuid.UUID(user_id))

    user = asyncio.run(_fetch())
    assert user.google_id == "google-sub-1"


def test_google_login_invalid_token_and_missing_email(client):
    with patch.object(
        auth_router,
        "verify_google_token",
        side_effect=ValueError("bad"),
    ):
        resp = client.post("/api/v1/auth/google", json={"id_token": "x"})
    assert resp.status_code == 401

    with patch.object(
        auth_router, "verify_google_token", return_value={"sub": "s"}
    ):
        resp = client.post("/api/v1/auth/google", json={"id_token": "x"})
    assert resp.status_code == 400


def test_refresh_happy_path_rotates(client, db_session_factory):
    from datetime import timedelta

    from app.auth import create_refresh_token
    from app.models_refresh_token import RefreshToken

    client.post("/api/v1/auth/register", json=_register_payload("rotator@example.com"))

    async def _user_id():
        async with db_session_factory() as session:
            from sqlalchemy import select

            from app.models import User

            return (
                await session.scalar(
                    select(User).where(User.email == "rotator@example.com")
                )
            ).id

    user_id = asyncio.run(_user_id())
    raw = create_refresh_token(str(user_id))

    from app.auth import _hash_token

    stored = RefreshToken(
        id=uuid.uuid4(),
        user_id=user_id,
        token_hash=_hash_token(raw),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )

    async def _seed_token():
        async with db_session_factory() as session:
            session.add(stored)
            await session.commit()

    asyncio.run(_seed_token())

    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": raw})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["user_id"] == str(user_id)
    assert decode_token(data["access_token"])["sub"] == str(user_id)


def test_refresh_user_not_found_and_inactive(client, db_session_factory):
    from datetime import timedelta

    from app.auth import _hash_token, create_refresh_token
    from app.models import User
    from app.models_refresh_token import RefreshToken

    # Unknown user → 401
    raw = create_refresh_token(str(uuid.uuid4()))
    stored = RefreshToken(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        token_hash=_hash_token(raw),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )

    async def _seed_token():
        async with db_session_factory() as session:
            session.add(stored)
            await session.commit()

    asyncio.run(_seed_token())
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": raw})
    assert resp.status_code == 401
