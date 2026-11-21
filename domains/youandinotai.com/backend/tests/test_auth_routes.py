"""Auth route integration tests."""

import asyncio
import uuid
from datetime import date, datetime, timezone
from unittest.mock import patch

from sqlalchemy import select

from app.auth import create_access_token, create_refresh_token, hash_password
from app.config import Settings, get_settings
from app.models import Board, Profile, User


def test_beta_access_disabled_by_default_returns_404(client, monkeypatch):
    monkeypatch.delenv("BETA_ACCESS_ENABLED", raising=False)
    monkeypatch.setenv("BETA_ACCESS_CODES", "FOUNDING100")
    get_settings.cache_clear()

    assert Settings(_env_file=None, jwt_secret="x" * 40).beta_access_enabled is False

    response = client.post("/api/v1/auth/beta-access", json={"code": "FOUNDING100"})
    assert response.status_code == 404, response.text

    get_settings.cache_clear()


def test_beta_access_issues_real_tokens(client, db_session_factory, monkeypatch):
    monkeypatch.setenv("BETA_ACCESS_ENABLED", "true")
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
    assert user.bot_shield_verified is False
    assert user.subscription_active is True
    assert user.subscription_tier == "founding_member"
    assert user.engagement_score == 5.0
    assert user.member_badge == "Founder"

    get_settings.cache_clear()


def test_beta_access_account_not_in_discovery_until_timed_question_passed(
    client, db_session_factory, monkeypatch
):
    import app.routers.verify as verify_mod

    monkeypatch.setenv("BETA_ACCESS_ENABLED", "true")
    monkeypatch.setenv("BETA_ACCESS_CODES", "FOUNDING100")
    get_settings.cache_clear()

    viewer_id = uuid.uuid4()

    async def seed_viewer_and_board() -> None:
        async with db_session_factory() as session:
            viewer = User(
                id=viewer_id,
                email="verified-viewer@example.com",
                password_hash=hash_password("super-secret-password"),
                display_name="Verified Viewer",
                date_of_birth=date(1992, 5, 10),
                adult_verified_at=datetime.now(timezone.utc),
                bot_shield_verified=True,
                is_active=True,
            )
            viewer_profile = Profile(
                id=uuid.uuid4(),
                user_id=viewer_id,
                bio="Verified member",
                age=32,
                gender="female",
                looking_for="relationship",
                location="Orlando, FL",
                interests=["Coffee"],
                verified=True,
            )
            board = Board(
                id=uuid.uuid4(),
                name="General",
                slug="general",
                description="General board",
            )
            session.add_all([viewer, viewer_profile, board])
            await session.commit()

    asyncio.run(seed_viewer_and_board())
    viewer_headers = {"Authorization": f"Bearer {create_access_token(str(viewer_id))}"}

    beta_resp = client.post("/api/v1/auth/beta-access", json={"code": "FOUNDING100"})
    assert beta_resp.status_code == 200, beta_resp.text
    beta_data = beta_resp.json()
    beta_user_id = beta_data["user_id"]
    beta_headers = {"Authorization": f"Bearer {beta_data['access_token']}"}

    profile_resp = client.put(
        "/api/v1/profiles/me",
        headers=beta_headers,
        json={
            "bio": "Beta tester profile",
            "age": 26,
            "gender": "male",
            "looking_for": "relationship",
            "location": "Orlando, FL",
            "interests": ["Coffee"],
        },
    )
    assert profile_resp.status_code == 200, profile_resp.text

    # Before passing the timed question: hidden from discovery and blocked from verified routes
    discover_before = client.get("/api/v1/discover", headers=viewer_headers)
    assert discover_before.status_code == 200, discover_before.text
    assert all(p["user_id"] != beta_user_id for p in discover_before.json())

    beta_discover_attempt = client.get("/api/v1/discover", headers=beta_headers)
    assert beta_discover_attempt.status_code == 403

    beta_board_attempt = client.get(
        "/api/v1/boards/general/posts", headers=beta_headers
    )
    assert beta_board_attempt.status_code == 403

    # Start and pass the timed question (the code waived the $1 payment, not the question)
    with patch.object(
        verify_mod, "_generate_math_challenge", return_value=("What is 20 + 5?", "25")
    ):
        challenge_resp = client.post("/api/v1/verify/challenge", headers=beta_headers)
    assert challenge_resp.status_code == 200, challenge_resp.text
    challenge_id = challenge_resp.json()["challenge_id"]

    with patch.object(verify_mod, "MIN_SOLVE_TIME_SECONDS", 0):
        submit_resp = client.post(
            "/api/v1/verify/submit",
            headers=beta_headers,
            json={"challenge_id": challenge_id, "answer": "25"},
        )
    assert submit_resp.status_code == 200, submit_resp.text
    assert submit_resp.json()["passed"] is True
    assert submit_resp.json()["checkout_url"] is None

    async def fetch_beta_user() -> User | None:
        async with db_session_factory() as session:
            return await session.scalar(
                select(User).where(User.id == uuid.UUID(beta_user_id))
            )

    verified_beta_user = asyncio.run(fetch_beta_user())
    assert verified_beta_user is not None
    assert verified_beta_user.bot_shield_verified is True

    # Now shown in discovery and allowed on verified routes
    discover_after = client.get("/api/v1/discover", headers=viewer_headers)
    assert discover_after.status_code == 200, discover_after.text
    assert any(p["user_id"] == beta_user_id for p in discover_after.json())

    beta_board_after = client.get("/api/v1/boards/general/posts", headers=beta_headers)
    assert beta_board_after.status_code == 200

    get_settings.cache_clear()


def test_beta_access_does_not_mutate_existing_verified_user(
    client, db_session_factory, monkeypatch
):
    from app.routers.auth import _beta_identity, _beta_password_hash

    monkeypatch.setenv("BETA_ACCESS_ENABLED", "true")
    monkeypatch.setenv("BETA_ACCESS_CODES", "FOUNDING100")
    get_settings.cache_clear()
    settings = get_settings()

    email, password_seed, display_name = _beta_identity(
        "FOUNDING100", settings.jwt_secret
    )
    existing_id = uuid.uuid4()

    async def seed_existing() -> None:
        async with db_session_factory() as session:
            session.add(
                User(
                    id=existing_id,
                    email=email,
                    password_hash=_beta_password_hash(
                        password_seed, settings.jwt_secret, "FOUNDING100"
                    ),
                    display_name=display_name,
                    date_of_birth=date(2000, 1, 1),
                    adult_verified_at=datetime.now(timezone.utc),
                    bot_shield_verified=True,
                    subscription_tier="founding_member",
                    subscription_active=True,
                    is_active=True,
                )
            )
            await session.commit()

    asyncio.run(seed_existing())

    response = client.post("/api/v1/auth/beta-access", json={"code": "FOUNDING100"})
    assert response.status_code == 200, response.text

    async def fetch_existing() -> User | None:
        async with db_session_factory() as session:
            return await session.scalar(select(User).where(User.id == existing_id))

    user = asyncio.run(fetch_existing())
    assert user is not None
    assert user.bot_shield_verified is True

    get_settings.cache_clear()


def test_beta_access_rejects_invalid_code(client, monkeypatch):
    monkeypatch.setenv("BETA_ACCESS_ENABLED", "true")
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
