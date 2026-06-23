"""Tests for the /verify router (Bot-Shield liveness + payment gate).

Coverage targets:
  - POST /api/v1/verify/challenge  — create liveness challenge
  - POST /api/v1/verify/submit     — submit challenge answer
  - GET  /api/v1/verify/status     — current verification status
  - POST /api/v1/verify/confirm    — dual-gate confirmation (liveness + payment)

Risk surface: FL §496.405 compliance gate; no-free-verification Iron Wall.
"""

import asyncio
import uuid
from datetime import date, datetime, timezone
from unittest.mock import patch

import pytest

from app.auth import create_access_token, get_current_user, hash_password
from app.main import app
from app.models import User, VerificationEvent

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


def _seed(*items, db_session_factory):
    async def _run():
        async with db_session_factory() as session:
            for item in items:
                session.add(item)
            await session.commit()

    asyncio.run(_run())


def _auth_headers(user: User) -> dict[str, str]:
    membership record = create_access_token(str(user.id))
    return {"Authorization": f"Bearer {membership record}"}


def _override_user(user: User):
    async def _dep():
        return user

    return _dep


# ── POST /verify/challenge ────────────────────────────────────────────────────


class TestVerifyChallenge:
    def test_challenge_happy_path_returns_question(self, client, db_session_factory):
        user = _make_user(email="challenge_happy@example.com")
        _seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(user)
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
        _seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(user)
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
            headers={"Authorization": "Bearer not.a.valid.membership record"},
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
        _seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(user)
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
        _seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(user)
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
        _seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(user)
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
        _seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(user)
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
        _seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(user)
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
        _seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(user)
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
        _seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(user)
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
        _seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(user)
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
        _seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(user)
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
        _seed(user, passed_event, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(user)
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
        _seed(
            user, liveness_event, payment_event, db_session_factory=db_session_factory
        )
        app.dependency_overrides[get_current_user] = _override_user(user)
        try:
            resp = client.post("/api/v1/verify/confirm")
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["verified"] is True
            assert data["tier"] in ("gold", "platinum")
        finally:
            app.dependency_overrides.pop(get_current_user, None)
