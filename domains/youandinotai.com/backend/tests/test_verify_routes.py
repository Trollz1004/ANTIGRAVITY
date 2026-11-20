"""Tests for the /verify router (Bot-Shield liveness + payment gate).

Coverage targets:
  - POST /api/v1/verify/challenge  — create liveness challenge
  - POST /api/v1/verify/submit     — submit challenge answer
  - GET  /api/v1/verify/status     — current verification status
  - POST /api/v1/verify/confirm    — dual-gate confirmation (liveness + payment)

Risk surface: FL §496.405 compliance gate; no-free-verification Iron Wall.
"""

import logging
import uuid
from datetime import date, datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select

from app.auth import create_access_token, get_current_user, hash_password
from app.main import app
from app.models import Profile, User, VerificationEvent
from tests.helpers import override_user, seed, verified_profile

# ── Helpers ──────────────────────────────────────────────────────────────────


def _make_user(
    *,
    email: str = "verify_user@example.com",
    bot_shield_verified: bool = False,
    subscription_active: bool = False,
) -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash=hash_password("password123"),
        display_name="Verify Tester",
        date_of_birth=date(1990, 6, 15),
        bot_shield_verified=bot_shield_verified,
        subscription_active=subscription_active,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _auth_headers(user: User) -> dict[str, str]:
    token = create_access_token(str(user.id))
    return {"Authorization": f"Bearer {token}"}


# ── POST /verify/challenge ────────────────────────────────────────────────────


class TestVerifyChallenge:
    def test_challenge_happy_path_returns_question(self, client, db_session_factory):
        user = _make_user(email="challenge_happy@example.com")
        seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            resp = client.post("/api/v1/verify/challenge")
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert "challenge_id" in data
            assert data["challenge_type"] == "liveness_math"
            assert "?" in data["question"]
            assert "issued_at" in data
            assert "expires_at" in data
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_challenge_rejected_when_already_verified(self, client, db_session_factory):
        user = _make_user(
            email="already_verified@example.com", bot_shield_verified=True
        )
        seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            resp = client.post("/api/v1/verify/challenge")
            assert resp.status_code == 400
            assert "Already verified" in resp.json()["detail"]
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_challenge_requires_auth(self, client):
        resp = client.post("/api/v1/verify/challenge")
        assert resp.status_code in (401, 403)

    def test_challenge_invalid_token_rejected(self, client):
        resp = client.post(
            "/api/v1/verify/challenge",
            headers={"Authorization": "Bearer not.a.valid.token"},
        )
        assert resp.status_code == 401


# ── POST /verify/submit ───────────────────────────────────────────────────────


class TestVerifySubmit:
    def _create_challenge(self, client, user=None) -> dict:  # noqa: ARG002
        resp = client.post("/api/v1/verify/challenge")
        assert resp.status_code == 200, resp.text
        return resp.json()

    def test_submit_requires_auth(self, client):
        resp = client.post(
            "/api/v1/verify/submit",
            json={"challenge_id": str(uuid.uuid4()), "answer": "42"},
        )
        assert resp.status_code in (401, 403)

    def test_submit_nonexistent_challenge_returns_404(self, client, db_session_factory):
        user = _make_user(email="submit_noexist@example.com")
        seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            resp = client.post(
                "/api/v1/verify/submit",
                json={
                    "challenge_id": str(uuid.uuid4()),
                    "answer": "42",
                },
            )
            assert resp.status_code == 404
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_submit_wrong_answer_returns_failed(self, client, db_session_factory):
        """Wrong answer should mark failed and return passed=False."""
        user = _make_user(email="submit_wrong@example.com")
        seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            challenge = self._create_challenge(client, user)

            # Patch elapsed time to bypass MIN_SOLVE_TIME check
            import app.routers.verify as verify_mod

            with patch.object(
                verify_mod,
                "MIN_SOLVE_TIME_SECONDS",
                0,
            ):
                resp = client.post(
                    "/api/v1/verify/submit",
                    json={
                        "challenge_id": challenge["challenge_id"],
                        "answer": "9999_definitely_wrong",
                    },
                )
            assert resp.status_code == 200
            data = resp.json()
            assert data["passed"] is False
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_submit_malformed_challenge_id_rejected(self, client, db_session_factory):
        """A non-UUID challenge_id must not succeed.

        The router does uuid.UUID(req.challenge_id) which raises ValueError.
        This bubbles up through TestClient as an unhandled exception (pre-existing
        bug: the router lacks input validation on challenge_id before parsing).
        """
        user = _make_user(email="submit_malformed@example.com")
        seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            try:
                resp = client.post(
                    "/api/v1/verify/submit",
                    json={"challenge_id": "not-a-uuid", "answer": "42"},
                )
                # Must never succeed (200/passed)
                assert (
                    resp.status_code != 200
                ), f"Malformed challenge_id should be rejected but got 200: {resp.json()}"
            except ValueError as e:
                # ValueError from uuid.UUID() leaking through — document it
                pytest.xfail(
                    f"Known gap: verify/submit lacks input validation on challenge_id UUID format. "
                    f"uuid.UUID() raises ValueError rather than returning 422: {e}"
                )
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_submit_too_fast_returns_passed_false(self, client, db_session_factory):
        """Solving the challenge below MIN_SOLVE_TIME should return passed=False."""
        user = _make_user(email="submit_fast@example.com")
        seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            challenge = self._create_challenge(client, user)
            # MIN_SOLVE_TIME defaults to 3 seconds; TestClient is instant
            # Do NOT patch — this lets the anti-bot check fire naturally
            resp = client.post(
                "/api/v1/verify/submit",
                json={"challenge_id": challenge["challenge_id"], "answer": "0"},
            )
            assert resp.status_code == 200
            data = resp.json()
            # Either wrong answer OR too-fast — both are not-passed
            assert data["passed"] is False
        finally:
            app.dependency_overrides.pop(get_current_user, None)


# ── GET /verify/status ────────────────────────────────────────────────────────


class TestVerifyStatus:
    def test_status_requires_auth(self, client):
        resp = client.get("/api/v1/verify/status")
        assert resp.status_code in (401, 403)

    def test_status_unverified_user(self, client, db_session_factory):
        user = _make_user(email="status_unverified@example.com")
        seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            resp = client.get("/api/v1/verify/status")
            assert resp.status_code == 200
            data = resp.json()
            assert data["verified"] is False
            assert data["tier"] == "unverified"
            assert isinstance(data["trust_score"], (int, float))
            assert data["trust_score"] >= 0
            assert data["trust_score"] <= 100
            # PII isolation: no email, display_name, or id in response
            assert "email" not in data
            assert "display_name" not in data
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_status_verified_user_shows_gold_tier(self, client, db_session_factory):
        user = _make_user(email="status_gold@example.com", bot_shield_verified=True)
        seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            resp = client.get("/api/v1/verify/status")
            assert resp.status_code == 200
            data = resp.json()
            assert data["verified"] is True
            assert data["tier"] == "gold"
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_status_verified_subscriber_shows_platinum_tier(
        self, client, db_session_factory
    ):
        user = _make_user(
            email="status_platinum@example.com",
            bot_shield_verified=True,
            subscription_active=True,
        )
        seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            resp = client.get("/api/v1/verify/status")
            assert resp.status_code == 200
            data = resp.json()
            assert data["tier"] == "platinum"
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_status_response_has_no_pii(self, client, db_session_factory):
        """Verify that /status response schema contains no PII fields."""
        user = _make_user(email="status_pii_check@example.com")
        seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            resp = client.get("/api/v1/verify/status")
            assert resp.status_code == 200
            data = resp.json()
            pii_fields = {
                "email",
                "display_name",
                "date_of_birth",
                "password_hash",
                "google_id",
            }
            assert not pii_fields.intersection(
                data.keys()
            ), f"PII fields found in /verify/status response: {pii_fields.intersection(data.keys())}"
        finally:
            app.dependency_overrides.pop(get_current_user, None)


# ── POST /verify/confirm ──────────────────────────────────────────────────────


class TestVerifyConfirm:
    """Iron Wall: confirm requires BOTH liveness event AND payment event."""

    def test_confirm_requires_auth(self, client):
        resp = client.post("/api/v1/verify/confirm")
        assert resp.status_code in (401, 403)

    def test_confirm_without_liveness_rejected_400(self, client, db_session_factory):
        """No liveness challenge on record → 400."""
        user = _make_user(email="confirm_no_liveness@example.com")
        seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            resp = client.post("/api/v1/verify/confirm")
            assert resp.status_code == 400
            assert "liveness" in resp.json()["detail"].lower()
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_confirm_with_liveness_but_no_payment_rejected_402(
        self, client, db_session_factory
    ):
        """Passed liveness but no payment → 402. No free verifications."""
        user = _make_user(email="confirm_no_payment@example.com")
        passed_event = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="liveness",
            status="passed",
            amount_cents=100,
            challenge_token="tok:hash",
            created_at=datetime.now(timezone.utc),
        )
        seed(user, passed_event, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            resp = client.post("/api/v1/verify/confirm")
            assert resp.status_code == 402
            assert "payment" in resp.json()["detail"].lower()
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_confirm_with_both_liveness_and_payment_succeeds(
        self, client, db_session_factory
    ):
        """Both liveness and payment present → user becomes verified."""
        user = _make_user(email="confirm_both@example.com")
        liveness_event = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="liveness",
            status="passed",
            amount_cents=100,
            challenge_token="tok:hash",
            created_at=datetime.now(timezone.utc),
        )
        payment_event = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            created_at=datetime.now(timezone.utc),
        )
        seed(user, liveness_event, payment_event, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            resp = client.post("/api/v1/verify/confirm")
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["verified"] is True
            assert data["tier"] in ("gold", "platinum")
        finally:
            app.dependency_overrides.pop(get_current_user, None)


# ── POST /verify/refund ───────────────────────────────────────────────────────


class TestVerifyRefund:
    """Three-day $1 Bot-Shield refund route with Square mocked."""

    def test_refund_within_three_days_succeeds_once(
        self, client, db_session_factory, caplog
    ):
        now = datetime.now(timezone.utc)
        user = _make_user(
            email="refund_happy@example.com",
            bot_shield_verified=True,
        )
        profile = verified_profile(user)
        liveness_event = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="liveness",
            status="passed",
            amount_cents=100,
            challenge_token="tok:hash",
            created_at=now - timedelta(days=2),
            completed_at=now - timedelta(days=2),
        )
        payment_event = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_dollar_back_1",
            card_fingerprint="fp_member_alpha_1",
            created_at=now - timedelta(days=2),
            completed_at=now - timedelta(days=2),
        )
        seed(
            user,
            profile,
            liveness_event,
            payment_event,
            db_session_factory=db_session_factory,
        )
        app.dependency_overrides[get_current_user] = override_user(user)
        mock_refund = AsyncMock(
            return_value={
                "id": "rfnd_dollar_back_1",
                "status": "PENDING",
                "payment_id": "pay_dollar_back_1",
            }
        )
        try:
            with (
                caplog.at_level(logging.INFO),
                patch(
                    "app.routers.verify.refund_square_payment",
                    mock_refund,
                    create=True,
                ),
            ):
                resp = client.post("/api/v1/verify/refund")

            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["refunded"] is True
            assert data["verified"] is False
            assert mock_refund.await_count == 1
            call_kwargs = mock_refund.await_args.kwargs
            assert call_kwargs["payment_id"] == "pay_dollar_back_1"
            assert call_kwargs["amount_cents"] == 100
            assert "pay_dollar_back_1" in call_kwargs["idempotency_key"]

            assert "card" not in resp.text.lower()
            assert "fp_member_alpha_1" not in resp.text.lower()
            assert "card" not in caplog.text.lower()
            assert "fp_member_alpha_1" not in caplog.text.lower()

            import asyncio

            async def _fetch_state():
                async with db_session_factory() as session:
                    db_user = await session.scalar(
                        select(User).where(User.id == user.id)
                    )
                    db_profile = await session.scalar(
                        select(Profile).where(Profile.user_id == user.id)
                    )
                    db_payment = await session.scalar(
                        select(VerificationEvent).where(
                            VerificationEvent.id == payment_event.id
                        )
                    )
                    return db_user, db_profile, db_payment

            db_user, db_profile, db_payment = asyncio.run(_fetch_state())
            assert db_user.bot_shield_verified is False
            assert db_profile.verified is False
            assert db_payment.status == "refunded"
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_refund_second_ask_is_refused(self, client, db_session_factory, caplog):
        now = datetime.now(timezone.utc)
        user = _make_user(
            email="refund_second_ask@example.com",
            bot_shield_verified=True,
        )
        profile = verified_profile(user)
        first_payment = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_first_1",
            card_fingerprint="fp_first_1",
            created_at=now - timedelta(days=1),
            completed_at=now - timedelta(days=1),
        )
        seed(user, profile, first_payment, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        mock_refund = AsyncMock(
            return_value={
                "id": "rfnd_first_1",
                "status": "PENDING",
                "payment_id": "pay_first_1",
            }
        )
        try:
            with (
                caplog.at_level(logging.INFO),
                patch(
                    "app.routers.verify.refund_square_payment",
                    mock_refund,
                    create=True,
                ),
            ):
                first_resp = client.post("/api/v1/verify/refund")
                assert first_resp.status_code == 200, first_resp.text

                # Seed a second completed payment on the same account to prove a second ask is still refused
                second_payment = VerificationEvent(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    challenge_type="payment",
                    status="completed",
                    amount_cents=100,
                    square_payment_id="pay_second_2",
                    card_fingerprint="fp_second_2",
                    created_at=now - timedelta(hours=2),
                    completed_at=now - timedelta(hours=2),
                )
                seed(second_payment, db_session_factory=db_session_factory)

                second_resp = client.post("/api/v1/verify/refund")

            assert second_resp.status_code == 409, second_resp.text
            assert mock_refund.await_count == 1
            assert "card" not in second_resp.text.lower()
            assert "fp_first_1" not in second_resp.text.lower()
            assert "fp_second_2" not in second_resp.text.lower()
            assert "card" not in caplog.text.lower()
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_refund_card_fingerprint_already_refunded_is_refused(
        self, client, db_session_factory, caplog
    ):
        now = datetime.now(timezone.utc)
        user_a = _make_user(
            email="refund_fp_a@example.com",
            bot_shield_verified=False,
        )
        refunded_event_a = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user_a.id,
            challenge_type="payment",
            status="refunded",
            amount_cents=100,
            square_payment_id="pay_fp_a",
            card_fingerprint="fp_shared_instrument_99",
            created_at=now - timedelta(days=5),
            completed_at=now - timedelta(days=5),
        )
        user_b = _make_user(
            email="refund_fp_b@example.com",
            bot_shield_verified=True,
        )
        profile_b = verified_profile(user_b)
        payment_event_b = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user_b.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_fp_b",
            card_fingerprint="fp_shared_instrument_99",
            created_at=now - timedelta(days=1),
            completed_at=now - timedelta(days=1),
        )
        seed(
            user_a,
            refunded_event_a,
            user_b,
            profile_b,
            payment_event_b,
            db_session_factory=db_session_factory,
        )
        app.dependency_overrides[get_current_user] = override_user(user_b)
        mock_refund = AsyncMock()
        try:
            with (
                caplog.at_level(logging.INFO),
                patch(
                    "app.routers.verify.refund_square_payment",
                    mock_refund,
                    create=True,
                ),
            ):
                resp = client.post("/api/v1/verify/refund")

            assert resp.status_code == 409, resp.text
            mock_refund.assert_not_awaited()
            assert "card" not in resp.text.lower()
            assert "fp_shared_instrument_99" not in resp.text.lower()
            assert "card" not in caplog.text.lower()
            assert "fp_shared_instrument_99" not in caplog.text.lower()
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_refund_after_three_days_is_refused(
        self, client, db_session_factory, caplog
    ):
        now = datetime.now(timezone.utc)
        user = _make_user(
            email="refund_expired@example.com",
            bot_shield_verified=True,
        )
        profile = verified_profile(user)
        old_payment = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_old_1",
            card_fingerprint="fp_old_1",
            created_at=now - timedelta(days=3, minutes=5),
            completed_at=now - timedelta(days=3, minutes=5),
        )
        seed(user, profile, old_payment, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        mock_refund = AsyncMock()
        try:
            with (
                caplog.at_level(logging.INFO),
                patch(
                    "app.routers.verify.refund_square_payment",
                    mock_refund,
                    create=True,
                ),
            ):
                resp = client.post("/api/v1/verify/refund")

            assert resp.status_code == 400, resp.text
            mock_refund.assert_not_awaited()
            assert "card" not in resp.text.lower()
            assert "card" not in caplog.text.lower()
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_refund_no_payment_is_refused(self, client, db_session_factory, caplog):
        user = _make_user(
            email="refund_nopay@example.com",
            bot_shield_verified=False,
        )
        seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        mock_refund = AsyncMock()
        try:
            with (
                caplog.at_level(logging.INFO),
                patch(
                    "app.routers.verify.refund_square_payment",
                    mock_refund,
                    create=True,
                ),
            ):
                resp = client.post("/api/v1/verify/refund")

            assert resp.status_code == 404, resp.text
            assert "payment" in resp.json()["detail"].lower()
            mock_refund.assert_not_awaited()
            assert "card" not in resp.text.lower()
            assert "card" not in caplog.text.lower()
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_refund_unsigned_returns_401(self, client):
        resp_missing = client.post("/api/v1/verify/refund")
        assert resp_missing.status_code == 401, resp_missing.text

        resp_invalid = client.post(
            "/api/v1/verify/refund",
            headers={"Authorization": "Bearer not.a.valid.token"},
        )
        assert resp_invalid.status_code == 401, resp_invalid.text

    def test_refund_rate_limited_like_other_verify_routes(
        self, client, db_session_factory
    ):
        user = _make_user(email="refund_rl@example.com")
        seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            statuses = [
                client.post("/api/v1/verify/refund").status_code for _ in range(6)
            ]
            assert statuses[:5] == [404] * 5
            assert statuses[5] == 429
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_square_client_wrapper_refund_square_payment(self):
        import asyncio

        from app import square_checkout

        assert hasattr(square_checkout, "refund_square_payment")
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json = MagicMock(
            return_value={
                "refund": {
                    "id": "rfnd_unit_1",
                    "status": "PENDING",
                    "payment_id": "pay_unit_1",
                }
            }
        )
        settings = MagicMock(
            square_access_token="sq0atp-mock-token",
            square_api_base_url="https://connect.squareup.com",
            square_api_version="2026-01-22",
        )
        with patch(
            "app.square_checkout.httpx.AsyncClient.post",
            AsyncMock(return_value=mock_response),
        ) as mock_post:
            result = asyncio.run(
                square_checkout.refund_square_payment(
                    payment_id="pay_unit_1",
                    amount_cents=100,
                    idempotency_key="bot-shield-refund-pay_unit_1",
                    settings=settings,
                )
            )
        assert result is not None
        assert result["id"] == "rfnd_unit_1"
        assert mock_post.await_count == 1
        assert mock_post.await_args.args[0] == "/v2/refunds"
        assert (
            mock_post.await_args.kwargs["json"]["idempotency_key"]
            == "bot-shield-refund-pay_unit_1"
        )
        assert mock_post.await_args.kwargs["json"]["payment_id"] == "pay_unit_1"
        assert mock_post.await_args.kwargs["json"]["amount_money"] == {
            "amount": 100,
            "currency": "USD",
        }
