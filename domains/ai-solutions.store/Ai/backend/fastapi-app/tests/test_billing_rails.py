"""Coverage for the non-Square-happy-path branches of the billing router."""

import asyncio
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.auth import create_access_token
from app.models import User, VerificationEvent
from app.routers.billing import _assert_not_stripe

JWT_SECRET = "test-secret-that-is-at-least-32-characters-long-for-security"


def _settings(**overrides) -> SimpleNamespace:
    base = {
        "jwt_secret": JWT_SECRET,
        "app_url": "https://youandinotai.com",
        "square_access_token": "sq-token",
        "square_location_id": "sq-loc",
        "paypal_client_id": "",
        "paypal_client_secret": "",
        "paypal_api_base_url": "https://api-m.sandbox.paypal.com",
        "paypal_qr_primary_url": "https://paypal.com/qr/primary",
        "paypal_qr_tip_jar_url": "https://paypal.com/qr/tip",
        "cashapp_cashtag": "",
        "cashapp_checkout_base_url": "",
        "plaid_client_id": "",
        "plaid_secret": "",
        "plaid_env": "sandbox",
        "plaid_products": "auth,identity",
        "plaid_country_codes": "US",
    }
    base.update(overrides)
    return SimpleNamespace(**base)


def _patch_settings(**overrides):
    return patch(
        "app.routers.billing.get_settings", return_value=_settings(**overrides)
    )


class _FakeResponse:
    def __init__(self, data=None, error: Exception | None = None):
        self._data = data or {}
        self._error = error

    def raise_for_status(self) -> None:
        if self._error is not None:
            raise self._error

    def json(self):
        if isinstance(self._data, Exception):
            raise self._data
        return self._data


class _FakeAsyncClient:
    def __init__(self, handler):
        self._handler = handler

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc_info):
        return False

    async def post(self, url, **kwargs):
        return self._handler(url)


def _patch_httpx(handler):
    return patch(
        "app.routers.billing.httpx.AsyncClient",
        lambda *_args, **_kwargs: _FakeAsyncClient(handler),
    )


@pytest.fixture()
def billing_user(db_session_factory):
    """Seed a user with a Square-compatible email and return (id, auth headers)."""

    async def seed(email: str) -> uuid.UUID:
        user_id = uuid.uuid4()
        async with db_session_factory() as session:
            session.add(
                User(
                    id=user_id,
                    email=email,
                    password_hash="hashed",
                    display_name="Rails User",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            await session.commit()
        return user_id

    def _factory(email: str | None = None):
        address = email or f"rails-{uuid.uuid4().hex[:8]}@youandinotai-test.com"
        user_id = asyncio.run(seed(address))
        return user_id, {"Authorization": f"Bearer {create_access_token(str(user_id))}"}

    return _factory


def _events_for(db_session_factory, user_id: uuid.UUID) -> list[VerificationEvent]:
    async def fetch():
        async with db_session_factory() as session:
            result = await session.scalars(
                select(VerificationEvent).where(VerificationEvent.user_id == user_id)
            )
            return list(result)

    return asyncio.run(fetch())


# ── stripe guard ─────────────────────────────────────────────────────────────


def test_assert_not_stripe_blocks_stripe_hints():
    _assert_not_stripe("square")
    with pytest.raises(HTTPException) as exc:
        _assert_not_stripe("STRIPE-checkout")
    assert exc.value.status_code == 400


# ── rails status ─────────────────────────────────────────────────────────────


def test_rails_status_reports_configured_rails(client):
    with _patch_settings(
        paypal_client_id="id",
        paypal_client_secret="secret",
        cashapp_cashtag="$YouAndINotAI",
        plaid_client_id="plaid-id",
        plaid_secret="plaid-secret",
    ):
        payload = client.get("/api/v1/billing/rails").json()

    assert payload == {
        "square": True,
        "paypal": True,
        "paypal_qr": True,
        "cashapp": True,
        "plaid": True,
        "stripe": False,
        "paypal_qr_primary": "https://paypal.com/qr/primary",
        "paypal_qr_tip_jar": "https://paypal.com/qr/tip",
    }


def test_rails_status_reports_unconfigured_rails(client):
    with _patch_settings(
        square_access_token="",
        paypal_qr_primary_url="",
        paypal_qr_tip_jar_url="",
    ):
        payload = client.get("/api/v1/billing/rails").json()

    assert payload["square"] is False
    assert payload["paypal"] is False
    assert payload["cashapp"] is False
    assert payload["plaid"] is False
    assert payload["stripe"] is False
    assert payload["paypal_qr"] is False
    assert payload["paypal_qr_primary"] is None
    assert payload["paypal_qr_tip_jar"] is None


# ── square checkout link ─────────────────────────────────────────────────────


def test_checkout_link_rejects_unsupported_email(client, billing_user):
    _user_id, headers = billing_user("blocked@example.com")
    with _patch_settings():
        response = client.post(
            "/api/v1/billing/checkout-link",
            headers=headers,
            json={"tier": "founding_member"},
        )
    assert response.status_code == 400
    assert "real email address" in response.text


def test_checkout_link_marks_event_failed_when_square_unavailable(
    client, billing_user, db_session_factory
):
    user_id, headers = billing_user()
    with (
        _patch_settings(),
        patch(
            "app.routers.billing.create_square_payment_link",
            AsyncMock(return_value=None),
        ),
    ):
        response = client.post(
            "/api/v1/billing/checkout-link",
            headers=headers,
            json={"tier": "12_month"},
        )

    assert response.status_code == 503
    events = _events_for(db_session_factory, user_id)
    assert [event.status for event in events] == ["failed"]
    assert events[0].completed_at is not None


# ── paypal ───────────────────────────────────────────────────────────────────


def test_paypal_create_order_requires_credentials(client, billing_user):
    _user_id, headers = billing_user()
    with _patch_settings():
        response = client.post(
            "/api/v1/billing/paypal/create-order",
            headers=headers,
            json={"tier": "founding_member"},
        )
    assert response.status_code == 503
    assert "PAYPAL_CLIENT_ID" in response.text


def test_paypal_create_order_returns_approve_url(
    client, billing_user, db_session_factory
):
    user_id, headers = billing_user()

    def handler(url: str) -> _FakeResponse:
        if url.endswith("/v1/oauth2/token"):
            return _FakeResponse({"access_token": "paypal-token"})
        return _FakeResponse(
            {
                "id": "ORDER-123",
                "links": [
                    {"rel": "self", "href": "https://api.paypal.com/self"},
                    {"rel": "approve", "href": "https://paypal.com/approve/ORDER-123"},
                ],
            }
        )

    with (
        _patch_settings(paypal_client_id="id", paypal_client_secret="secret"),
        _patch_httpx(handler),
    ):
        response = client.post(
            "/api/v1/billing/paypal/create-order",
            headers=headers,
            json={"tier": "3_month"},
        )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload == {
        "approve_url": "https://paypal.com/approve/ORDER-123",
        "order_id": "ORDER-123",
        "rail": "paypal",
    }

    events = _events_for(db_session_factory, user_id)
    assert [event.challenge_type for event in events] == ["payment_paypal"]
    assert events[0].challenge_token == "ORDER-123"
    assert events[0].status == "pending"


def test_paypal_oauth_failure_reports_unconfigured(client, billing_user):
    _user_id, headers = billing_user()

    def handler(url: str) -> _FakeResponse:
        return _FakeResponse(error=httpx.HTTPError("boom"))

    with (
        _patch_settings(paypal_client_id="id", paypal_client_secret="secret"),
        _patch_httpx(handler),
    ):
        response = client.post(
            "/api/v1/billing/paypal/create-order",
            headers=headers,
            json={"tier": "royalty"},
        )

    assert response.status_code == 503


def test_paypal_order_failure_marks_event_failed(
    client, billing_user, db_session_factory
):
    user_id, headers = billing_user()

    def handler(url: str) -> _FakeResponse:
        if url.endswith("/v1/oauth2/token"):
            return _FakeResponse({"access_token": "paypal-token"})
        return _FakeResponse(error=httpx.HTTPError("order boom"))

    with (
        _patch_settings(paypal_client_id="id", paypal_client_secret="secret"),
        _patch_httpx(handler),
    ):
        response = client.post(
            "/api/v1/billing/paypal/create-order",
            headers=headers,
            json={"tier": "founding_member"},
        )

    assert response.status_code == 503
    assert "temporarily unavailable" in response.text
    events = _events_for(db_session_factory, user_id)
    assert [event.status for event in events] == ["failed"]


def test_paypal_missing_approve_link_marks_event_failed(
    client, billing_user, db_session_factory
):
    user_id, headers = billing_user()

    def handler(url: str) -> _FakeResponse:
        if url.endswith("/v1/oauth2/token"):
            return _FakeResponse({"access_token": "paypal-token"})
        return _FakeResponse({"id": "ORDER-999", "links": [{"rel": "self"}]})

    with (
        _patch_settings(paypal_client_id="id", paypal_client_secret="secret"),
        _patch_httpx(handler),
    ):
        response = client.post(
            "/api/v1/billing/paypal/create-order",
            headers=headers,
            json={"tier": "founding_member"},
        )

    assert response.status_code == 503
    assert "approve URL" in response.text
    events = _events_for(db_session_factory, user_id)
    assert [event.status for event in events] == ["failed"]


# ── cash app ─────────────────────────────────────────────────────────────────


def test_cashapp_prefers_hosted_checkout(client, billing_user, db_session_factory):
    user_id, headers = billing_user()
    with _patch_settings(cashapp_checkout_base_url="https://cash.app/pay?src=web"):
        response = client.post(
            "/api/v1/billing/cashapp/checkout",
            headers=headers,
            json={"tier": "founding_member"},
        )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["rail"] == "cashapp"
    assert payload["checkout_url"].startswith("https://cash.app/pay?src=web&tier=")
    assert f"uid={user_id}" in payload["checkout_url"]

    events = _events_for(db_session_factory, user_id)
    assert events[0].challenge_token == f"cashapp-hosted:{events[0].id}"


def test_cashapp_falls_back_to_square_link(client, billing_user):
    _user_id, headers = billing_user()
    with (
        _patch_settings(),
        patch(
            "app.routers.billing.create_square_payment_link",
            AsyncMock(return_value="https://square.link/u/cashapp"),
        ),
    ):
        response = client.post(
            "/api/v1/billing/cashapp/checkout",
            headers=headers,
            json={"tier": "12_month"},
        )

    assert response.status_code == 200, response.text
    assert response.json()["checkout_url"] == "https://square.link/u/cashapp"


def test_cashapp_falls_back_to_cashtag_deep_link(
    client, billing_user, db_session_factory
):
    user_id, headers = billing_user()
    with (
        _patch_settings(cashapp_cashtag="$YouAndINotAI"),
        patch(
            "app.routers.billing.create_square_payment_link",
            AsyncMock(return_value=None),
        ),
    ):
        response = client.post(
            "/api/v1/billing/cashapp/checkout",
            headers=headers,
            json={"tier": "founding_member"},
        )

    assert response.status_code == 200, response.text
    assert response.json()["checkout_url"] == "https://cash.app/$YouAndINotAI/14.99"
    events = _events_for(db_session_factory, user_id)
    assert events[0].challenge_token.startswith("cashapp-tag:YouAndINotAI:")


def test_cashapp_unconfigured_marks_event_failed(
    client, billing_user, db_session_factory
):
    user_id, headers = billing_user()
    with (
        _patch_settings(square_access_token=""),
        patch(
            "app.routers.billing.create_square_payment_link",
            AsyncMock(return_value=None),
        ),
    ):
        response = client.post(
            "/api/v1/billing/cashapp/checkout",
            headers=headers,
            json={"tier": "founding_member"},
        )

    assert response.status_code == 503
    assert "CASHAPP_CHECKOUT_BASE_URL" in response.text
    events = _events_for(db_session_factory, user_id)
    assert [event.status for event in events] == ["failed"]


# ── plaid ────────────────────────────────────────────────────────────────────


def test_plaid_link_token_requires_credentials(client, billing_user):
    _user_id, headers = billing_user()
    with _patch_settings():
        response = client.post("/api/v1/billing/plaid/link-token", headers=headers)
    assert response.status_code == 503
    assert "PLAID_CLIENT_ID" in response.text


def test_plaid_link_token_success(client, billing_user):
    _user_id, headers = billing_user()
    captured: list[str] = []

    def handler(url: str) -> _FakeResponse:
        captured.append(url)
        return _FakeResponse(
            {"link_token": "link-sandbox-123", "expiration": "2030-01-01T00:00:00Z"}
        )

    with (
        _patch_settings(
            plaid_client_id="id",
            plaid_secret="secret",
            plaid_env="production",
        ),
        _patch_httpx(handler),
    ):
        response = client.post("/api/v1/billing/plaid/link-token", headers=headers)

    assert response.status_code == 200, response.text
    assert response.json() == {
        "link_token": "link-sandbox-123",
        "expiration": "2030-01-01T00:00:00Z",
        "rail": "plaid",
    }
    assert captured == ["https://production.plaid.com/link/token/create"]


def test_plaid_unknown_env_defaults_to_sandbox_host(client, billing_user):
    _user_id, headers = billing_user()
    captured: list[str] = []

    def handler(url: str) -> _FakeResponse:
        captured.append(url)
        return _FakeResponse({"link_token": "link-1"})

    with (
        _patch_settings(
            plaid_client_id="id",
            plaid_secret="secret",
            plaid_env="staging",
            plaid_products="",
            plaid_country_codes="",
        ),
        _patch_httpx(handler),
    ):
        response = client.post("/api/v1/billing/plaid/link-token", headers=headers)

    assert response.status_code == 200, response.text
    assert response.json()["expiration"] is None
    assert captured == ["https://sandbox.plaid.com/link/token/create"]


def test_plaid_http_failure_returns_service_unavailable(client, billing_user):
    _user_id, headers = billing_user()

    def handler(url: str) -> _FakeResponse:
        return _FakeResponse(error=httpx.HTTPError("plaid boom"))

    with (
        _patch_settings(plaid_client_id="id", plaid_secret="secret"),
        _patch_httpx(handler),
    ):
        response = client.post("/api/v1/billing/plaid/link-token", headers=headers)

    assert response.status_code == 503
    assert "Plaid Link is temporarily unavailable" in response.text


def test_plaid_missing_token_returns_service_unavailable(client, billing_user):
    _user_id, headers = billing_user()

    def handler(url: str) -> _FakeResponse:
        return _FakeResponse({"link_token": "  "})

    with (
        _patch_settings(plaid_client_id="id", plaid_secret="secret"),
        _patch_httpx(handler),
    ):
        response = client.post("/api/v1/billing/plaid/link-token", headers=headers)

    assert response.status_code == 503
    assert "did not return a link_token" in response.text
