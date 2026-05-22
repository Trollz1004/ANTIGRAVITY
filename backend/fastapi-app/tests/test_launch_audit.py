import asyncio
import base64
import hashlib
import hmac
import inspect
import json
import uuid
from datetime import date, datetime, timedelta, timezone
from unittest.mock import AsyncMock

from fastapi.routing import APIRoute, APIWebSocketRoute
from sqlalchemy import select

from app.auth import get_current_user
from app.models import Profile, User, VerificationEvent
from app.payment_truth import build_checkout_reference

def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _register(
    client, email: str, password: str = "supersecret", display_name: str = "Launch User"
):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "display_name": display_name,
            "date_of_birth": (date.today() - timedelta(days=365 * 21)).isoformat(),
            "accepted_terms": True,
            "accepted_cookie_policy": True,
            "confirmed_over_18": True,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def _login(client, email: str, password: str = "supersecret"):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()


def _square_signature(
    url: str, payload: dict, key: str = "test-square-signature"
) -> str:
    body = json.dumps(payload, separators=(",", ":"))
    digest = hmac.new(
        key.encode("utf-8"), f"{url}{body}".encode(), hashlib.sha256
    ).digest()
    return base64.b64encode(digest).decode("utf-8")


def _run(coro):
    return asyncio.run(coro)


def test_protected_http_routes_require_auth():
    from app.main import app

    public_routes = {
        ("/", "GET"),
        ("/api/v1/health", "GET"),
        ("/api/v1/health/allocations", "GET"),
        ("/api/v1/health/webhooks", "GET"),
        ("/api/v1/auth/register", "POST"),
        ("/api/v1/auth/beta-access", "POST"),
        ("/api/v1/users/register", "POST"),
        ("/api/v1/auth/login", "POST"),
        ("/api/v1/auth/google", "POST"),
        ("/api/v1/auth/refresh", "POST"),
        ("/api/v1/waitlist", "POST"),
        ("/api/v1/webhooks/stripe", "POST"),
        ("/api/v1/webhooks/square", "POST"),
        ("/api/v1/webhooks/square-payment", "POST"),
        ("/api/v1/webhooks/square-booking", "POST"),
        ("/api/v1/metrics", "GET"),
    }
    protected_routes = []

    for route in app.routes:
        if isinstance(route, APIRoute) and route.path.startswith("/api/v1"):
            dependency_calls = {
                dependency.call for dependency in route.dependant.dependencies
            }
            for method in route.methods or set():
                route_key = (route.path, method)
                if route_key in public_routes:
                    continue
                assert (
                    get_current_user in dependency_calls
                ), f"Missing auth on {method} {route.path}"
                protected_routes.append(route_key)

    assert protected_routes, "Expected at least one protected API route"

    ws_routes = [
        route
        for route in app.routes
        if isinstance(route, APIWebSocketRoute)
        and route.path == "/api/v1/ws/chat/{match_id}"
    ]
    assert ws_routes, "Expected the authenticated chat websocket route to exist"
    assert "token" in inspect.signature(ws_routes[0].endpoint).parameters


def test_auth_rate_limit_is_active(client):
    _register(client, "ratelimit@example.com")

    last_response = None
    for _ in range(11):
        last_response = client.post(
            "/api/v1/auth/login",
            json={"email": "ratelimit@example.com", "password": "wrong-password"},
        )

    assert last_response is not None
    assert last_response.status_code == 429


def test_verify_rate_limit_is_active(client):
    _register(client, "verify-rate@example.com")
    token = _login(client, "verify-rate@example.com")["access_token"]

    last_response = None
    for _ in range(6):
        last_response = client.post(
            "/api/v1/verify/challenge", headers=_auth_headers(token)
        )

    assert last_response is not None
    assert last_response.status_code == 429


def test_register_rejects_underage_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "minor@example.com",
            "password": "supersecret",
            "display_name": "Too Young",
            "date_of_birth": (date.today() - timedelta(days=365 * 17)).isoformat(),
            "accepted_terms": True,
            "accepted_cookie_policy": True,
            "confirmed_over_18": True,
        },
    )

    assert response.status_code == 400
    assert "strictly 18+ only" in response.text


def test_verify_submit_returns_square_checkout_link(
    client, db_session_factory, monkeypatch
):
    monkeypatch.setattr(
        "app.routers.verify._generate_math_challenge", lambda: ("What is 2 + 2?", "4")
    )
    _register(client, "square-flow@example.com")
    token = _login(client, "square-flow@example.com")["access_token"]

    challenge_response = client.post(
        "/api/v1/verify/challenge", headers=_auth_headers(token)
    )
    assert challenge_response.status_code == 200, challenge_response.text
    challenge_id = challenge_response.json()["challenge_id"]

    async def age_challenge() -> None:
        async with db_session_factory() as session:
            challenge = await session.get(VerificationEvent, uuid.UUID(challenge_id))
            challenge.created_at = datetime.now(timezone.utc) - timedelta(seconds=10)
            await session.commit()

    _run(age_challenge())

    submit_response = client.post(
        "/api/v1/verify/submit",
        headers=_auth_headers(token),
        json={"challenge_id": challenge_id, "answer": "4"},
    )

    assert submit_response.status_code == 200, submit_response.text
    payload = submit_response.json()
    assert payload["passed"] is True
    assert payload["checkout_url"] is None
    assert "real email address" in payload["message"]


def test_square_webhook_binds_bot_shield_to_user(client, db_session_factory):
    _register(client, "square-bind@example.com")
    token = _login(client, "square-bind@example.com")["access_token"]

    profile_response = client.put(
        "/api/v1/profiles/me",
        headers=_auth_headers(token),
        json={
            "bio": "Ready",
            "age": 30,
            "gender": "female",
            "looking_for": "relationship",
            "location": "Miami, FL",
            "interests": ["Music"],
        },
    )
    assert profile_response.status_code == 200, profile_response.text

    challenge_id = uuid.uuid4()

    async def insert_liveness_event() -> None:
        async with db_session_factory() as session:
            user = await session.scalar(
                select(User).where(User.email == "square-bind@example.com")
            )
            session.add(
                VerificationEvent(
                    id=challenge_id,
                    user_id=user.id,
                    challenge_type="liveness",
                    challenge_token="test-liveness-pass",
                    status="passed",
                    amount_cents=100,
                )
            )
            await session.commit()

    _run(insert_liveness_event())

    async def rebuild_checkout_ref() -> str:
        async with db_session_factory() as session:
            user = await session.scalar(
                select(User).where(User.email == "square-bind@example.com")
            )
            return build_checkout_reference(
                user_id=user.id,
                event_id=challenge_id,
                tier="bot_shield",
                secret="test-secret-that-is-at-least-32-characters-long-for-security",
            )

    checkout_ref = _run(rebuild_checkout_ref())

    payload = {
        "event_id": "evt_square_bind_1",
        "type": "payment.updated",
        "created_at": "2026-03-11T12:00:00Z",
        "data": {
            "object": {
                "payment": {
                    "id": "payment_bind_1",
                    "status": "COMPLETED",
                    "amount_money": {"amount": 100, "currency": "USD"},
                    "buyer_email_address": "square-bind@example.com",
                    "note": f"Bot-Shield Verification agref:{checkout_ref}",
                }
            }
        },
    }
    signature = _square_signature(
        "http://testserver/api/v1/webhooks/square-payment", payload
    )

    webhook_response = client.post(
        "/api/v1/webhooks/square-payment",
        headers={
            "x-square-hmacsha256-signature": signature,
            "Content-Type": "application/json",
        },
        content=json.dumps(payload, separators=(",", ":")),
    )

    assert webhook_response.status_code == 200, webhook_response.text
    assert webhook_response.json()["processed"] is True

    async def fetch_state():
        async with db_session_factory() as session:
            user = await session.scalar(
                select(User).where(User.email == "square-bind@example.com")
            )
            profile = await session.scalar(
                select(Profile).where(Profile.user_id == user.id)
            )
            payment_events = (
                await session.scalars(
                    select(VerificationEvent)
                    .where(VerificationEvent.user_id == user.id)
                    .where(VerificationEvent.challenge_type == "payment")
                )
            ).all()
            return user, profile, payment_events

    user, profile, payment_events = _run(fetch_state())
    assert user.bot_shield_verified is True
    assert profile.verified is True
    assert len(payment_events) == 1
    assert payment_events[0].status == "completed"
    assert payment_events[0].amount_cents == 100


def test_square_payment_updated_sends_founder_badge_email(
    client, db_session_factory, monkeypatch
):
    from app.routers import webhooks

    send_welcome_email = AsyncMock(return_value=True)
    monkeypatch.setattr(webhooks, "send_welcome_email", send_welcome_email)

    _register(client, "square-updated@example.com")
    token = _login(client, "square-updated@example.com")["access_token"]

    profile_response = client.put(
        "/api/v1/profiles/me",
        headers=_auth_headers(token),
        json={
            "bio": "Ready",
            "age": 31,
            "gender": "male",
            "looking_for": "relationship",
            "location": "Orlando, FL",
            "interests": ["Music"],
        },
    )
    assert profile_response.status_code == 200, profile_response.text

    challenge_id = uuid.uuid4()

    async def insert_liveness_event() -> None:
        async with db_session_factory() as session:
            user = await session.scalar(
                select(User).where(User.email == "square-updated@example.com")
            )
            session.add(
                VerificationEvent(
                    id=challenge_id,
                    user_id=user.id,
                    challenge_type="liveness",
                    challenge_token="test-liveness-pass",
                    status="passed",
                    amount_cents=100,
                )
            )
            await session.commit()

    _run(insert_liveness_event())

    async def build_ref() -> str:
        async with db_session_factory() as session:
            user = await session.scalar(
                select(User).where(User.email == "square-updated@example.com")
            )
            return build_checkout_reference(
                user_id=user.id,
                event_id=challenge_id,
                tier="bot_shield",
                secret="test-secret-that-is-at-least-32-characters-long-for-security",
            )

    checkout_ref = _run(build_ref())

    payload = {
        "event_id": "evt_square_updated_1",
        "type": "payment.updated",
        "created_at": "2026-03-11T12:00:00Z",
        "data": {
            "object": {
                "payment": {
                    "id": "payment_updated_1",
                    "status": "COMPLETED",
                    "amount_money": {"amount": 100, "currency": "USD"},
                    "buyer_email_address": "square-updated@example.com",
                    "note": f"Bot-Shield Verification agref:{checkout_ref}",
                }
            }
        },
    }
    signature = _square_signature(
        "http://testserver/api/v1/webhooks/square-payment", payload
    )

    webhook_response = client.post(
        "/api/v1/webhooks/square-payment",
        headers={
            "x-square-hmacsha256-signature": signature,
            "Content-Type": "application/json",
        },
        content=json.dumps(payload, separators=(",", ":")),
    )

    assert webhook_response.status_code == 200, webhook_response.text
    assert webhook_response.json()["processed"] is True

    async def fetch_state():
        async with db_session_factory() as session:
            user = await session.scalar(
                select(User).where(User.email == "square-updated@example.com")
            )
            profile = await session.scalar(
                select(Profile).where(Profile.user_id == user.id)
            )
            payment_events = (
                await session.scalars(
                    select(VerificationEvent)
                    .where(VerificationEvent.user_id == user.id)
                    .where(VerificationEvent.challenge_type == "payment")
                )
            ).all()
            return user, profile, payment_events

    user, profile, payment_events = _run(fetch_state())
    assert user.bot_shield_verified is True
    assert profile.verified is True
    assert len(payment_events) == 1
    send_welcome_email.assert_awaited_once()
    assert (
        send_welcome_email.await_args.kwargs["recipient_email"]
        == "square-updated@example.com"
    )


def test_stripe_webhook_endpoint_is_retired(client):
    response = client.post("/api/v1/webhooks/stripe")
    assert response.status_code == 410
