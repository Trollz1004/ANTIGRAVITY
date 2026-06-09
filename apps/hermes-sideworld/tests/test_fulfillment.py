"""Tests for AI Solutions Store fulfillment."""

from __future__ import annotations

import hashlib
import hmac
import json
import time

import pytest

from hermes_sideworld.demo import issue_admin_license, issue_license_for_purchase, list_contacts
from hermes_sideworld.email_delivery import build_license_email
from hermes_sideworld.fulfillment import handle_stripe_webhook, verify_stripe_signature


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    """Redirect the demo DB and data dir to a temp directory for each test."""
    import hermes_sideworld.demo as demo_mod

    monkeypatch.setattr(demo_mod, "DATA_DIR", tmp_path)
    monkeypatch.setattr(demo_mod, "DEMO_DB", tmp_path / "demo_contacts.json")
    monkeypatch.setenv("AI_SOLUTIONS_LICENSE_SECRET", "test-license-secret")
    yield tmp_path


def _signature(payload: bytes, secret: str, timestamp: int | None = None) -> str:
    timestamp = timestamp or int(time.time())
    digest = hmac.new(secret.encode(), f"{timestamp}.".encode() + payload, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={digest}"


def test_issue_license_for_purchase_is_idempotent():
    first = issue_license_for_purchase(
        purchase_id="cs_test_123",
        buyer_email="buyer@example.com",
        buyer_name="Buyer",
        product="bot-shield",
    )
    second = issue_license_for_purchase(
        purchase_id="cs_test_123",
        buyer_email="buyer@example.com",
        buyer_name="Buyer",
        product="bot-shield",
    )
    assert first.key == second.key
    assert first.key.startswith("AIS-BOT-SHIELD-")
    contacts = list_contacts()
    assert len(contacts) == 1
    assert contacts[0].purchased


def test_admin_license_requires_private_secret(monkeypatch):
    monkeypatch.setenv("AI_SOLUTIONS_ADMIN_SECRET", "admin-secret")
    with pytest.raises(PermissionError):
        issue_admin_license(buyer_email="josh@example.com", product="all-access", admin_secret="wrong")
    key = issue_admin_license(buyer_email="josh@example.com", product="all-access", admin_secret="admin-secret")
    assert key.key.startswith("AIS-ALL-ACCESS-")


def test_license_email_has_no_blocked_public_terms():
    subject, body = build_license_email(
        buyer_email="buyer@example.com",
        product="bot-shield",
        license_key="AIS-BOT-SHIELD-12345678-90abcdef-12345678",
    )
    combined = f"{subject}\n{body}".lower()
    for term in ("donate", "donation", "charity", "solicitation", "giving back", "disbursement"):
        assert term not in combined


def test_verify_stripe_signature():
    secret = "whsec_test"
    payload = b'{"type":"checkout.session.completed"}'
    assert verify_stripe_signature(payload, _signature(payload, secret), secret)
    assert not verify_stripe_signature(payload, "t=1,v1=bad", secret)


def test_handle_stripe_webhook_issues_and_delivers(monkeypatch):
    secret = "whsec_test"
    event = {
        "id": "evt_123",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_live_123",
                "payment_link": "https://buy.stripe.com/3cI3cwcR6c3910p18peEo09",
                "customer_details": {"email": "buyer@example.com", "name": "Buyer"},
            }
        },
    }
    payload = json.dumps(event, separators=(",", ":")).encode()
    result = handle_stripe_webhook(payload, _signature(payload, secret), secret)
    assert result is not None
    assert result.ok
    assert result.product == "bot-shield"
    assert result.buyer_email == "buyer@example.com"
    assert result.license_key.startswith("AIS-BOT-SHIELD-")
    assert result.delivery.provider == "console"


def test_handle_stripe_webhook_rejects_bad_signature():
    payload = json.dumps({"type": "checkout.session.completed"}).encode()
    with pytest.raises(PermissionError):
        handle_stripe_webhook(payload, "t=1,v1=bad", "whsec_test")
