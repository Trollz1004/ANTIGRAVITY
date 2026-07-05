import asyncio
import json
import uuid
from datetime import date, datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from sqlalchemy import select

from app.auth import create_access_token
from app.models import User, VerificationEvent
from app.payment_truth import build_checkout_reference
from app.subscriptions import LAUNCH_TRIAL_TIER
from tests.conftest import generate_square_signature, make_square_payment_event


def _auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(str(user_id))}"}


def test_register_starts_three_day_launch_trial(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "trial-user@youandinotai-test.com",
            "password": "supersecret",
            "display_name": "Trial User",
            "date_of_birth": (date.today() - timedelta(days=365 * 21)).isoformat(),
            "accepted_terms": True,
            "accepted_cookie_policy": True,
            "confirmed_over_18": True,
        },
    )

    assert response.status_code == 201, response.text
    token = response.json()["access_token"]
    me_response = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )

    assert me_response.status_code == 200, me_response.text
    payload = me_response.json()
    assert payload["subscription_tier"] == LAUNCH_TRIAL_TIER
    assert payload["subscription_active"] is True
    assert payload["bot_shield_verified"] is False

    expires_at = datetime.fromisoformat(
        payload["subscription_expires_at"].replace("Z", "+00:00")
    )
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    assert now + timedelta(days=2, hours=23) < expires_at
    assert expires_at < now + timedelta(days=3, minutes=1)


def test_billing_checkout_link_returns_bound_square_url(client, db_session_factory):
    async def seed_user() -> uuid.UUID:
        user_id = uuid.uuid4()
        async with db_session_factory() as session:
            session.add(
                User(
                    id=user_id,
                    email="billing@youandinotai-test.com",
                    password_hash="hashed",
                    display_name="Billing User",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            await session.commit()
        return user_id

    user_id = asyncio.run(seed_user())

    with patch(
        "app.routers.billing.create_square_payment_link",
        AsyncMock(return_value="https://square.link/u/bound-founder"),
    ):
        response = client.post(
            "/api/v1/billing/checkout-link",
            headers=_auth_headers(user_id),
            json={"tier": "founding_member"},
        )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["checkout_url"] == "https://square.link/u/bound-founder"

    async def fetch_event() -> VerificationEvent | None:
        async with db_session_factory() as session:
            return await session.scalar(
                select(VerificationEvent)
                .where(VerificationEvent.user_id == user_id)
                .order_by(VerificationEvent.created_at.desc())
            )

    checkout_event = asyncio.run(fetch_event())
    assert checkout_event is not None
    assert checkout_event.challenge_type == "payment"
    assert checkout_event.status == "pending"
    assert checkout_event.challenge_token is not None


def test_completed_prepaid_payment_sets_expiry(client, db_session_factory):
    async def seed_user_and_checkout() -> tuple[uuid.UUID, uuid.UUID]:
        user_id = uuid.uuid4()
        event_id = uuid.uuid4()
        async with db_session_factory() as session:
            session.add(
                User(
                    id=user_id,
                    email="three-month@youandinotai-test.com",
                    password_hash="hashed",
                    display_name="Three Month User",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            session.add(
                VerificationEvent(
                    id=event_id,
                    user_id=user_id,
                    challenge_type="payment",
                    status="pending",
                    amount_cents=3999,
                )
            )
            await session.commit()
        return user_id, event_id

    user_id, event_id = asyncio.run(seed_user_and_checkout())
    checkout_ref = build_checkout_reference(
        user_id=user_id,
        event_id=event_id,
        tier="3_month",
        secret="test-secret-that-is-at-least-32-characters-long-for-security",
    )

    payload = make_square_payment_event(
        event_id="evt_three_month_bound",
        amount_cents=3999,
        buyer_email="three-month@youandinotai-test.com",
        note=f"3-Month Founder agref:{checkout_ref}",
        payment_status="COMPLETED",
    )
    signature = generate_square_signature(
        json.dumps(payload, separators=(",", ":")).encode("utf-8"),
        "test-square-signature",
        "http://testserver/api/v1/webhooks/square-payment",
    )

    response = client.post(
        "/api/v1/webhooks/square-payment",
        headers={
            "x-square-hmacsha256-signature": signature,
            "Content-Type": "application/json",
        },
        content=json.dumps(payload, separators=(",", ":")),
    )

    assert response.status_code == 200, response.text

    async def fetch_state() -> tuple[User | None, VerificationEvent | None]:
        async with db_session_factory() as session:
            user = await session.scalar(select(User).where(User.id == user_id))
            event = await session.scalar(
                select(VerificationEvent).where(VerificationEvent.id == event_id)
            )
            return user, event

    user, event = asyncio.run(fetch_state())
    assert user is not None
    assert user.subscription_active is True
    assert user.subscription_tier == "3_month"
    assert user.subscription_expires_at is not None
    expires_at = user.subscription_expires_at.replace(tzinfo=timezone.utc)
    assert expires_at > datetime.now(timezone.utc) + timedelta(days=89)

    assert event is not None
    assert event.status == "completed"
    assert event.square_payment_id is not None


def test_auth_me_deactivates_expired_prepaid_subscription(client, db_session_factory):
    async def seed_user() -> uuid.UUID:
        user_id = uuid.uuid4()
        async with db_session_factory() as session:
            session.add(
                User(
                    id=user_id,
                    email="expired@youandinotai-test.com",
                    password_hash="hashed",
                    display_name="Expired User",
                    subscription_tier="3_month",
                    subscription_active=True,
                    subscription_expires_at=datetime.now(timezone.utc)
                    - timedelta(days=2),
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            await session.commit()
        return user_id

    user_id = asyncio.run(seed_user())
    response = client.get("/api/v1/auth/me", headers=_auth_headers(user_id))

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["subscription_active"] is False


def test_auth_me_deactivates_expired_launch_trial(client, db_session_factory):
    async def seed_user() -> uuid.UUID:
        user_id = uuid.uuid4()
        async with db_session_factory() as session:
            session.add(
                User(
                    id=user_id,
                    email="expired-trial@youandinotai-test.com",
                    password_hash="hashed",
                    display_name="Expired Trial User",
                    subscription_tier=LAUNCH_TRIAL_TIER,
                    subscription_active=True,
                    subscription_expires_at=datetime.now(timezone.utc)
                    - timedelta(minutes=5),
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            await session.commit()
        return user_id

    user_id = asyncio.run(seed_user())
    response = client.get("/api/v1/auth/me", headers=_auth_headers(user_id))

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["subscription_tier"] == LAUNCH_TRIAL_TIER
    assert payload["subscription_active"] is False
