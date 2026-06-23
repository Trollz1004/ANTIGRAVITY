"""CLI end-to-end coverage for Sideworld purchase/admin flows."""

from __future__ import annotations

import hashlib
import hmac
import json
import time

import pytest
from click.testing import CliRunner

from hermes_sideworld.cli import main


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    import hermes_sideworld.demo as demo_mod

    monkeypatch.setattr(demo_mod, "DATA_DIR", tmp_path)
    monkeypatch.setattr(demo_mod, "DEMO_DB", tmp_path / "demo_contacts.json")
    monkeypatch.setenv("AI_SOLUTIONS_LICENSE_SECRET", "test-license-secret")
    yield tmp_path


def _signature(payload: bytes, secret: str) -> str:
    timestamp = int(time.time())
    digest = hmac.new(secret.encode(), f"{timestamp}.".encode() + payload, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={digest}"


def test_admin_key_cli_rejects_wrong_secret(monkeypatch):
    monkeypatch.setenv("AI_SOLUTIONS_ADMIN_SECRET", "admin-secret")
    result = CliRunner().invoke(
        main,
        ["admin-key", "--email", "josh@example.com", "--product", "all-access", "--secret", "wrong"],
    )
    assert result.exit_code != 0
    assert isinstance(result.exception, PermissionError)
    assert "invalid AI_SOLUTIONS_ADMIN_SECRET" in str(result.exception)


def test_admin_key_cli_issues_all_access_key_from_env(monkeypatch):
    monkeypatch.setenv("AI_SOLUTIONS_ADMIN_SECRET", "admin-secret")
    result = CliRunner().invoke(main, ["admin-key", "--email", "josh@example.com", "--product", "all-access"])
    assert result.exit_code == 0
    assert "Admin license issued" in result.output
    assert "AIS-ALL-ACCESS-" in result.output


def test_webhook_file_cli_fulfills_saved_checkout_event(tmp_path):
    secret = "whsec_test"
    event = {
        "id": "evt_123",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_cli_123",
                "payment_link": "https://buy.alternate processor.com/3cI3cwcR6c3910p18peEo09",
                "customer_details": {"email": "buyer@example.com", "name": "Buyer"},
            }
        },
    }
    payload = json.dumps(event, separators=(",", ":")).encode()
    payload_path = tmp_path / "alternate processor-event.json"
    payload_path.write_bytes(payload)
    result = CliRunner().invoke(
        main,
        [
            "webhook-file",
            "--payload",
            str(payload_path),
            "--signature",
            _signature(payload, secret),
            "--secret",
            secret,
        ],
    )
    assert result.exit_code == 0
    assert "Webhook fulfilled" in result.output
    assert "bot-shield" in result.output
    assert "AIS-BOT-SHIELD-" in result.output


def test_demo_activate_list_cli_roundtrip():
    runner = CliRunner()
    demo = runner.invoke(main, ["demo", "--name", "Jane", "--product", "bot-shield", "--email", "jane@example.com"])
    assert demo.exit_code == 0
    contact_id_line = next(line for line in demo.output.splitlines() if "ID" in line and ":" in line)
    contact_id = contact_id_line.split(":", 1)[1].strip()

    activate = runner.invoke(main, ["activate", "--contact-id", contact_id])
    assert activate.exit_code == 0
    assert "License issued" in activate.output
    assert "AIS-BOT-SHIELD-" in activate.output

    listed = runner.invoke(main, ["list"])
    assert listed.exit_code == 0
    assert "Jane" in listed.output
    assert "YES" in listed.output
