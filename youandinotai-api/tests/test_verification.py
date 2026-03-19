"""Verification flow tests for YouAndINotAI backend.

Tests cover:
  - /verify/confirm requires actual payment (Fix #3 — no free verifications)
  - Trust score calculation
  - Liveness challenge flow
  - Square payment link generation
"""

import os
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.dialects import postgresql

os.environ["JWT_SECRET"] = "test-secret-that-is-at-least-32-characters-long-for-security"


class TestVerifyConfirmPaymentEnforcement:
    """Fix #3: /verify/confirm must check actual payment before marking verified.

    The old code only checked for a passed liveness challenge.
    The new code requires BOTH a passed liveness challenge AND a completed payment event.
    No free verifications. Ever. Iron Wall enforcement.
    """

    def test_confirm_without_payment_event_is_rejected(self):
        """A user who passed liveness but never paid must NOT be verified."""
        # This test validates the core security fix:
        # The /verify/confirm endpoint now queries for a VerificationEvent
        # with challenge_type='payment' AND status='completed' for the user.
        # If no such event exists, verification is denied.
        from app.routers.verify import _has_completed_payment

        # Mock a database session that returns no payment events
        mock_db = AsyncMock()
        mock_db.scalar = AsyncMock(return_value=None)

        user_id = uuid.uuid4()

        import asyncio
        result = asyncio.run(_has_completed_payment(mock_db, user_id))
        assert result is False

    def test_confirm_with_payment_event_is_accepted(self):
        """A user who passed liveness AND paid must be verified."""
        from app.routers.verify import _has_completed_payment

        # Mock a database session that returns a completed payment event
        mock_payment_event = MagicMock()
        mock_payment_event.status = "completed"
        mock_payment_event.challenge_type = "payment"

        mock_db = AsyncMock()
        mock_db.scalar = AsyncMock(return_value=mock_payment_event)

        user_id = uuid.uuid4()

        import asyncio
        result = asyncio.run(_has_completed_payment(mock_db, user_id))
        assert result is True


class TestSquarePaymentLinkGeneration:
    """Test the live Bot-Shield checkout request and binding helpers."""

    def test_checkout_reference_round_trip(self):
        from app.payment_truth import build_checkout_reference, parse_checkout_reference

        user_id = uuid.uuid4()
        event_id = uuid.uuid4()
        secret = "test-secret-that-is-at-least-32-characters-long-for-security"

        token = build_checkout_reference(
            user_id=user_id,
            event_id=event_id,
            tier="bot_shield",
            secret=secret,
        )
        parsed = parse_checkout_reference(token, secret=secret)

        assert parsed is not None
        assert parsed["user_id"] == user_id
        assert parsed["event_id"] == event_id
        assert parsed["tier"] == "bot_shield"

    def test_bot_shield_checkout_request_includes_binding_and_return_url(self):
        from app.payment_truth import (
            BOT_SHIELD_CENTS,
            build_bot_shield_checkout_request,
        )

        checkout_ref = "v1.checkout.ref"
        request_body = build_bot_shield_checkout_request(
            app_url="https://youandinotai.com",
            location_id="LY5GN09F5AN83",
            buyer_email="josh@example.com",
            checkout_ref=checkout_ref,
        )

        assert request_body["order"]["reference_id"] == f"agref:{checkout_ref}"
        assert request_body["payment_note"].endswith(f"agref:{checkout_ref}")
        assert request_body["order"]["line_items"][0]["base_price_money"]["amount"] == BOT_SHIELD_CENTS
        assert request_body["pre_populated_data"]["buyer_email"] == "josh@example.com"
        assert request_body["checkout_options"]["redirect_url"].startswith(
            "https://youandinotai.com/app/verify?status=success"
        )

    def test_build_square_checkout_url_returns_payment_link(self):
        from app.routers.verify import _build_square_checkout_url

        user = MagicMock()
        user.id = uuid.uuid4()
        user.email = "josh@example.com"

        event = MagicMock()
        event.id = uuid.uuid4()

        settings = MagicMock(
            jwt_secret="test-secret-that-is-at-least-32-characters-long-for-security",
            square_access_token="sq0atp-test",
            square_location_id="LY5GN09F5AN83",
            square_api_base_url="https://connect.squareup.com",
            square_api_version="2026-01-22",
            app_url="https://youandinotai.com",
        )

        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "payment_link": {"url": "https://square.link/u/mock-bot-shield"}
        }

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        class MockAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return mock_client

            async def __aexit__(self, exc_type, exc, tb):
                return False

        import asyncio
        from unittest.mock import patch

        with patch("app.routers.verify.httpx.AsyncClient", MockAsyncClient):
            checkout_url = asyncio.run(
                _build_square_checkout_url(user=user, event=event, settings=settings)
            )

        assert checkout_url == "https://square.link/u/mock-bot-shield"

    def test_no_stripe_references_in_verify(self):
        """verify.py must not contain any Stripe imports or references."""
        import inspect
        from app.routers import verify

        source = inspect.getsource(verify)
        # The word "stripe" should only appear in comments (DEPRECATED markers)
        # or not at all in active code
        lines = source.split("\n")
        active_stripe_refs = [
            line for line in lines
            if "stripe" in line.lower()
            and not line.strip().startswith("#")
            and not line.strip().startswith("//")
            and "DEPRECATED" not in line
            and "REMOVED" not in line
        ]
        assert len(active_stripe_refs) == 0, (
            f"Found active Stripe references in verify.py: {active_stripe_refs}"
        )


class TestVerificationPromotion:
    """Verification must only promote when liveness and payment both exist."""

    def test_user_verification_lock_statement_uses_for_update(self):
        from app.verification_service import build_user_verification_lock_stmt

        user_id = uuid.uuid4()
        stmt = build_user_verification_lock_stmt(user_id)
        compiled = str(
            stmt.compile(
                dialect=postgresql.dialect(),
                compile_kwargs={"literal_binds": True},
            )
        )

        assert "FOR UPDATE" in compiled

    def test_promote_user_requires_liveness_and_payment(self):
        import asyncio

        from app.verification_service import promote_user_verification_if_ready

        user = MagicMock()
        user.id = uuid.uuid4()
        user.bot_shield_verified = False
        user.profile = MagicMock()
        user.profile.verified = False

        mock_db = AsyncMock()
        mock_db.scalar = AsyncMock(side_effect=[None, MagicMock()])

        promoted = asyncio.run(promote_user_verification_if_ready(mock_db, user))

        assert promoted is False
        assert user.bot_shield_verified is False
        assert user.profile.verified is False

    def test_promote_user_succeeds_when_both_checks_exist(self):
        import asyncio

        from app.verification_service import promote_user_verification_if_ready

        user = MagicMock()
        user.id = uuid.uuid4()
        user.bot_shield_verified = False
        user.profile = MagicMock()
        user.profile.verified = False

        mock_db = AsyncMock()
        mock_db.scalar = AsyncMock(side_effect=[MagicMock(), MagicMock()])

        promoted = asyncio.run(promote_user_verification_if_ready(mock_db, user))

        assert promoted is True
        assert user.bot_shield_verified is True
        assert user.profile.verified is True


class TestVerificationStatusTruth:
    def test_status_reports_actual_payment_state_not_badge_flag(self, monkeypatch):
        import asyncio

        from app.routers import verify

        user = MagicMock()
        user.id = uuid.uuid4()
        user.bot_shield_verified = False
        user.subscription_active = False

        mock_db = AsyncMock()
        mock_db.scalar = AsyncMock(return_value=2)

        monkeypatch.setattr(verify, "_calculate_trust_score", AsyncMock(return_value=60.0))
        monkeypatch.setattr(verify, "has_completed_payment", AsyncMock(return_value=True))

        response = asyncio.run(verify.verification_status(user=user, db=mock_db))

        assert response.verified is False
        assert response.bot_shield_paid is True
        assert response.tier == "unverified"
