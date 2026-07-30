"""End-to-end and branch coverage tests for the Square webhooks router.

Complements tests/test_webhooks.py and tests/test_square_webhook_security.py
by exercising the remaining production paths:

- royalty / 3_month / 12_month subscription tier activation
- Bot-Shield welcome email + existing-payment-event dedupe
- unknown customer and unmappable tier logging paths
- subscription.created / subscription.updated lifecycle
- IntegrityError at commit → duplicate ack
- Square booking webhook log writing, dedupe, and error paths
- module-level helpers (_resolve_square_log_dir, _load_square_booking,
  _append_square_logs, _is_duplicate_square_event,
  _mark_square_event_processed, _square_api_headers, _fetch_square_order)
"""

import asyncio
import csv
import json
import uuid
from datetime import date, datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select

from app.main import app
from app.models import RevenueAllocation, User, VerificationEvent, WebhookEvent
from app.payment_truth import build_checkout_reference
from app.routers import webhooks
from tests.conftest import generate_square_signature

JWT_SECRET = "test-secret-that-is-at-least-32-characters-long-for-security"
PAYMENT_URL = "http://testserver/api/v1/webhooks/square-payment"
BOOKING_URL = "http://testserver/api/v1/webhooks/square-booking"


def _seed(*items, db_session_factory) -> None:
    async def _run():
        async with db_session_factory() as session:
            for item in items:
                session.add(item)
            await session.commit()

    asyncio.run(_run())


def _make_user(**overrides) -> User:
    values = {
        "email": f"user-{uuid.uuid4().hex[:8]}@example.com",
        "password_hash": "hashed",
        "display_name": "Webhook User",
        "date_of_birth": date(1990, 1, 1),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    values.update(overrides)
    return User(id=uuid.uuid4(), **values)


def _payment_payload(
    *,
    event_id,
    amount_cents=100,
    status_value="COMPLETED",
    note="Bot-Shield Verification",
    customer_id=None,
    buyer_email=None,
    event_type="payment.updated",
):
    return {
        "event_id": event_id,
        "type": event_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data": {
            "object": {
                "payment": {
                    "id": f"pay_{uuid.uuid4().hex[:16]}",
                    "status": status_value,
                    "amount_money": {"amount": amount_cents, "currency": "USD"},
                    "customer_id": customer_id,
                    "buyer_email_address": buyer_email,
                    "note": note,
                    "order_id": f"order_{uuid.uuid4().hex[:10]}",
                }
            }
        },
    }


def _post_signed(client, url: str, payload: dict, *, signature_key="test-square-signature"):
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    signature = generate_square_signature(body, signature_key, url)
    return client.post(
        url.replace("http://testserver", ""),
        headers={
            "x-square-hmacsha256-signature": signature,
            "Content-Type": "application/json",
        },
        content=body,
    )


async def _fetch_user(db_session_factory, user_id):
    async with db_session_factory() as session:
        return await session.scalar(select(User).where(User.id == user_id))


# ── Tier branches ────────────────────────────────────────────────────────────


def test_royalty_payment_sets_tier_and_completes_bound_event(
    client, db_session_factory
):
    user = _make_user(email="royalty@example.com")
    liveness = VerificationEvent(
        id=uuid.uuid4(),
        user_id=user.id,
        challenge_type="liveness",
        status="passed",
        amount_cents=100,
    )
    _seed(user, liveness, db_session_factory=db_session_factory)

    checkout_ref = build_checkout_reference(
        user_id=user.id, event_id=liveness.id, tier="royalty", secret=JWT_SECRET
    )
    payload = _payment_payload(
        event_id="evt_royalty_1",
        amount_cents=250000,
        note=f"Royalty plan agref:{checkout_ref}",
        buyer_email="royalty@example.com",
    )

    with patch(
        "app.routers.webhooks._fetch_square_order", new=AsyncMock(return_value=None)
    ):
        resp = _post_signed(client, PAYMENT_URL, payload)
    assert resp.status_code == 200, resp.text
    assert resp.json()["duplicate"] is False

    stored = asyncio.run(_fetch_user(db_session_factory, user.id))
    assert stored.subscription_tier == "royalty"
    assert stored.subscription_expires_at is None

    async def _fetch_event():
        async with db_session_factory() as session:
            return await session.get(VerificationEvent, liveness.id)

    bound = asyncio.run(_fetch_event())
    assert bound.status == "completed"
    assert bound.square_payment_id is not None


def test_three_month_payment_activates_subscription_with_expiry(
    client, db_session_factory
):
    user = _make_user(email="three-month@example.com")
    _seed(user, db_session_factory=db_session_factory)

    payload = _payment_payload(
        event_id="evt_3mo_1",
        amount_cents=3999,
        note="3 Month Membership",
        buyer_email="three-month@example.com",
    )
    with patch(
        "app.routers.webhooks._fetch_square_order", new=AsyncMock(return_value=None)
    ):
        resp = _post_signed(client, PAYMENT_URL, payload)
    assert resp.status_code == 200, resp.text

    stored = asyncio.run(_fetch_user(db_session_factory, user.id))
    assert stored.subscription_tier == "3_month"
    assert stored.subscription_active is True
    assert stored.subscription_expires_at is not None


def test_twelve_month_payment_links_square_customer_id(client, db_session_factory):
    user = _make_user(email="twelve@example.com", square_customer_id=None)
    _seed(user, db_session_factory=db_session_factory)

    payload = _payment_payload(
        event_id="evt_12mo_1",
        amount_cents=9999,
        note="12 Month Membership",
        customer_id="CUST-NEW-1",
        buyer_email="twelve@example.com",
    )
    with patch(
        "app.routers.webhooks._fetch_square_order", new=AsyncMock(return_value=None)
    ):
        resp = _post_signed(client, PAYMENT_URL, payload)
    assert resp.status_code == 200, resp.text

    stored = asyncio.run(_fetch_user(db_session_factory, user.id))
    assert stored.subscription_tier == "12_month"
    assert stored.square_customer_id == "CUST-NEW-1"


def test_user_lookup_by_square_customer_id_and_existing_mapping(
    client, db_session_factory
):
    """A user already mapped to a Square customer id is found directly."""
    user = _make_user(
        email="mapped@example.com", square_customer_id="CUST-EXISTING-9"
    )
    _seed(user, db_session_factory=db_session_factory)

    payload = _payment_payload(
        event_id="evt_cust_lookup",
        amount_cents=3999,
        note="3 Month Membership",
        customer_id="CUST-EXISTING-9",
        buyer_email="nobody@example.com",
    )
    with patch(
        "app.routers.webhooks._fetch_square_order", new=AsyncMock(return_value=None)
    ):
        resp = _post_signed(client, PAYMENT_URL, payload)
    assert resp.status_code == 200, resp.text

    stored = asyncio.run(_fetch_user(db_session_factory, user.id))
    assert stored.subscription_active is True


def test_completed_payment_unknown_customer_is_acked(client, db_session_factory):
    payload = _payment_payload(
        event_id="evt_unknown_customer",
        amount_cents=100,
        buyer_email="ghost@example.com",
    )
    with patch(
        "app.routers.webhooks._fetch_square_order", new=AsyncMock(return_value=None)
    ):
        resp = _post_signed(client, PAYMENT_URL, payload)
    assert resp.status_code == 200, resp.text
    assert resp.json()["processed"] is True

    async def _allocations():
        async with db_session_factory() as session:
            return list((await session.scalars(select(RevenueAllocation))).all())

    allocations = asyncio.run(_allocations())
    assert len(allocations) == 1
    assert allocations[0].user_id is None


def test_completed_payment_unmappable_tier_is_acked(client, db_session_factory):
    user = _make_user(email="nomap@example.com")
    _seed(user, db_session_factory=db_session_factory)

    payload = _payment_payload(
        event_id="evt_unmappable",
        amount_cents=101,
        note="random purchase",
        buyer_email="nomap@example.com",
    )
    with patch(
        "app.routers.webhooks._fetch_square_order", new=AsyncMock(return_value=None)
    ):
        resp = _post_signed(client, PAYMENT_URL, payload)
    assert resp.status_code == 200, resp.text


def test_bot_shield_valid_binding_sends_welcome_email(client, db_session_factory):
    user = _make_user(email="welcome@example.com", bot_shield_verified=False)
    liveness = VerificationEvent(
        id=uuid.uuid4(),
        user_id=user.id,
        challenge_type="liveness",
        status="passed",
        amount_cents=100,
    )
    _seed(user, liveness, db_session_factory=db_session_factory)

    checkout_ref = build_checkout_reference(
        user_id=user.id, event_id=liveness.id, tier="bot_shield", secret=JWT_SECRET
    )
    payload = _payment_payload(
        event_id="evt_welcome_email",
        amount_cents=100,
        note=f"Bot-Shield Verification agref:{checkout_ref}",
        buyer_email="welcome@example.com",
    )

    with (
        patch(
            "app.routers.webhooks._fetch_square_order",
            new=AsyncMock(return_value=None),
        ),
        patch("app.routers.webhooks.send_welcome_email") as mock_welcome,
    ):
        mock_welcome.return_value = AsyncMock(return_value=None)()
        resp = _post_signed(client, PAYMENT_URL, payload)

    assert resp.status_code == 200, resp.text
    mock_welcome.assert_called_once()
    assert mock_welcome.call_args.kwargs["recipient_email"] == "welcome@example.com"

    stored = asyncio.run(_fetch_user(db_session_factory, user.id))
    assert stored.bot_shield_verified is True


def test_bot_shield_payment_does_not_duplicate_existing_payment_event(
    client, db_session_factory
):
    user = _make_user(email="dupe-event@example.com")
    liveness = VerificationEvent(
        id=uuid.uuid4(),
        user_id=user.id,
        challenge_type="liveness",
        status="passed",
        amount_cents=100,
    )
    _seed(user, liveness, db_session_factory=db_session_factory)

    checkout_ref = build_checkout_reference(
        user_id=user.id, event_id=liveness.id, tier="bot_shield", secret=JWT_SECRET
    )
    payment_id = f"pay_{uuid.uuid4().hex[:16]}"
    existing_payment_event = VerificationEvent(
        id=uuid.uuid4(),
        user_id=user.id,
        challenge_type="payment",
        status="completed",
        amount_cents=100,
        square_payment_id=payment_id,
    )
    _seed(existing_payment_event, db_session_factory=db_session_factory)

    payload = _payment_payload(
        event_id="evt_dupe_payment_event",
        amount_cents=100,
        note=f"Bot-Shield Verification agref:{checkout_ref}",
        buyer_email="dupe-event@example.com",
    )
    payload["data"]["object"]["payment"]["id"] = payment_id

    with (
        patch(
            "app.routers.webhooks._fetch_square_order",
            new=AsyncMock(return_value=None),
        ),
        patch("app.routers.webhooks.send_welcome_email", new=AsyncMock()),
    ):
        resp = _post_signed(client, PAYMENT_URL, payload)
    assert resp.status_code == 200, resp.text

    async def _payment_events():
        async with db_session_factory() as session:
            return list(
                (
                    await session.scalars(
                        select(VerificationEvent).where(
                            VerificationEvent.challenge_type == "payment"
                        )
                    )
                ).all()
            )

    assert len(asyncio.run(_payment_events())) == 1


def test_already_verified_bot_shield_payment_sends_no_welcome_email(
    client, db_session_factory
):
    user = _make_user(email="again@example.com", bot_shield_verified=True)
    liveness = VerificationEvent(
        id=uuid.uuid4(),
        user_id=user.id,
        challenge_type="liveness",
        status="passed",
        amount_cents=100,
    )
    _seed(user, liveness, db_session_factory=db_session_factory)

    checkout_ref = build_checkout_reference(
        user_id=user.id, event_id=liveness.id, tier="bot_shield", secret=JWT_SECRET
    )
    payload = _payment_payload(
        event_id="evt_no_second_welcome",
        amount_cents=100,
        note=f"Bot-Shield Verification agref:{checkout_ref}",
        buyer_email="again@example.com",
    )

    with (
        patch(
            "app.routers.webhooks._fetch_square_order",
            new=AsyncMock(return_value=None),
        ),
        patch("app.routers.webhooks.send_welcome_email") as mock_welcome,
    ):
        resp = _post_signed(client, PAYMENT_URL, payload)

    assert resp.status_code == 200, resp.text
    mock_welcome.assert_not_called()


# ── Subscription lifecycle events ────────────────────────────────────────────


def _subscription_payload(*, event_id, event_type, sub_status, user_email):
    return {
        "event_id": event_id,
        "type": event_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data": {
            "object": {
                "subscription": {"status": sub_status},
                "customer_id": None,
            }
        },
    }


def test_subscription_created_activates_founding_member(client, db_session_factory):
    user = _make_user(email="sub-created@example.com")
    _seed(user, db_session_factory=db_session_factory)

    payload = {
        "event_id": "evt_sub_created_1",
        "type": "subscription.created",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data": {
            "object": {
                "payment": {
                    "id": "pay_sub1",
                    "status": "COMPLETED",
                    "amount_money": {"amount": 0, "currency": "USD"},
                    "customer_id": None,
                    "buyer_email_address": "sub-created@example.com",
                    "note": "",
                }
            }
        },
    }
    with patch(
        "app.routers.webhooks._fetch_square_order", new=AsyncMock(return_value=None)
    ):
        resp = _post_signed(client, PAYMENT_URL, payload)
    assert resp.status_code == 200, resp.text

    stored = asyncio.run(_fetch_user(db_session_factory, user.id))
    assert stored.subscription_active is True
    assert stored.subscription_tier == "founding_member"
    assert stored.subscription_expires_at is None


def test_subscription_created_without_user_is_noop(client, db_session_factory):
    payload = {
        "event_id": "evt_sub_created_unknown",
        "type": "subscription.created",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data": {"object": {"payment": {"id": "pay_x", "status": "FAILED"}}},
    }
    with patch(
        "app.routers.webhooks._fetch_square_order", new=AsyncMock(return_value=None)
    ):
        resp = _post_signed(client, PAYMENT_URL, payload)
    assert resp.status_code == 200, resp.text


def test_subscription_updated_cancel_deactivates(client, db_session_factory):
    user = _make_user(
        email="cancel@example.com",
        subscription_active=True,
        subscription_tier="founding_member",
    )
    _seed(user, db_session_factory=db_session_factory)

    payload = {
        "event_id": "evt_sub_cancel_1",
        "type": "subscription.updated",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data": {
            "object": {
                "payment": {
                    "id": "pay_cancel",
                    "status": "FAILED",
                    "buyer_email_address": "cancel@example.com",
                },
                "subscription": {"status": "CANCELED"},
            }
        },
    }
    with patch(
        "app.routers.webhooks._fetch_square_order", new=AsyncMock(return_value=None)
    ):
        resp = _post_signed(client, PAYMENT_URL, payload)
    assert resp.status_code == 200, resp.text

    stored = asyncio.run(_fetch_user(db_session_factory, user.id))
    assert stored.subscription_active is False


def test_subscription_updated_active_reactivates(client, db_session_factory):
    user = _make_user(email="reactivate@example.com", subscription_active=False)
    _seed(user, db_session_factory=db_session_factory)

    payload = {
        "event_id": "evt_sub_active_1",
        "type": "subscription.updated",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data": {
            "object": {
                "payment": {
                    "id": "pay_active",
                    "status": "FAILED",
                    "buyer_email_address": "reactivate@example.com",
                },
                "subscription": {"status": "ACTIVE"},
            }
        },
    }
    with patch(
        "app.routers.webhooks._fetch_square_order", new=AsyncMock(return_value=None)
    ):
        resp = _post_signed(client, PAYMENT_URL, payload)
    assert resp.status_code == 200, resp.text

    stored = asyncio.run(_fetch_user(db_session_factory, user.id))
    assert stored.subscription_active is True


def test_unknown_event_type_still_marks_processed(client, db_session_factory):
    payload = {
        "event_id": "evt_unknown_type",
        "type": "inventory.count.updated",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data": {"object": {}},
    }
    with patch(
        "app.routers.webhooks._fetch_square_order", new=AsyncMock(return_value=None)
    ):
        resp = _post_signed(client, PAYMENT_URL, payload)
    assert resp.status_code == 200, resp.text
    assert resp.json()["processed"] is True

    async def _fetch_event():
        async with db_session_factory() as session:
            return await session.scalar(
                select(WebhookEvent).where(
                    WebhookEvent.event_source_id == "evt_unknown_type"
                )
            )

    stored = asyncio.run(_fetch_event())
    assert stored is not None
    assert stored.processed is True


# ── Payload guards ───────────────────────────────────────────────────────────


def test_payment_webhook_rejects_invalid_json(client):
    body = b"{not-json"
    signature = generate_square_signature(body, "test-square-signature", PAYMENT_URL)
    resp = client.post(
        "/api/v1/webhooks/square-payment",
        headers={"x-square-hmacsha256-signature": signature},
        content=body,
    )
    assert resp.status_code == 400


def test_payment_webhook_rejects_oversized_payload(client):
    big = json.dumps(
        {
            "event_id": "evt_big",
            "type": "payment.updated",
            "data": {"object": {"payment": {"note": "x" * 600_000}}},
        }
    ).encode("utf-8")
    signature = generate_square_signature(big, "test-square-signature", PAYMENT_URL)
    resp = client.post(
        "/api/v1/webhooks/square-payment",
        headers={"x-square-hmacsha256-signature": signature},
        content=big,
    )
    assert resp.status_code == 413


def test_commit_integrity_error_returns_duplicate_ack(client, db_session_factory):
    """A unique-violation race at commit time is acknowledged as a duplicate."""
    payload = _payment_payload(event_id="evt_integrity_race", amount_cents=100)
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    signature = generate_square_signature(body, "test-square-signature", PAYMENT_URL)

    duplicate_row = WebhookEvent(
        event_source_id="evt_integrity_race",
        event_type="payment.updated",
        payload={},
        processed=False,
    )
    _seed(duplicate_row, db_session_factory=db_session_factory)

    with patch(
        "app.routers.webhooks.webhook_event_exists", new=AsyncMock(return_value=False)
    ):
        resp = client.post(
            "/api/v1/webhooks/square-payment",
            headers={
                "x-square-hmacsha256-signature": signature,
                "Content-Type": "application/json",
            },
            content=body,
        )
    assert resp.status_code == 200, resp.text
    assert resp.json()["duplicate"] is True


# ── Square Booking webhook ───────────────────────────────────────────────────


def test_booking_webhook_writes_logs_and_dedupes(client, tmp_path):
    payload = {
        "event_id": "evt_booking_1",
        "type": "booking.created",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "merchant_id": "MERCHANT123",
        "data": {
            "object": {
                "booking": {
                    "id": "bk_123",
                    "status": "ACCEPTED",
                    "start_at": "2026-04-04T10:00:00Z",
                    "location_id": "LOC123",
                    "customer_id": "CUST123",
                    "customer_details": {
                        "email_address": "customer@example.com",
                        "phone": "+15550004567",
                    },
                    "customer_note": "E-waste pickup",
                }
            }
        },
    }

    with patch.object(webhooks, "REPO_ROOT", tmp_path):
        with patch("app.routers.webhooks.get_settings") as mock_get_settings:
            settings = MagicMock()
            settings.square_webhook_verify_signature = True
            settings.square_booking_webhook_signature_key = "test-square-signature"
            settings.square_booking_webhook_notification_url = BOOKING_URL
            settings.square_webhook_signature_key = ""
            settings.square_webhook_notification_url = ""
            settings.square_booking_log_dir = str(tmp_path / "booking-logs")
            mock_get_settings.return_value = settings

            resp = _post_signed(client, BOOKING_URL, payload)
            assert resp.status_code == 200, resp.text
            assert resp.json() == {
                "received": True,
                "event_id": "evt_booking_1",
                "processed": True,
                "duplicate": False,
            }

            log_dir = tmp_path / "booking-logs"
            jsonl = (log_dir / "square-bookings-events.jsonl").read_text()
            assert "evt_booking_1" in jsonl
            assert "customer@example.com" in jsonl

            with (log_dir / "square-bookings-intake-log.csv").open() as f:
                rows = list(csv.DictReader(f))
            assert len(rows) == 1
            assert rows[0]["booking_id"] == "bk_123"
            assert rows[0]["customer_note"] == "E-waste pickup"

            # Second delivery of the same event id is flagged as duplicate
            resp2 = _post_signed(client, BOOKING_URL, payload)
            assert resp2.status_code == 200
            assert resp2.json()["duplicate"] is True

            # And no second CSV row was appended
            with (log_dir / "square-bookings-intake-log.csv").open() as f:
                assert len(list(csv.DictReader(f))) == 1


def test_booking_webhook_rejects_invalid_json(client, tmp_path):
    body = b"not-json-at-all"
    with patch("app.routers.webhooks.get_settings") as mock_get_settings:
        settings = MagicMock()
        settings.square_webhook_verify_signature = True
        settings.square_booking_webhook_signature_key = "test-square-signature"
        settings.square_booking_webhook_notification_url = BOOKING_URL
        settings.square_webhook_signature_key = ""
        settings.square_webhook_notification_url = ""
        mock_get_settings.return_value = settings

        signature = generate_square_signature(body, "test-square-signature", BOOKING_URL)
        resp = client.post(
            "/api/v1/webhooks/square-booking",
            headers={"x-square-hmacsha256-signature": signature},
            content=body,
        )
        assert resp.status_code == 400


def test_booking_webhook_rejects_oversized_payload(client):
    with patch("app.routers.webhooks.get_settings") as mock_get_settings:
        settings = MagicMock()
        settings.square_webhook_verify_signature = False
        mock_get_settings.return_value = settings

        big = b"{" + b'"a":"' + b"z" * 600_000 + b'"}'
        resp = client.post("/api/v1/webhooks/square-booking", content=big)
        assert resp.status_code == 413


# ── Helper-level coverage ────────────────────────────────────────────────────


def test_resolve_square_log_dir_configured_absolute_and_relative(tmp_path):
    settings = MagicMock(square_booking_log_dir=str(tmp_path / "abs"))
    assert webhooks._resolve_square_log_dir(settings) == tmp_path / "abs"

    settings = MagicMock(square_booking_log_dir="relative/dir")
    result = webhooks._resolve_square_log_dir(settings)
    assert result == webhooks.REPO_ROOT / "relative" / "dir"

    with patch.object(webhooks, "CONTAINER_EWASTE_MOUNT", tmp_path / "mount"):
        (tmp_path / "mount").mkdir()
        settings = MagicMock(square_booking_log_dir="")
        assert webhooks._resolve_square_log_dir(settings) == tmp_path / "mount" / "bookings"

    with patch.object(webhooks, "CONTAINER_EWASTE_MOUNT", tmp_path / "missing"):
        settings = MagicMock(square_booking_log_dir="")
        assert webhooks._resolve_square_log_dir(settings) == (
            webhooks.REPO_ROOT / "data" / "ewaste-intake" / "bookings"
        )


def test_load_square_booking_payload_shapes():
    nested = {"data": {"object": {"booking": {"id": "b1"}}}}
    assert webhooks._load_square_booking(nested) == {"id": "b1"}

    flat_object = {"data": {"object": {"id": "b2", "status": "ACCEPTED"}}}
    assert webhooks._load_square_booking(flat_object) == {"id": "b2", "status": "ACCEPTED"}

    data_booking = {"data": {"object": {}, "booking": {"id": "b3"}}}
    assert webhooks._load_square_booking(data_booking) == {"id": "b3"}

    top_level = {"booking": {"id": "b4"}}
    assert webhooks._load_square_booking(top_level) == {"id": "b4"}

    assert webhooks._load_square_booking({"nothing": True}) == {}
    assert webhooks._load_square_booking({"data": "nope"}) == {}


def test_append_square_logs_handles_missing_customer_details(tmp_path):
    payload = {
        "event_id": "evt_no_details",
        "type": "booking.created",
        "data": {"object": {"booking": {"id": "bk_x", "customer_details": "bad"}}},
    }
    webhooks._append_square_logs("evt_no_details", payload, tmp_path)
    jsonl = (tmp_path / "square-bookings-events.jsonl").read_text()
    assert "evt_no_details" in jsonl


def test_duplicate_index_helpers(tmp_path):
    assert webhooks._is_duplicate_square_event("", tmp_path) is False
    assert webhooks._is_duplicate_square_event("evt_x", tmp_path) is False

    webhooks._mark_square_event_processed("evt_x", tmp_path)
    assert webhooks._is_duplicate_square_event("evt_x", tmp_path) is True
    assert webhooks._is_duplicate_square_event("evt_y", tmp_path) is False

    webhooks._mark_square_event_processed("", tmp_path)  # no-op

    # Unreadable index file → False (fail open)
    index_file = tmp_path / "square-booking-event-ids.txt"
    with patch.object(Path, "open", side_effect=OSError("locked")):
        assert webhooks._is_duplicate_square_event("evt_x", tmp_path) is False
    assert index_file.exists()


def test_square_api_headers_and_unsupported_endpoint():
    settings = MagicMock(square_access_token="")
    assert webhooks._square_api_headers(settings) is None

    settings = MagicMock(square_access_token="tok", square_api_version="2026-02-01")
    headers = webhooks._square_api_headers(settings)
    assert headers["Authorization"] == "Bearer tok"
    assert headers["Square-Version"] == "2026-02-01"

    with pytest.raises(ValueError):
        webhooks._resolve_square_signature_material(settings, "unknown-endpoint")


@pytest.mark.asyncio
async def test_fetch_square_order_paths():
    settings = MagicMock(square_access_token="")
    assert await webhooks._fetch_square_order(None, settings) is None
    assert await webhooks._fetch_square_order("order-1", settings) is None

    settings = MagicMock(
        square_access_token="tok",
        square_api_version="2026-01-22",
        square_api_base_url="https://connect.squareup.test",
    )

    good_response = MagicMock()
    good_response.json.return_value = {"order": {"id": "order-1"}}
    good_response.raise_for_status = MagicMock()

    good_client = AsyncMock()
    good_client.get = AsyncMock(return_value=good_response)
    good_client.__aenter__ = AsyncMock(return_value=good_client)
    good_client.__aexit__ = AsyncMock(return_value=False)

    with patch("httpx.AsyncClient", return_value=good_client):
        assert await webhooks._fetch_square_order("order-1", settings) == {
            "id": "order-1"
        }

    bad_client = AsyncMock()
    bad_client.get = AsyncMock(side_effect=ValueError("boom"))
    bad_client.__aenter__ = AsyncMock(return_value=bad_client)
    bad_client.__aexit__ = AsyncMock(return_value=False)
    with patch("httpx.AsyncClient", return_value=bad_client):
        assert await webhooks._fetch_square_order("order-1", settings) is None

    wrong_shape = MagicMock()
    wrong_shape.json.return_value = {"unexpected": []}
    wrong_shape.raise_for_status = MagicMock()
    wrong_client = AsyncMock()
    wrong_client.get = AsyncMock(return_value=wrong_shape)
    wrong_client.__aenter__ = AsyncMock(return_value=wrong_client)
    wrong_client.__aexit__ = AsyncMock(return_value=False)
    with patch("httpx.AsyncClient", return_value=wrong_client):
        assert await webhooks._fetch_square_order("order-1", settings) is None


def test_extract_square_customer_email_from_receipt_url():
    payment = {
        "receipt_url": "https://squareup.com/receipt?email=Person%40Example.com"
    }
    assert (
        webhooks._extract_square_customer_email(payment) == "person@example.com"
    )
    assert webhooks._extract_square_customer_email({}) is None

    # unparseable receipt urls are ignored safely
    payment = {"receipt_url": "email=::://bad-url"}
    assert webhooks._extract_square_customer_email(payment) is None


def test_stripe_webhook_is_retired(client):
    resp = client.post("/api/v1/webhooks/stripe")
    assert resp.status_code == 410
    assert "retired" in resp.json()["detail"]
