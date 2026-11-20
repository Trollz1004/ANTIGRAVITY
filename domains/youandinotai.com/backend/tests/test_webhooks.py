"""Webhook tests for YouAndINotAI backend.

Tests cover:
  - Square webhook HMAC-SHA256 signature verification
  - Bot-Shield $1 payment processing
  - Subscription payment processing
  - Booking webhook logging
  - Duplicate event handling
  - Payload size limits
"""

import json
import os
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

os.environ["JWT_SECRET"] = (
    "test-secret-that-is-at-least-32-characters-long-for-security"
)

from sqlalchemy import select

from app.models import Profile, RevenueAllocation, User, VerificationEvent
from app.payment_truth import build_checkout_reference
from app.verification_service import has_completed_payment
from tests.conftest import (
    generate_square_signature,
    make_square_booking_event,
    make_square_payment_event,
)


class TestSquareSignatureVerification:
    """Test Square webhook HMAC-SHA256 signature verification.

    Square signs webhooks with:
      HMAC-SHA256(notification_url + body, signature_key)
    then base64-encodes the result.
    """

    SIGNATURE_KEY = "test-square-webhook-signature-key"
    NOTIFICATION_URL = "https://youandinotai.com/api/v1/webhooks/square-payment"

    def test_valid_signature_passes(self):
        """A correctly signed payload must pass verification."""
        from app.routers.webhooks import _verify_square_signature

        payload = json.dumps(
            {"event_id": "test123", "type": "payment.completed"}
        ).encode()
        signature = generate_square_signature(
            payload, self.SIGNATURE_KEY, self.NOTIFICATION_URL
        )

        # Should not raise
        _verify_square_signature(
            payload,
            signature,
            signature_key=self.SIGNATURE_KEY,
            notification_url=self.NOTIFICATION_URL,
        )

    def test_invalid_signature_raises(self):
        """A tampered payload must fail verification."""
        from fastapi import HTTPException

        from app.routers.webhooks import _verify_square_signature

        payload = json.dumps(
            {"event_id": "test123", "type": "payment.completed"}
        ).encode()

        with pytest.raises(HTTPException) as exc_info:
            _verify_square_signature(
                payload,
                "invalid-signature",
                signature_key=self.SIGNATURE_KEY,
                notification_url=self.NOTIFICATION_URL,
            )
        assert exc_info.value.status_code == 400

    def test_missing_signature_raises(self):
        """A request without a signature header must fail."""
        from fastapi import HTTPException

        from app.routers.webhooks import _verify_square_signature

        payload = b'{"test": true}'

        with pytest.raises(HTTPException) as exc_info:
            _verify_square_signature(
                payload,
                None,
                signature_key=self.SIGNATURE_KEY,
                notification_url=self.NOTIFICATION_URL,
            )
        assert exc_info.value.status_code == 400

    def test_missing_config_raises_503(self):
        """If verification is enabled but key/url not configured, return 503."""
        from fastapi import HTTPException

        from app.routers.webhooks import _verify_square_signature

        payload = b'{"test": true}'

        with pytest.raises(HTTPException) as exc_info:
            _verify_square_signature(
                payload,
                "some-sig",
                signature_key="",
                notification_url="",
            )
        assert exc_info.value.status_code == 503


class TestSquareWebhookEndpointConfig:
    def test_payment_endpoint_prefers_explicit_config(self):
        from app.routers.webhooks import _resolve_square_signature_material

        settings = MagicMock(
            square_payment_webhook_signature_key="pay-key",
            square_payment_webhook_notification_url="https://example.com/payment",
            square_booking_webhook_signature_key="booking-key",
            square_booking_webhook_notification_url="https://example.com/booking",
            square_webhook_signature_key="legacy-key",
            square_webhook_notification_url="https://example.com/legacy",
        )

        signature_key, notification_url = _resolve_square_signature_material(
            settings, "payment"
        )

        assert signature_key == "pay-key"
        assert notification_url == "https://example.com/payment"

    def test_booking_endpoint_falls_back_to_legacy_config(self):
        from app.routers.webhooks import _resolve_square_signature_material

        settings = MagicMock(
            square_booking_webhook_signature_key="",
            square_booking_webhook_notification_url="",
            square_webhook_signature_key="legacy-key",
            square_webhook_notification_url="https://example.com/legacy",
        )

        signature_key, notification_url = _resolve_square_signature_material(
            settings, "booking"
        )

        assert signature_key == "legacy-key"
        assert notification_url == "https://example.com/legacy"

    def test_missing_signature_material_never_returns_false(self):
        from app.routers.webhooks import _should_verify_square_signature

        settings = MagicMock(
            square_webhook_verify_signature=True,
            square_payment_webhook_signature_key="",
            square_payment_webhook_notification_url="",
            square_webhook_signature_key="",
            square_webhook_notification_url="",
        )

        should_verify, signature_key, notification_url = (
            _should_verify_square_signature(
                settings,
                "payment",
            )
        )

        assert should_verify is True
        assert signature_key == ""
        assert notification_url == ""


class TestSquarePaymentTierExtraction:
    """Test extraction of subscription tier from Square payment events."""

    def test_extract_bot_shield_from_note(self):
        from app.routers.webhooks import _extract_square_payment_tier

        payment = {"note": "Bot-Shield Verification", "amount_money": {"amount": 100}}
        assert _extract_square_payment_tier(payment) == "bot_shield"

    def test_extract_bot_shield_from_amount(self):
        from app.routers.webhooks import _extract_square_payment_tier

        payment = {"note": "", "amount_money": {"amount": 100}}
        assert _extract_square_payment_tier(payment) == "bot_shield"

    def test_extract_founding_member_from_note(self):
        from app.routers.webhooks import _extract_square_payment_tier

        payment = {
            "note": "Founding Member subscription",
            "amount_money": {"amount": 1499},
        }
        assert _extract_square_payment_tier(payment) == "founding_member"

    def test_extract_founding_member_from_amount(self):
        from app.routers.webhooks import _extract_square_payment_tier

        payment = {"note": "", "amount_money": {"amount": 1499}}
        assert _extract_square_payment_tier(payment) == "founding_member"

    def test_extract_royalty_from_note(self):
        from app.routers.webhooks import _extract_square_payment_tier

        payment = {"note": "Royalty Card", "amount_money": {"amount": 250000}}
        assert _extract_square_payment_tier(payment) == "royalty"

    def test_catalog_drift_plan_fails_closed(self):
        from app.routers.webhooks import _extract_square_payment_tier

        payment = {
            "note": "Basic Monthly Subscription",
            "amount_money": {"amount": 999},
        }
        assert _extract_square_payment_tier(payment) is None

    def test_order_reference_can_supply_checkout_binding_hint(self):
        from app.routers.webhooks import _extract_square_payment_tier

        payment = {"note": "", "amount_money": {"amount": 100}}
        order = {
            "reference_id": "agref:v1.token",
            "line_items": [{"name": "Bot-Shield Verification"}],
        }
        assert _extract_square_payment_tier(payment, order_obj=order) == "bot_shield"

    def test_unknown_amount_returns_none(self):
        from app.routers.webhooks import _extract_square_payment_tier

        payment = {"note": "", "amount_money": {"amount": 999}}
        assert _extract_square_payment_tier(payment) is None


class TestSquareCustomerEmailExtraction:
    """Test extraction of customer email from Square payment events."""

    def test_extract_email_from_buyer_email_address(self):
        from app.routers.webhooks import _extract_square_customer_email

        payment = {"buyer_email_address": "Josh@Example.com"}
        assert _extract_square_customer_email(payment) == "josh@example.com"

    def test_no_email_returns_none(self):
        from app.routers.webhooks import _extract_square_customer_email

        payment = {"note": "Bot-Shield"}
        assert _extract_square_customer_email(payment) is None


class TestCheckoutReferenceExtraction:
    def test_extract_checkout_reference_from_note(self):
        from app.payment_truth import extract_checkout_reference

        note = "bot_shield agref:v1.payload.signature"
        assert extract_checkout_reference(note) == "v1.payload.signature"


class TestSquarePaymentEventFactory:
    """Test the mock event factory produces valid structures."""

    def test_payment_event_structure(self):
        event = make_square_payment_event(
            amount_cents=100,
            buyer_email="test@example.com",
            note="Bot-Shield Verification",
        )
        assert "event_id" in event
        assert event["type"] == "payment.updated"
        payment = event["data"]["object"]["payment"]
        assert payment["amount_money"]["amount"] == 100
        assert payment["buyer_email_address"] == "test@example.com"
        assert payment["status"] == "COMPLETED"

    def test_booking_event_structure(self):
        event = make_square_booking_event(
            customer_email="pickup@example.com",
            booking_status="ACCEPTED",
        )
        assert "event_id" in event
        assert event["type"] == "booking.created"
        booking = event["data"]["object"]["booking"]
        assert booking["status"] == "ACCEPTED"
        assert booking["customer_details"]["email_address"] == "pickup@example.com"


def test_completed_founding_member_payment_activates_subscription(
    client, db_session_factory
):
    async def seed_user() -> None:
        async with db_session_factory() as session:
            session.add(
                User(
                    id=uuid.uuid4(),
                    email="founder@example.com",
                    password_hash="hashed",
                    display_name="Founder",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            await session.commit()

    import asyncio

    asyncio.run(seed_user())

    payload = make_square_payment_event(
        event_id="evt_founding_member_1",
        amount_cents=1499,
        buyer_email="founder@example.com",
        note="Founding Member subscription",
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

    async def fetch_user() -> User | None:
        async with db_session_factory() as session:
            return await session.scalar(
                select(User).where(User.email == "founder@example.com")
            )

    user = asyncio.run(fetch_user())
    assert user is not None
    assert user.subscription_active is True
    assert user.subscription_tier == "founding_member"


def test_completed_royalty_payment_activates_subscription(client, db_session_factory):
    import asyncio

    from app.subscriptions import user_has_active_subscription

    async def seed_user() -> None:
        async with db_session_factory() as session:
            session.add(
                User(
                    id=uuid.uuid4(),
                    email="royalty-buyer@example.com",
                    password_hash="hashed",
                    display_name="Royalty Buyer",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            await session.commit()

    asyncio.run(seed_user())

    payload = make_square_payment_event(
        event_id="evt_royalty_card_1",
        amount_cents=250000,
        buyer_email="royalty-buyer@example.com",
        note="Royalty Card",
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

    async def fetch_user() -> User | None:
        async with db_session_factory() as session:
            return await session.scalar(
                select(User).where(User.email == "royalty-buyer@example.com")
            )

    user = asyncio.run(fetch_user())
    assert user is not None
    assert user.subscription_tier == "royalty"
    assert user.subscription_active is True
    assert user.subscription_expires_at is None
    assert user_has_active_subscription(user) is True


def test_completed_bot_shield_payment_requires_checkout_binding(
    client,
    db_session_factory,
):
    async def seed_user_and_liveness() -> uuid.UUID:
        user_id = uuid.uuid4()
        async with db_session_factory() as session:
            session.add(
                User(
                    id=user_id,
                    email="bound-check@example.com",
                    password_hash="hashed",
                    display_name="Bound Check",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            session.add(
                VerificationEvent(
                    user_id=user_id,
                    challenge_type="liveness",
                    status="passed",
                    amount_cents=100,
                )
            )
            await session.commit()
        return user_id

    import asyncio

    user_id = asyncio.run(seed_user_and_liveness())

    payload = make_square_payment_event(
        event_id="evt_missing_checkout_binding",
        amount_cents=100,
        buyer_email="bound-check@example.com",
        note="Bot-Shield Verification",
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

    async def fetch_state() -> (
        tuple[User | None, list[VerificationEvent], list[RevenueAllocation]]
    ):
        async with db_session_factory() as session:
            user = await session.scalar(select(User).where(User.id == user_id))
            events = list(
                (
                    await session.scalars(
                        select(VerificationEvent).where(
                            VerificationEvent.user_id == user_id
                        )
                    )
                ).all()
            )
            allocations = list((await session.scalars(select(RevenueAllocation))).all())
            return user, events, allocations

    user, events, allocations = asyncio.run(fetch_state())
    assert user is not None
    assert user.bot_shield_verified is False
    assert not any(event.challenge_type == "payment" for event in events)
    assert len(allocations) == 1
    assert allocations[0].user_id == user_id
    assert allocations[0].payment_tier == "bot_shield"
    assert allocations[0].gross_amount_cents == 100
    assert allocations[0].reserve_amount_cents == 0
    assert allocations[0].status == "reserved"


def test_non_completed_payment_status_is_not_authoritative_for_bot_shield_completion(
    client,
    db_session_factory,
):
    async def seed_user_and_liveness() -> tuple[uuid.UUID, uuid.UUID]:
        user_id = uuid.uuid4()
        event_id = uuid.uuid4()
        async with db_session_factory() as session:
            session.add(
                User(
                    id=user_id,
                    email="non-authoritative@example.com",
                    password_hash="hashed",
                    display_name="Non Authoritative",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            session.add(
                VerificationEvent(
                    id=event_id,
                    user_id=user_id,
                    challenge_type="liveness",
                    status="passed",
                    amount_cents=100,
                )
            )
            await session.commit()
        return user_id, event_id

    import asyncio

    user_id, event_id = asyncio.run(seed_user_and_liveness())
    checkout_ref = build_checkout_reference(
        user_id=user_id,
        event_id=event_id,
        tier="bot_shield",
        secret="test-secret-that-is-at-least-32-characters-long-for-security",
    )

    payload = make_square_payment_event(
        event_id="evt_payment_updated_not_completed",
        event_type="payment.updated",
        amount_cents=100,
        buyer_email="non-authoritative@example.com",
        note=f"Bot-Shield Verification agref:{checkout_ref}",
        payment_status="APPROVED",
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

    async def fetch_state() -> (
        tuple[User | None, list[VerificationEvent], list[RevenueAllocation]]
    ):
        async with db_session_factory() as session:
            user = await session.scalar(select(User).where(User.id == user_id))
            events = list(
                (
                    await session.scalars(
                        select(VerificationEvent).where(
                            VerificationEvent.user_id == user_id
                        )
                    )
                ).all()
            )
            allocations = list((await session.scalars(select(RevenueAllocation))).all())
            return user, events, allocations

    user, events, allocations = asyncio.run(fetch_state())
    assert user is not None
    assert user.bot_shield_verified is False
    assert not any(event.challenge_type == "payment" for event in events)
    assert allocations == []


def test_completed_bot_shield_payment_with_valid_binding_promotes_user(
    client,
    db_session_factory,
):
    async def seed_user_and_liveness() -> tuple[uuid.UUID, uuid.UUID]:
        user_id = uuid.uuid4()
        event_id = uuid.uuid4()
        async with db_session_factory() as session:
            session.add(
                User(
                    id=user_id,
                    email="verified@example.com",
                    password_hash="hashed",
                    display_name="Verified User",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            session.add(
                VerificationEvent(
                    id=event_id,
                    user_id=user_id,
                    challenge_type="liveness",
                    status="passed",
                    amount_cents=100,
                )
            )
            await session.commit()
        return user_id, event_id

    import asyncio

    user_id, event_id = asyncio.run(seed_user_and_liveness())
    checkout_ref = build_checkout_reference(
        user_id=user_id,
        event_id=event_id,
        tier="bot_shield",
        secret="test-secret-that-is-at-least-32-characters-long-for-security",
    )

    payload = make_square_payment_event(
        event_id="evt_payment_completed_bound",
        amount_cents=100,
        buyer_email="verified@example.com",
        note=f"Bot-Shield Verification agref:{checkout_ref}",
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

    async def fetch_state() -> (
        tuple[User | None, list[VerificationEvent], list[RevenueAllocation]]
    ):
        async with db_session_factory() as session:
            user = await session.scalar(select(User).where(User.id == user_id))
            events = list(
                (
                    await session.scalars(
                        select(VerificationEvent).where(
                            VerificationEvent.user_id == user_id
                        )
                    )
                ).all()
            )
            allocations = list((await session.scalars(select(RevenueAllocation))).all())
            return user, events, allocations

    user, events, allocations = asyncio.run(fetch_state())
    assert user is not None
    assert user.bot_shield_verified is True
    assert any(
        event.challenge_type == "payment"
        and event.status == "completed"
        and event.challenge_token == checkout_ref
        for event in events
    )
    assert len(allocations) == 1
    assert allocations[0].user_id == user_id
    assert allocations[0].payment_tier == "bot_shield"
    assert allocations[0].gross_amount_cents == 100
    assert allocations[0].reserve_amount_cents == 0
    assert allocations[0].operating_amount_cents == 100
    assert allocations[0].accounting_lane == "platform_operations"
    assert allocations[0].status == "reserved"


def test_completed_bot_shield_payment_when_liveness_is_pending_records_payment_and_promotes_on_liveness_pass(
    client,
    db_session_factory,
):
    """When payment arrives while liveness is still pending, the payment event

    must be recorded, the user must remain unverified until liveness passes,
    and then promote successfully once liveness is passed.
    """

    async def seed_user_and_pending_liveness() -> tuple[uuid.UUID, uuid.UUID]:
        user_id = uuid.uuid4()
        event_id = uuid.uuid4()
        async with db_session_factory() as session:
            session.add(
                User(
                    id=user_id,
                    email="order-independent@example.com",
                    password_hash="hashed",
                    display_name="Order Independent",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            session.add(
                VerificationEvent(
                    id=event_id,
                    user_id=user_id,
                    challenge_type="liveness",
                    status="pending",
                    amount_cents=100,
                )
            )
            await session.commit()
        return user_id, event_id

    import asyncio

    from app.verification_service import promote_user_verification_if_ready

    user_id, event_id = asyncio.run(seed_user_and_pending_liveness())
    checkout_ref = build_checkout_reference(
        user_id=user_id,
        event_id=event_id,
        tier="bot_shield",
        secret="test-secret-that-is-at-least-32-characters-long-for-security",
    )

    payload = make_square_payment_event(
        event_id="evt_payment_before_liveness",
        amount_cents=100,
        buyer_email="order-independent@example.com",
        note=f"Bot-Shield Verification agref:{checkout_ref}",
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

    # Stage 1 check: Payment is recorded, but user is NOT verified yet (Iron Wall intact)
    async def fetch_stage1_state() -> tuple[User | None, list[VerificationEvent]]:
        async with db_session_factory() as session:
            user = await session.scalar(select(User).where(User.id == user_id))
            events = list(
                (
                    await session.scalars(
                        select(VerificationEvent).where(
                            VerificationEvent.user_id == user_id
                        )
                    )
                ).all()
            )
            return user, events

    user, events = asyncio.run(fetch_stage1_state())
    assert user is not None
    assert user.bot_shield_verified is False  # NOT verified yet!
    assert any(
        event.challenge_type == "payment"
        and event.status == "completed"
        and event.challenge_token == checkout_ref
        for event in events
    )

    # Stage 2 check: Liveness passes, promotion succeeds!
    async def pass_liveness_and_promote() -> tuple[User | None, bool]:
        async with db_session_factory() as session:
            liveness_event = await session.get(VerificationEvent, event_id)
            assert liveness_event is not None
            liveness_event.status = "passed"
            user = await session.get(User, user_id)
            assert user is not None
            promoted = await promote_user_verification_if_ready(session, user)
            await session.commit()
            return user, promoted

    user, promoted = asyncio.run(pass_liveness_and_promote())
    assert promoted is True
    assert user is not None
    assert user.bot_shield_verified is True


def test_payment_webhook_returns_503_and_changes_no_tier_when_config_unset(
    client,
    db_session_factory,
    monkeypatch,
):
    import asyncio

    from app.config import get_settings

    monkeypatch.setenv("SQUARE_WEBHOOK_VERIFY_SIGNATURE", "true")
    monkeypatch.setenv("SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY", "")
    monkeypatch.setenv("SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL", "")
    monkeypatch.setenv("SQUARE_WEBHOOK_SIGNATURE_KEY", "")
    monkeypatch.setenv("SQUARE_WEBHOOK_NOTIFICATION_URL", "")
    get_settings.cache_clear()

    user_id = uuid.uuid4()

    async def seed_user() -> None:
        async with db_session_factory() as session:
            session.add(
                User(
                    id=user_id,
                    email="nosig@example.com",
                    password_hash="hashed",
                    display_name="No Sig",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            await session.commit()

    asyncio.run(seed_user())

    payload = make_square_payment_event(
        event_id="evt_missing_sig_material",
        amount_cents=1499,
        buyer_email="nosig@example.com",
        note="Founding Member subscription",
        payment_status="COMPLETED",
    )

    response = client.post(
        "/api/v1/webhooks/square-payment",
        headers={"Content-Type": "application/json"},
        content=json.dumps(payload, separators=(",", ":")),
    )

    assert response.status_code == 503, response.text
    assert response.json().get("detail") == "webhook verification not configured"

    async def fetch_user() -> User | None:
        async with db_session_factory() as session:
            return await session.get(User, user_id)

    user = asyncio.run(fetch_user())
    assert user is not None
    assert user.subscription_tier is None
    assert user.subscription_active is False
    assert user.bot_shield_verified is False

    get_settings.cache_clear()


def test_payment_webhook_rejects_wrong_signature_and_accepts_correct_signature(
    client,
    db_session_factory,
    monkeypatch,
):
    import asyncio

    from app.config import get_settings

    dummy_key = "dummy-test-webhook-sig-key"
    dummy_url = "http://testserver/api/v1/webhooks/square-payment"
    monkeypatch.setenv("SQUARE_WEBHOOK_VERIFY_SIGNATURE", "true")
    monkeypatch.setenv("SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY", dummy_key)
    monkeypatch.setenv("SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL", dummy_url)
    get_settings.cache_clear()

    user_id = uuid.uuid4()

    async def seed_user() -> None:
        async with db_session_factory() as session:
            session.add(
                User(
                    id=user_id,
                    email="sigcheck@example.com",
                    password_hash="hashed",
                    display_name="Sig Check",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            await session.commit()

    asyncio.run(seed_user())

    payload = make_square_payment_event(
        event_id="evt_sigcheck_flow_1",
        amount_cents=1499,
        buyer_email="sigcheck@example.com",
        note="Founding Member subscription",
        payment_status="COMPLETED",
    )
    raw_body = json.dumps(payload, separators=(",", ":")).encode("utf-8")

    bad_resp = client.post(
        "/api/v1/webhooks/square-payment",
        headers={
            "Content-Type": "application/json",
            "x-square-hmacsha256-signature": "wrong-signature",
        },
        content=raw_body,
    )
    assert bad_resp.status_code == 400

    async def fetch_user() -> User | None:
        async with db_session_factory() as session:
            return await session.get(User, user_id)

    user_after_bad = asyncio.run(fetch_user())
    assert user_after_bad is not None
    assert user_after_bad.subscription_tier is None
    assert user_after_bad.subscription_active is False

    valid_sig = generate_square_signature(raw_body, dummy_key, dummy_url)
    good_resp = client.post(
        "/api/v1/webhooks/square-payment",
        headers={
            "Content-Type": "application/json",
            "x-square-hmacsha256-signature": valid_sig,
        },
        content=raw_body,
    )
    assert good_resp.status_code == 200, good_resp.text

    user_after_good = asyncio.run(fetch_user())
    assert user_after_good is not None
    assert user_after_good.subscription_tier == "founding_member"
    assert user_after_good.subscription_active is True

    get_settings.cache_clear()


def _make_signed_refund_webhook_request(
    *,
    event_id: str,
    payment_id: str,
    event_type: str = "refund.updated",
    refund_status: str = "COMPLETED",
    amount_cents: int = 100,
) -> tuple[str, str]:
    payload = {
        "event_id": event_id,
        "type": event_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data": {
            "object": {
                "refund": {
                    "id": f"rfnd_{uuid.uuid4().hex[:16]}",
                    "status": refund_status,
                    "payment_id": payment_id,
                    "amount_money": {"amount": amount_cents, "currency": "USD"},
                }
            }
        },
    }
    raw_body = json.dumps(payload, separators=(",", ":"))
    signature = generate_square_signature(
        raw_body.encode("utf-8"),
        "test-square-signature",
        "http://testserver/api/v1/webhooks/square-payment",
    )
    return raw_body, signature


def _seed_verified_bot_shield_member(
    db_session_factory,
    *,
    email: str,
    payment_id: str,
    membership_payment_id: str | None = None,
) -> tuple[uuid.UUID, uuid.UUID, uuid.UUID | None]:
    import asyncio

    user_id = uuid.uuid4()
    payment_event_id = uuid.uuid4()
    membership_event_id = uuid.uuid4() if membership_payment_id else None

    async def _seed() -> None:
        async with db_session_factory() as session:
            session.add(
                User(
                    id=user_id,
                    email=email,
                    password_hash="hashed",
                    display_name="Verified Member",
                    bot_shield_verified=True,
                    subscription_active=bool(membership_payment_id),
                    subscription_tier=(
                        "founding_member" if membership_payment_id else None
                    ),
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            session.add(
                Profile(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    bio="Checked profile",
                    verified=True,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            session.add(
                VerificationEvent(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    challenge_type="liveness",
                    status="passed",
                    amount_cents=100,
                )
            )
            session.add(
                VerificationEvent(
                    id=payment_event_id,
                    user_id=user_id,
                    challenge_type="payment",
                    status="completed",
                    amount_cents=100,
                    square_payment_id=payment_id,
                )
            )
            session.add(
                RevenueAllocation(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    source_event_id=f"evt_seed_{payment_id}",
                    square_payment_id=payment_id,
                    payment_tier="bot_shield",
                    gross_amount_cents=100,
                    reserve_amount_cents=0,
                    operating_amount_cents=100,
                    status="reserved",
                )
            )
            if membership_payment_id and membership_event_id:
                session.add(
                    VerificationEvent(
                        id=membership_event_id,
                        user_id=user_id,
                        challenge_type="payment",
                        status="completed",
                        amount_cents=1499,
                        square_payment_id=membership_payment_id,
                    )
                )
                session.add(
                    RevenueAllocation(
                        id=uuid.uuid4(),
                        user_id=user_id,
                        source_event_id=f"evt_seed_{membership_payment_id}",
                        square_payment_id=membership_payment_id,
                        payment_tier="founding_member",
                        gross_amount_cents=1499,
                        reserve_amount_cents=0,
                        operating_amount_cents=1499,
                        status="reserved",
                    )
                )
            await session.commit()

    asyncio.run(_seed())
    return user_id, payment_event_id, membership_event_id


def test_bot_shield_refund_webhook_revokes_badge_and_payment_event(
    client,
    db_session_factory,
):
    import asyncio

    user_id, payment_event_id, _ = _seed_verified_bot_shield_member(
        db_session_factory,
        email="refund-bot-shield@example.com",
        payment_id="pay_bot_shield_refund_1",
    )

    raw_body, signature = _make_signed_refund_webhook_request(
        event_id="evt_refund_bot_shield_1",
        payment_id="pay_bot_shield_refund_1",
    )
    response = client.post(
        "/api/v1/webhooks/square-payment",
        headers={
            "x-square-hmacsha256-signature": signature,
            "Content-Type": "application/json",
        },
        content=raw_body,
    )
    assert response.status_code == 200, response.text

    async def _fetch_state():
        async with db_session_factory() as session:
            user = await session.get(User, user_id)
            profile = await session.scalar(
                select(Profile).where(Profile.user_id == user_id)
            )
            payment_event = await session.get(VerificationEvent, payment_event_id)
            paid = await has_completed_payment(session, user_id)
            return user, profile, payment_event, paid

    user, profile, payment_event, paid = asyncio.run(_fetch_state())
    assert payment_event is not None
    assert payment_event.status == "refunded"
    assert user is not None
    assert user.bot_shield_verified is False
    assert profile is not None
    assert profile.verified is False
    assert paid is False


def test_bot_shield_payment_updated_refund_branch_revokes_badge(
    client,
    db_session_factory,
):
    import asyncio

    user_id, payment_event_id, _ = _seed_verified_bot_shield_member(
        db_session_factory,
        email="refund-payment-branch@example.com",
        payment_id="pay_bot_shield_refund_branch_1",
    )

    payload = make_square_payment_event(
        event_id="evt_payment_updated_refunded_1",
        event_type="payment.updated",
        amount_cents=100,
        buyer_email="refund-payment-branch@example.com",
        note="Bot-Shield Verification",
        payment_status="REFUNDED",
    )
    payload["data"]["object"]["payment"]["id"] = "pay_bot_shield_refund_branch_1"
    payload["data"]["object"]["payment"]["refunded_money"] = {
        "amount": 100,
        "currency": "USD",
    }
    raw_body = json.dumps(payload, separators=(",", ":"))
    signature = generate_square_signature(
        raw_body.encode("utf-8"),
        "test-square-signature",
        "http://testserver/api/v1/webhooks/square-payment",
    )

    response = client.post(
        "/api/v1/webhooks/square-payment",
        headers={
            "x-square-hmacsha256-signature": signature,
            "Content-Type": "application/json",
        },
        content=raw_body,
    )
    assert response.status_code == 200, response.text

    async def _fetch_state():
        async with db_session_factory() as session:
            user = await session.get(User, user_id)
            profile = await session.scalar(
                select(Profile).where(Profile.user_id == user_id)
            )
            payment_event = await session.get(VerificationEvent, payment_event_id)
            paid = await has_completed_payment(session, user_id)
            return user, profile, payment_event, paid

    user, profile, payment_event, paid = asyncio.run(_fetch_state())
    assert payment_event is not None
    assert payment_event.status == "refunded"
    assert user is not None
    assert user.bot_shield_verified is False
    assert profile is not None
    assert profile.verified is False
    assert paid is False


def test_refund_for_unknown_payment_changes_nothing(
    client,
    db_session_factory,
):
    import asyncio

    user_id, payment_event_id, _ = _seed_verified_bot_shield_member(
        db_session_factory,
        email="unknown-refund@example.com",
        payment_id="pay_known_bot_shield_1",
    )

    raw_body, signature = _make_signed_refund_webhook_request(
        event_id="evt_refund_unknown_payment_1",
        payment_id="pay_unknown_does_not_exist",
    )
    response = client.post(
        "/api/v1/webhooks/square-payment",
        headers={
            "x-square-hmacsha256-signature": signature,
            "Content-Type": "application/json",
        },
        content=raw_body,
    )
    assert response.status_code == 200, response.text

    async def _fetch_state():
        async with db_session_factory() as session:
            user = await session.get(User, user_id)
            profile = await session.scalar(
                select(Profile).where(Profile.user_id == user_id)
            )
            payment_event = await session.get(VerificationEvent, payment_event_id)
            paid = await has_completed_payment(session, user_id)
            return user, profile, payment_event, paid

    user, profile, payment_event, paid = asyncio.run(_fetch_state())
    assert payment_event is not None
    assert payment_event.status == "completed"
    assert user is not None
    assert user.bot_shield_verified is True
    assert profile is not None
    assert profile.verified is True
    assert paid is True


def test_same_refund_event_sent_twice_changes_nothing_more(
    client,
    db_session_factory,
):
    import asyncio

    user_id, payment_event_id, _ = _seed_verified_bot_shield_member(
        db_session_factory,
        email="duplicate-refund@example.com",
        payment_id="pay_bot_shield_dup_refund_1",
    )

    raw_body, signature = _make_signed_refund_webhook_request(
        event_id="evt_refund_duplicate_1",
        payment_id="pay_bot_shield_dup_refund_1",
    )
    headers = {
        "x-square-hmacsha256-signature": signature,
        "Content-Type": "application/json",
    }

    first_resp = client.post(
        "/api/v1/webhooks/square-payment",
        headers=headers,
        content=raw_body,
    )
    assert first_resp.status_code == 200, first_resp.text
    assert first_resp.json()["duplicate"] is False

    second_resp = client.post(
        "/api/v1/webhooks/square-payment",
        headers=headers,
        content=raw_body,
    )
    assert second_resp.status_code == 200, second_resp.text
    assert second_resp.json()["duplicate"] is True

    async def _fetch_state():
        async with db_session_factory() as session:
            user = await session.get(User, user_id)
            profile = await session.scalar(
                select(Profile).where(Profile.user_id == user_id)
            )
            payment_event = await session.get(VerificationEvent, payment_event_id)
            all_events = list(
                (
                    await session.scalars(
                        select(VerificationEvent).where(
                            VerificationEvent.user_id == user_id
                        )
                    )
                ).all()
            )
            paid = await has_completed_payment(session, user_id)
            return user, profile, payment_event, all_events, paid

    user, profile, payment_event, all_events, paid = asyncio.run(_fetch_state())
    assert payment_event is not None
    assert payment_event.status == "refunded"
    assert user is not None
    assert user.bot_shield_verified is False
    assert profile is not None
    assert profile.verified is False
    assert paid is False
    assert len(all_events) == 2


def test_refund_of_membership_payment_leaves_badge_alone(
    client,
    db_session_factory,
):
    import asyncio

    user_id, bot_payment_event_id, membership_event_id = (
        _seed_verified_bot_shield_member(
            db_session_factory,
            email="membership-refund@example.com",
            payment_id="pay_bot_shield_keep_1",
            membership_payment_id="pay_founding_member_refund_1",
        )
    )

    raw_body, signature = _make_signed_refund_webhook_request(
        event_id="evt_refund_membership_1",
        payment_id="pay_founding_member_refund_1",
        amount_cents=1499,
    )
    response = client.post(
        "/api/v1/webhooks/square-payment",
        headers={
            "x-square-hmacsha256-signature": signature,
            "Content-Type": "application/json",
        },
        content=raw_body,
    )
    assert response.status_code == 200, response.text

    async def _fetch_state():
        async with db_session_factory() as session:
            user = await session.get(User, user_id)
            profile = await session.scalar(
                select(Profile).where(Profile.user_id == user_id)
            )
            bot_event = await session.get(VerificationEvent, bot_payment_event_id)
            membership_event = (
                await session.get(VerificationEvent, membership_event_id)
                if membership_event_id
                else None
            )
            paid = await has_completed_payment(session, user_id)
            return user, profile, bot_event, membership_event, paid

    user, profile, bot_event, membership_event, paid = asyncio.run(_fetch_state())
    assert bot_event is not None
    assert bot_event.status == "completed"
    assert membership_event is not None
    assert membership_event.status == "completed"
    assert user is not None
    assert user.bot_shield_verified is True
    assert profile is not None
    assert profile.verified is True
    assert paid is True


class TestNoStripeReferences:
    """Ensure Stripe has been fully removed from the codebase."""

    def test_webhooks_no_active_stripe(self):
        """webhooks.py must not contain active Stripe code."""
        import inspect

        from app.routers import webhooks

        source = inspect.getsource(webhooks)
        lines = source.split("\n")
        active_stripe = [
            line.strip()
            for line in lines
            if "stripe" in line.lower()
            and not line.strip().startswith("#")
            and not line.strip().startswith("//")
            and not line.strip().startswith('"""')
            and "DEPRECATED" not in line
            and "REMOVED" not in line
            and "Iron Wall" not in line
            and "migration" not in line.lower()
            and "retired" not in line.lower()
            and '"/stripe"' not in line
        ]
        assert (
            len(active_stripe) == 0
        ), f"Active Stripe references found in webhooks.py: {active_stripe}"

    def test_config_no_active_stripe(self):
        """config.py must not have active Stripe settings."""
        import inspect

        from app import config

        source = inspect.getsource(config)
        lines = source.split("\n")
        active_stripe = [
            line.strip()
            for line in lines
            if "stripe" in line.lower()
            and not line.strip().startswith("#")
            and not line.strip().startswith("//")
            and "DEPRECATED" not in line
            and "REMOVED" not in line
        ]
        assert (
            len(active_stripe) == 0
        ), f"Active Stripe references found in config.py: {active_stripe}"
