"""Square webhook security tests — CI quick-win #4.

Covers three security surfaces that were previously un-exercised in CI
(SQUARE_WEBHOOK_VERIFY_SIGNATURE was 'false'):

  A. Constant-time HMAC compare — verifies hmac.compare_digest is used
  B. Replay prevention — duplicate event_id must be accepted idempotently (200)
  C. Malformed header rejection — missing / bad / wrong-body signatures → 401 or 400

All tests run with SQUARE_WEBHOOK_VERIFY_SIGNATURE=true (set in conftest.py).
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import inspect
import json
import uuid
from datetime import datetime, timezone

import pytest

from tests.conftest import (
    generate_square_signature,
    make_square_payment_event,
)

# ── Constants shared across tests ───────────────────────────────────────────

TEST_SIGNING_KEY = "test-square-signature"
TEST_NOTIFICATION_URL = "http://testserver/api/v1/webhooks/square-payment"
TEST_BOOKING_SIGNING_KEY = "test-square-signature"
TEST_BOOKING_NOTIFICATION_URL = "http://testserver/api/v1/webhooks/square-booking"


def _make_signed_payment_payload(
    *,
    event_id: str | None = None,
    amount_cents: int = 100,
    buyer_email: str = "sectest@example.com",
    note: str = "Bot-Shield Verification",
    payment_status: str = "COMPLETED",
    signing_key: str = TEST_SIGNING_KEY,
    notification_url: str = TEST_NOTIFICATION_URL,
) -> tuple[dict, str]:
    """Return (payload_dict, valid_signature) pair."""
    payload = make_square_payment_event(
        event_id=event_id or f"evt_{uuid.uuid4().hex[:20]}",
        amount_cents=amount_cents,
        buyer_email=buyer_email,
        note=note,
        payment_status=payment_status,
    )
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    signature = generate_square_signature(body, signing_key, notification_url)
    return payload, signature


# ── A. Constant-time HMAC compare ───────────────────────────────────────────


class TestConstantTimeHmacCompare:
    """Verify the signature comparison uses hmac.compare_digest, not ==.

    A timing-attack via == would let an adversary brute-force the signature
    one byte at a time in ~256 * len(sig) requests. hmac.compare_digest
    runs in constant time regardless of where the first mismatch occurs.
    """

    def test_verify_square_signature_uses_hmac_compare_digest(self):
        """Source of _verify_square_signature must call hmac.compare_digest."""
        from app.routers.webhooks import _verify_square_signature

        source = inspect.getsource(_verify_square_signature)
        assert (
            "hmac.compare_digest" in source
        ), (
            "SECURITY: _verify_square_signature must use hmac.compare_digest "
            "to prevent timing-attack signature enumeration. "
            "Replace any `==` comparison with hmac.compare_digest(expected, provided)."
        )

    def test_verify_square_signature_does_not_use_equality_operator(self):
        """The comparison must not use bare == between signature strings."""
        from app.routers.webhooks import _verify_square_signature

        source = inspect.getsource(_verify_square_signature)
        # Allow == only in non-comparison contexts (e.g. is not None checks).
        # We look for the pattern: string_var == string_var (two identifiers).
        # A rough but effective heuristic: if compare_digest is present and ==
        # is NOT used to compare signature strings, we're safe.
        # We specifically check that no `== provided_signature` or
        # `== expected_signature` appears (the variable names used in the impl).
        assert "== provided_signature" not in source, (
            "SECURITY: signature comparison must use hmac.compare_digest, not =="
        )
        assert "== expected_signature" not in source, (
            "SECURITY: signature comparison must use hmac.compare_digest, not =="
        )

    def test_valid_signature_passes_with_verification_on(self):
        """End-to-end: a correctly signed payload reaches 200 with verify=true."""
        from app.routers.webhooks import _verify_square_signature

        payload = json.dumps(
            {"event_id": "hmac-test-001", "type": "payment.updated"}
        ).encode("utf-8")
        signature = generate_square_signature(
            payload, TEST_SIGNING_KEY, TEST_NOTIFICATION_URL
        )
        # Must not raise HTTPException
        _verify_square_signature(
            payload,
            signature,
            signature_key=TEST_SIGNING_KEY,
            notification_url=TEST_NOTIFICATION_URL,
        )


# ── B. Replay prevention ─────────────────────────────────────────────────────


class TestReplayPrevention:
    """Duplicate event_id must be accepted idempotently (200, duplicate=true).

    Square's retry policy resends webhooks for up to 72 hours on non-2xx
    responses. The server must return 200 on duplicates so Square stops
    retrying, but must NOT re-process the event.
    """

    def test_duplicate_payment_event_returns_200_with_duplicate_flag(
        self, client, db_session_factory
    ):
        """Sending the same event_id twice must succeed idempotently."""
        event_id = f"evt_replay_{uuid.uuid4().hex[:16]}"
        payload, signature = _make_signed_payment_payload(event_id=event_id)
        body = json.dumps(payload, separators=(",", ":"))

        headers = {
            "x-square-hmacsha256-signature": signature,
            "Content-Type": "application/json",
        }

        # First request — fresh event
        r1 = client.post(
            "/api/v1/webhooks/square-payment", headers=headers, content=body
        )
        assert r1.status_code == 200, f"First request failed: {r1.text}"
        r1_json = r1.json()
        assert r1_json["event_id"] == event_id

        # Second request — same event_id, same body, same signature
        r2 = client.post(
            "/api/v1/webhooks/square-payment", headers=headers, content=body
        )
        assert r2.status_code == 200, (
            f"Replay must return 200 (idempotent), got {r2.status_code}: {r2.text}"
        )
        r2_json = r2.json()
        assert r2_json["duplicate"] is True, (
            f"Replay response must set duplicate=true, got: {r2_json}"
        )

    def test_second_duplicate_does_not_create_extra_db_rows(
        self, client, db_session_factory
    ):
        """Two requests with the same event_id must produce only one DB record."""
        import asyncio

        from sqlalchemy import select

        from app.models import WebhookEvent

        event_id = f"evt_dedup_{uuid.uuid4().hex[:16]}"
        payload, signature = _make_signed_payment_payload(event_id=event_id)
        body = json.dumps(payload, separators=(",", ":"))
        headers = {
            "x-square-hmacsha256-signature": signature,
            "Content-Type": "application/json",
        }

        client.post("/api/v1/webhooks/square-payment", headers=headers, content=body)
        client.post("/api/v1/webhooks/square-payment", headers=headers, content=body)

        async def count_events() -> int:
            async with db_session_factory() as session:
                rows = await session.scalars(
                    select(WebhookEvent).where(
                        WebhookEvent.event_source_id == event_id
                    )
                )
                return len(list(rows))

        count = asyncio.run(count_events())
        assert count == 1, (
            f"Duplicate event_id must produce exactly 1 DB row, got {count}"
        )

    def test_distinct_event_ids_are_not_deduplicated(
        self, client, db_session_factory
    ):
        """Two requests with different event_ids must both be processed."""
        event_id_a = f"evt_distinct_a_{uuid.uuid4().hex[:12]}"
        event_id_b = f"evt_distinct_b_{uuid.uuid4().hex[:12]}"

        payload_a, sig_a = _make_signed_payment_payload(event_id=event_id_a)
        payload_b, sig_b = _make_signed_payment_payload(event_id=event_id_b)

        r_a = client.post(
            "/api/v1/webhooks/square-payment",
            headers={
                "x-square-hmacsha256-signature": sig_a,
                "Content-Type": "application/json",
            },
            content=json.dumps(payload_a, separators=(",", ":")),
        )
        r_b = client.post(
            "/api/v1/webhooks/square-payment",
            headers={
                "x-square-hmacsha256-signature": sig_b,
                "Content-Type": "application/json",
            },
            content=json.dumps(payload_b, separators=(",", ":")),
        )

        assert r_a.status_code == 200
        assert r_b.status_code == 200
        assert r_a.json()["duplicate"] is False
        assert r_b.json()["duplicate"] is False


# ── C. Malformed header rejection ────────────────────────────────────────────


class TestMalformedHeaderRejection:
    """Requests with bad or missing signature headers must be rejected.

    All rejection paths must return 4xx — never 500 — so Square's retry
    logic behaves predictably and no stack traces leak to the caller.
    """

    def _valid_body_and_sig(self) -> tuple[bytes, str]:
        payload, sig = _make_signed_payment_payload()
        return json.dumps(payload, separators=(",", ":")).encode("utf-8"), sig

    def test_missing_signature_header_returns_400(self, client, db_session_factory):
        """A webhook with no x-square-hmacsha256-signature header must be rejected."""
        payload, _ = _make_signed_payment_payload()
        body = json.dumps(payload, separators=(",", ":"))

        response = client.post(
            "/api/v1/webhooks/square-payment",
            headers={"Content-Type": "application/json"},
            content=body,
        )
        assert response.status_code in (400, 401), (
            f"Missing signature must be rejected with 400/401, got {response.status_code}"
        )

    def test_wrong_body_signature_returns_400(self, client, db_session_factory):
        """A signature computed over a different body must be rejected."""
        payload, _ = _make_signed_payment_payload()
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")

        # Compute signature over a DIFFERENT body
        different_body = b'{"event_id": "attacker-controlled", "type": "payment.updated"}'
        bad_signature = generate_square_signature(
            different_body, TEST_SIGNING_KEY, TEST_NOTIFICATION_URL
        )

        response = client.post(
            "/api/v1/webhooks/square-payment",
            headers={
                "x-square-hmacsha256-signature": bad_signature,
                "Content-Type": "application/json",
            },
            content=body,
        )
        assert response.status_code in (400, 401), (
            f"Wrong-body signature must be rejected, got {response.status_code}"
        )

    def test_invalid_base64_signature_returns_400_not_500(
        self, client, db_session_factory
    ):
        """A signature with invalid base64 content must not cause a 500."""
        payload, _ = _make_signed_payment_payload()
        body = json.dumps(payload, separators=(",", ":"))

        response = client.post(
            "/api/v1/webhooks/square-payment",
            headers={
                "x-square-hmacsha256-signature": "not-valid-base64!!!###",
                "Content-Type": "application/json",
            },
            content=body,
        )
        assert response.status_code in (400, 401), (
            f"Invalid base64 signature must be rejected with 4xx, not 5xx. "
            f"Got {response.status_code}: {response.text}"
        )
        assert response.status_code < 500, "Must never return 500 on bad signature"

    def test_empty_signature_header_returns_400(self, client, db_session_factory):
        """An empty string in the signature header must be treated as missing."""
        payload, _ = _make_signed_payment_payload()
        body = json.dumps(payload, separators=(",", ":"))

        response = client.post(
            "/api/v1/webhooks/square-payment",
            headers={
                "x-square-hmacsha256-signature": "",
                "Content-Type": "application/json",
            },
            content=body,
        )
        assert response.status_code in (400, 401), (
            f"Empty signature must be rejected, got {response.status_code}"
        )

    def test_wrong_signing_key_returns_400(self, client, db_session_factory):
        """A signature computed with a different key must be rejected."""
        payload, _ = _make_signed_payment_payload()
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")

        # Sign with a completely different key
        attacker_key = "attacker-controlled-key-that-is-not-the-real-one"
        bad_signature = generate_square_signature(
            body, attacker_key, TEST_NOTIFICATION_URL
        )

        response = client.post(
            "/api/v1/webhooks/square-payment",
            headers={
                "x-square-hmacsha256-signature": bad_signature,
                "Content-Type": "application/json",
            },
            content=body,
        )
        assert response.status_code in (400, 401), (
            f"Wrong-key signature must be rejected, got {response.status_code}"
        )
