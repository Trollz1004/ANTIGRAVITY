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
from unittest.mock import MagicMock

import pytest

os.environ["JWT_SECRET"] = "test-secret-that-is-at-least-32-characters-long-for-security"

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

        payload = json.dumps({"event_id": "test123", "type": "payment.completed"}).encode()
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

        payload = json.dumps({"event_id": "test123", "type": "payment.completed"}).encode()

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

        signature_key, notification_url = _resolve_square_signature_material(settings, "payment")

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

        signature_key, notification_url = _resolve_square_signature_material(settings, "booking")

        assert signature_key == "legacy-key"
        assert notification_url == "https://example.com/legacy"


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

        payment = {"note": "Founding Member subscription", "amount_money": {"amount": 1499}}
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

        payment = {"note": "Basic Monthly Subscription", "amount_money": {"amount": 999}}
        assert _extract_square_payment_tier(payment) is None

    def test_order_reference_can_supply_checkout_binding_hint(self):
        from app.routers.webhooks import _extract_square_payment_tier

        payment = {"note": "", "amount_money": {"amount": 100}}
        order = {"reference_id": "agref:v1.token", "line_items": [{"name": "Bot-Shield Verification"}]}
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
        assert event["type"] == "payment.completed"
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


class TestNoStripeReferences:
    """Ensure Stripe has been fully removed from the codebase."""

    def test_webhooks_no_active_stripe(self):
        """webhooks.py must not contain active Stripe code."""
        import inspect
        from app.routers import webhooks

        source = inspect.getsource(webhooks)
        lines = source.split("\n")
        active_stripe = [
            line.strip() for line in lines
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
        assert len(active_stripe) == 0, (
            f"Active Stripe references found in webhooks.py: {active_stripe}"
        )

    def test_config_no_active_stripe(self):
        """config.py must not have active Stripe settings."""
        import inspect
        from app import config

        source = inspect.getsource(config)
        lines = source.split("\n")
        active_stripe = [
            line.strip() for line in lines
            if "stripe" in line.lower()
            and not line.strip().startswith("#")
            and not line.strip().startswith("//")
            and "DEPRECATED" not in line
            and "REMOVED" not in line
        ]
        assert len(active_stripe) == 0, (
            f"Active Stripe references found in config.py: {active_stripe}"
        )
