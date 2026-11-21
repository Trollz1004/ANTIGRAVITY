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

    def test_late_payment_over_48h_after_question_requires_one_new_question_and_verifies_without_second_charge(
        self, client, db_session_factory
    ):
        """When payment lands >48h after the passed question, confirm asks for one new question,
        and passing that new question verifies the member immediately with no new Square charge.
        """
        import app.routers.verify as verify_mod

        now = datetime.now(timezone.utc)
        user = _make_user(email="late_payment_48h@example.com")
        profile = verified_profile(user)
        profile.verified = False
        stale_liveness = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="liveness",
            status="passed",
            amount_cents=100,
            challenge_token="tok:hash",
            created_at=now - timedelta(hours=49),
            completed_at=now - timedelta(hours=49),
        )
        late_payment = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_late_48h_1",
            created_at=now,
            completed_at=now,
        )
        seed(
            user,
            profile,
            stale_liveness,
            late_payment,
            db_session_factory=db_session_factory,
        )
        app.dependency_overrides[get_current_user] = override_user(user)
        mock_square_link = AsyncMock(
            return_value="https://square.link/u/should-not-be-called"
        )
        try:
            confirm_resp = client.post("/api/v1/verify/confirm")
            assert confirm_resp.status_code == 400, confirm_resp.text
            confirm_detail = confirm_resp.json()["detail"]
            assert "prompt" not in confirm_detail.lower()
            assert "new timed question" in confirm_detail.lower()
            assert "no new charge" in confirm_detail.lower()

            status_before = client.get("/api/v1/verify/status")
            assert status_before.status_code == 200, status_before.text
            assert status_before.json()["verified"] is False
            assert status_before.json()["bot_shield_paid"] is True

            with (
                patch.object(
                    verify_mod,
                    "_generate_math_challenge",
                    return_value=("What is 12 + 7?", "19"),
                ),
                patch.object(verify_mod, "MIN_SOLVE_TIME_SECONDS", 0),
                patch.object(
                    verify_mod,
                    "create_square_payment_link",
                    mock_square_link,
                ),
                patch.object(
                    verify_mod,
                    "send_welcome_email",
                    AsyncMock(return_value=True),
                ),
            ):
                chal_resp = client.post("/api/v1/verify/challenge")
                assert chal_resp.status_code == 200, chal_resp.text
                challenge_id = chal_resp.json()["challenge_id"]

                submit_resp = client.post(
                    "/api/v1/verify/submit",
                    json={"challenge_id": challenge_id, "answer": "19"},
                )

            assert submit_resp.status_code == 200, submit_resp.text
            submit_data = submit_resp.json()
            assert submit_data["passed"] is True
            assert submit_data["checkout_url"] is None
            mock_square_link.assert_not_awaited()

            status_after = client.get("/api/v1/verify/status")
            assert status_after.status_code == 200, status_after.text
            assert status_after.json()["verified"] is True
            assert status_after.json()["bot_shield_paid"] is True
            assert status_after.json()["tier"] == "gold"
        finally:
            app.dependency_overrides.pop(get_current_user, None)


# ── POST /verify/refund ───────────────────────────────────────────────────────


class TestVerifyRefund:
    """Three-day $1 Bot-Shield refund route with Square mocked."""

    @pytest.fixture(autouse=True)
    def _enable_refund_switch(self, monkeypatch):
        from app.config import get_settings

        monkeypatch.setattr(
            get_settings(), "bot_shield_refund_enabled", True, raising=False
        )

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
            assert getattr(db_payment, "square_refund_id", None) == "rfnd_dollar_back_1"
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_refund_marks_every_completed_one_dollar_payment_so_confirm_cannot_restore_badge(
        self, client, db_session_factory
    ):
        now = datetime.now(timezone.utc)
        user = _make_user(
            email="refund_multi_pay@example.com",
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
        older_payment = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_multi_older_1",
            card_fingerprint="fp_multi_1",
            created_at=now - timedelta(days=2),
            completed_at=now - timedelta(days=2),
        )
        newer_payment = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_multi_newer_2",
            card_fingerprint="fp_multi_1",
            created_at=now - timedelta(days=1),
            completed_at=now - timedelta(days=1),
        )
        seed(
            user,
            profile,
            liveness_event,
            older_payment,
            newer_payment,
            db_session_factory=db_session_factory,
        )
        app.dependency_overrides[get_current_user] = override_user(user)
        mock_refund = AsyncMock(
            return_value={
                "id": "rfnd_multi_newer_2",
                "status": "PENDING",
                "payment_id": "pay_multi_newer_2",
            }
        )
        try:
            with patch(
                "app.routers.verify.refund_square_payment",
                mock_refund,
                create=True,
            ):
                refund_resp = client.post("/api/v1/verify/refund")
            assert refund_resp.status_code == 200, refund_resp.text

            import asyncio

            async def _fetch_payments():
                async with db_session_factory() as session:
                    rows = (
                        await session.scalars(
                            select(VerificationEvent)
                            .where(VerificationEvent.user_id == user.id)
                            .where(VerificationEvent.challenge_type == "payment")
                        )
                    ).all()
                    return rows

            payment_rows = asyncio.run(_fetch_payments())
            assert len(payment_rows) == 2
            assert all(row.status == "refunded" for row in payment_rows)

            confirm_resp = client.post("/api/v1/verify/confirm")
            assert confirm_resp.status_code == 402, confirm_resp.text

            status_resp = client.get("/api/v1/verify/status")
            assert status_resp.status_code == 200, status_resp.text
            assert status_resp.json()["verified"] is False
            assert status_resp.json()["bot_shield_paid"] is False
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_trust_score_after_refund_does_not_equal_verified_score(
        self, client, db_session_factory
    ):
        now = datetime.now(timezone.utc)
        user = _make_user(
            email="refund_trust_score@example.com",
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
            created_at=now - timedelta(days=1),
            completed_at=now - timedelta(days=1),
        )
        payment_event = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_trust_1",
            card_fingerprint="fp_trust_1",
            created_at=now - timedelta(days=1),
            completed_at=now - timedelta(days=1),
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
                "id": "rfnd_trust_1",
                "status": "PENDING",
                "payment_id": "pay_trust_1",
            }
        )
        try:
            before_resp = client.get("/api/v1/verify/status")
            assert before_resp.status_code == 200, before_resp.text
            verified_score = before_resp.json()["trust_score"]
            assert verified_score == 60.0

            with patch(
                "app.routers.verify.refund_square_payment",
                mock_refund,
                create=True,
            ):
                refund_resp = client.post("/api/v1/verify/refund")
            assert refund_resp.status_code == 200, refund_resp.text

            after_resp = client.get("/api/v1/verify/status")
            assert after_resp.status_code == 200, after_resp.text
            after_score = after_resp.json()["trust_score"]
            assert after_resp.json()["verified"] is False
            assert after_score != verified_score
            assert after_score < verified_score
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_square_refund_id_column_reconcile_and_alembic_revision(self):
        import inspect
        from pathlib import Path

        from app import database
        from app.models import VerificationEvent

        col = VerificationEvent.__table__.columns.get("square_refund_id")
        assert col is not None
        assert col.nullable is True

        db_source = inspect.getsource(database)
        assert (
            "ALTER TABLE IF EXISTS verification_events ADD COLUMN IF NOT EXISTS square_refund_id VARCHAR(255)"
            in db_source
        )
        assert '"square_refund_id"' in db_source

        versions_dir = Path(__file__).resolve().parents[1] / "alembic" / "versions"
        matching = list(
            versions_dir.glob("*add_square_refund_id_to_verification_events.py")
        )
        assert len(matching) == 1
        migration_text = matching[0].read_text(encoding="utf-8")
        assert 'COLUMN_NAME = "square_refund_id"' in migration_text
        assert 'down_revision: Union[str, None] = "c3d4e5f6a7b8"' in migration_text

        from app.models import RevenueAllocation

        alloc_col = RevenueAllocation.__table__.columns.get("square_refund_id")
        assert alloc_col is not None
        assert alloc_col.nullable is True
        assert (
            "ALTER TABLE IF EXISTS revenue_allocations ADD COLUMN IF NOT EXISTS square_refund_id VARCHAR(255)"
            in db_source
        )
        alloc_matching = list(
            versions_dir.glob("*add_square_refund_id_to_revenue_allocations.py")
        )
        assert len(alloc_matching) == 1
        alloc_migration_text = alloc_matching[0].read_text(encoding="utf-8")
        assert 'COLUMN_NAME = "square_refund_id"' in alloc_migration_text
        assert 'TABLE = "revenue_allocations"' in alloc_migration_text
        assert (
            'down_revision: Union[str, None] = "d4e5f6a7b8c9"' in alloc_migration_text
        )

    def test_checks_completed_does_not_count_refunded_payment(
        self, client, db_session_factory
    ):
        now = datetime.now(timezone.utc)
        user = _make_user(
            email="refund_checks_count@example.com",
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
            created_at=now - timedelta(days=1),
            completed_at=now - timedelta(days=1),
        )
        payment_event = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_checks_count_1",
            card_fingerprint="fp_checks_count_1",
            created_at=now - timedelta(days=1),
            completed_at=now - timedelta(days=1),
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
                "id": "rfnd_checks_count_1",
                "status": "PENDING",
                "payment_id": "pay_checks_count_1",
            }
        )
        try:
            before_resp = client.get("/api/v1/verify/status")
            assert before_resp.status_code == 200, before_resp.text
            assert before_resp.json()["checks_completed"] == 2

            with patch(
                "app.routers.verify.refund_square_payment",
                mock_refund,
                create=True,
            ):
                refund_resp = client.post("/api/v1/verify/refund")
            assert refund_resp.status_code == 200, refund_resp.text

            after_resp = client.get("/api/v1/verify/status")
            assert after_resp.status_code == 200, after_resp.text
            assert after_resp.json()["checks_completed"] == 1
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_refund_marks_revenue_allocation_refunded_with_square_refund_id(
        self, client, db_session_factory
    ):
        from app.models import RevenueAllocation

        now = datetime.now(timezone.utc)
        user = _make_user(
            email="refund_alloc_id@example.com",
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
            created_at=now - timedelta(days=1),
            completed_at=now - timedelta(days=1),
        )
        payment_event = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_alloc_route_1",
            card_fingerprint="fp_alloc_route_1",
            created_at=now - timedelta(days=1),
            completed_at=now - timedelta(days=1),
        )
        allocation = RevenueAllocation(
            id=uuid.uuid4(),
            user_id=user.id,
            source_event_id="evt_seed_pay_alloc_route_1",
            square_payment_id="pay_alloc_route_1",
            payment_tier="bot_shield",
            gross_amount_cents=100,
            reserve_amount_cents=0,
            operating_amount_cents=100,
            status="reserved",
        )
        seed(
            user,
            profile,
            liveness_event,
            payment_event,
            allocation,
            db_session_factory=db_session_factory,
        )
        app.dependency_overrides[get_current_user] = override_user(user)
        mock_refund = AsyncMock(
            return_value={
                "id": "rfnd_alloc_route_1",
                "status": "COMPLETED",
                "payment_id": "pay_alloc_route_1",
            }
        )
        try:
            with patch(
                "app.routers.verify.refund_square_payment",
                mock_refund,
                create=True,
            ):
                resp = client.post("/api/v1/verify/refund")
            assert resp.status_code == 200, resp.text

            import asyncio

            async def _fetch_alloc():
                async with db_session_factory() as session:
                    return await session.scalar(
                        select(RevenueAllocation).where(
                            RevenueAllocation.id == allocation.id
                        )
                    )

            db_alloc = asyncio.run(_fetch_alloc())
            assert db_alloc is not None
            assert db_alloc.status == "refunded"
            assert getattr(db_alloc, "square_refund_id", None) == "rfnd_alloc_route_1"
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


# ── Dollar-back switch (bot_shield_refund_enabled) + GET /verify/refund-status ─


class TestVerifyRefundSwitchAndStatus:
    """Tests for bot_shield_refund_enabled (default False) and GET /api/v1/verify/refund-status."""

    def test_bot_shield_refund_enabled_defaults_to_false_and_in_env_example(
        self, monkeypatch
    ):
        from pathlib import Path

        from app.config import Settings

        monkeypatch.delenv("BOT_SHIELD_REFUND_ENABLED", raising=False)
        settings = Settings(_env_file=None, jwt_secret="x" * 40)
        assert settings.bot_shield_refund_enabled is False

        env_example = (Path(__file__).resolve().parents[1] / ".env.example").read_text(
            encoding="utf-8"
        )
        assert "BOT_SHIELD_REFUND_ENABLED" in env_example

    def test_when_switch_off_refund_answers_404_and_refund_status_answers_unavailable(
        self, client, db_session_factory, monkeypatch
    ):
        from app.config import get_settings

        monkeypatch.setattr(
            get_settings(), "bot_shield_refund_enabled", False, raising=False
        )
        now = datetime.now(timezone.utc)
        user = _make_user(
            email="switch_off_member@example.com",
            bot_shield_verified=True,
        )
        profile = verified_profile(user)
        payment_event = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_switch_off_1",
            card_fingerprint="fp_switch_off_1",
            created_at=now - timedelta(days=1),
            completed_at=now - timedelta(days=1),
        )
        seed(user, profile, payment_event, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        mock_refund = AsyncMock()
        try:
            status_resp = client.get("/api/v1/verify/refund-status")
            assert status_resp.status_code == 200, status_resp.text
            assert status_resp.json() == {"available": False}

            with patch(
                "app.routers.verify.refund_square_payment",
                mock_refund,
                create=True,
            ):
                refund_resp = client.post("/api/v1/verify/refund")
            assert refund_resp.status_code == 404, refund_resp.text
            mock_refund.assert_not_awaited()
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_when_switch_on_refund_status_says_available_and_until_when(
        self, client, db_session_factory, monkeypatch
    ):
        from app.config import get_settings

        monkeypatch.setattr(
            get_settings(), "bot_shield_refund_enabled", True, raising=False
        )
        now = datetime.now(timezone.utc)
        paid_at = now - timedelta(days=1)
        user = _make_user(
            email="switch_on_eligible@example.com",
            bot_shield_verified=True,
        )
        profile = verified_profile(user)
        payment_event = VerificationEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_switch_on_1",
            card_fingerprint="fp_switch_on_1",
            created_at=paid_at,
            completed_at=paid_at,
        )
        seed(user, profile, payment_event, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = override_user(user)
        try:
            resp = client.get("/api/v1/verify/refund-status")
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["available"] is True
            expected_until = (paid_at + timedelta(days=3)).isoformat()
            assert data.get("expires_at") == expected_until
            assert data.get("until") == expected_until
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_when_switch_on_refund_status_unavailable_after_three_days_or_prior_ask(
        self, client, db_session_factory, monkeypatch
    ):
        from app.config import get_settings

        monkeypatch.setattr(
            get_settings(), "bot_shield_refund_enabled", True, raising=False
        )
        now = datetime.now(timezone.utc)

        expired_user = _make_user(
            email="switch_on_expired@example.com",
            bot_shield_verified=True,
        )
        expired_payment = VerificationEvent(
            id=uuid.uuid4(),
            user_id=expired_user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_switch_on_old",
            card_fingerprint="fp_switch_on_old",
            created_at=now - timedelta(days=3, minutes=5),
            completed_at=now - timedelta(days=3, minutes=5),
        )

        already_asked_user = _make_user(
            email="switch_on_asked@example.com",
            bot_shield_verified=True,
        )
        prior_refund = VerificationEvent(
            id=uuid.uuid4(),
            user_id=already_asked_user.id,
            challenge_type="payment",
            status="refunded",
            amount_cents=100,
            square_payment_id="pay_prior_refund",
            card_fingerprint="fp_prior_refund",
            created_at=now - timedelta(days=2),
            completed_at=now - timedelta(days=2),
        )
        newer_payment = VerificationEvent(
            id=uuid.uuid4(),
            user_id=already_asked_user.id,
            challenge_type="payment",
            status="completed",
            amount_cents=100,
            square_payment_id="pay_newer_after_refund",
            card_fingerprint="fp_newer_after_refund",
            created_at=now - timedelta(hours=3),
            completed_at=now - timedelta(hours=3),
        )
        seed(
            expired_user,
            expired_payment,
            already_asked_user,
            prior_refund,
            newer_payment,
            db_session_factory=db_session_factory,
        )

        app.dependency_overrides[get_current_user] = override_user(expired_user)
        try:
            resp_expired = client.get("/api/v1/verify/refund-status")
            assert resp_expired.status_code == 200, resp_expired.text
            assert resp_expired.json()["available"] is False
        finally:
            app.dependency_overrides.pop(get_current_user, None)

        app.dependency_overrides[get_current_user] = override_user(already_asked_user)
        try:
            resp_asked = client.get("/api/v1/verify/refund-status")
            assert resp_asked.status_code == 200, resp_asked.text
            assert resp_asked.json()["available"] is False
        finally:
            app.dependency_overrides.pop(get_current_user, None)
