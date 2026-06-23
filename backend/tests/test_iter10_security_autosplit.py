"""
iter10 — security posture, ledger auto-split, new webhook sources,
IP-allowlist (separate destructive test), and regression coverage.

Run:
  pytest /app/backend/tests/test_iter10_security_autosplit.py -v
"""
from __future__ import annotations

import os
import time
import subprocess
from pathlib import Path

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fall back to /app/frontend/.env (testing context)
    fe_env = Path("/app/frontend/.env").read_text()
    for line in fe_env.splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
            break

ADMIN_PASSWORD = "!!11trasH"
BACKEND_ENV = Path("/app/backend/.env")


# ── Fixtures ─────────────────────────────────────────────────────────────── #
@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def admin(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return api


# ── 1. Security posture ──────────────────────────────────────────────────── #
class TestSecurityPosture:
    def test_posture_shape_and_channels(self, api):
        r = api.get(f"{BASE_URL}/api/security/posture")
        assert r.status_code == 200, r.text
        d = r.json()
        # required top-level keys
        for k in ("grade", "posture_score", "client", "admin_gate",
                  "ip_allowlist", "channel_bindings", "recommendations"):
            assert k in d, f"missing key: {k}"
        # admin gate
        assert d["admin_gate"]["password_set"] is True
        assert d["admin_gate"]["session_secret_set"] is True
        # channel bindings per Joshua's directive
        ch = d["channel_bindings"]
        assert ch["manus"]["channel"] == "Telegram"
        assert ch["hermes"]["channel"] == "WhatsApp"
        assert ch["openclaw"]["channel"] == "Discord"

    def test_manus_wired_hermes_and_openclaw_not(self, api):
        r = api.get(f"{BASE_URL}/api/security/posture")
        ch = r.json()["channel_bindings"]
        # Manus → Telegram (creds present in .env)
        assert ch["manus"]["wired"] is True, "Manus channel should be wired (TELEGRAM env set)"
        # Hermes → WhatsApp (creds missing per .env)
        assert ch["hermes"]["wired"] is False, "Hermes should NOT be wired (WhatsApp creds missing)"
        # OpenClaw → Discord (no DISCORD_WEBHOOK_URL in .env)
        assert ch["openclaw"]["wired"] is False, "OpenClaw should NOT be wired (DISCORD_WEBHOOK_URL missing)"

    def test_posture_grade_and_score_format(self, api):
        d = api.get(f"{BASE_URL}/api/security/posture").json()
        assert d["grade"] in ("A", "B", "C", "F")
        assert "/" in d["posture_score"]


# ── 2. Ledger webhooks — new sources + auto-split ────────────────────────── #
class TestLedgerWebhooks:
    def test_buymeacoffee_autosplit(self, api):
        r = api.post(
            f"{BASE_URL}/api/ledger/webhook/buymeacoffee",
            json={"amount_usd": 100.00, "bucket": -1, "note": "TEST_iter10_bmac"},
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("auto_split") is True
        entries = {e["bucket"]: e["amount_usd"] for e in d["entries"]}
        # 10/27/63 split of $100
        assert entries[1] == 10.00, f"product reserve should be $10.00, got {entries.get(1)}"
        assert entries[3] == 27.00, f"tax bucket should be $27.00, got {entries.get(3)}"
        assert entries[5] == 63.00, f"ops bucket should be $63.00, got {entries.get(5)}"

    def test_github_sponsors_autosplit(self, api):
        r = api.post(
            f"{BASE_URL}/api/ledger/webhook/github_sponsors",
            json={"amount_usd": 50.00, "bucket": -1, "note": "TEST_iter10_ghs"},
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["auto_split"] is True
        entries = {e["bucket"]: e["amount_usd"] for e in d["entries"]}
        assert entries[1] == 5.00
        assert entries[3] == 13.50
        assert entries[5] == 31.50

    @pytest.mark.parametrize("source", ["kofi", "patreon", "gospel"])
    def test_new_sources_accepted(self, api, source):
        r = api.post(
            f"{BASE_URL}/api/ledger/webhook/{source}",
            json={"amount_usd": 5.00, "bucket": 1, "note": f"TEST_iter10_{source}"},
        )
        assert r.status_code == 200, f"{source} → {r.status_code} {r.text}"
        d = r.json()
        assert d.get("ok") is True
        assert d.get("amount_usd") == 5.00

    def test_unknown_source_rejected(self, api):
        r = api.post(
            f"{BASE_URL}/api/ledger/webhook/totally_not_a_thing",
            json={"amount_usd": 1.00, "bucket": 1},
        )
        assert r.status_code == 400
        detail = r.json().get("detail", "")
        # should mention allowed list
        for src in ("buymeacoffee", "github_sponsors", "kofi", "patreon", "gospel", "square", "alternate processor"):
            assert src in detail, f"missing '{src}' in allowed-list error: {detail}"


# ── 3. Regression: critical endpoints still green ────────────────────────── #
class TestRegression:
    def test_hermes_healthz(self, api):
        r = api.get(f"{BASE_URL}/api/hermes/healthz")
        assert r.status_code == 200
        assert "providers" in r.json()

    def test_public_products(self, api):
        r = api.get(f"{BASE_URL}/api/public/products")
        assert r.status_code == 200
        d = r.json()
        assert "products" in d or isinstance(d, dict)

    def test_public_runway(self, api):
        r = api.get(f"{BASE_URL}/api/public/runway")
        assert r.status_code == 200
        d = r.json()
        assert "runway_days" in d

    def test_ledger_stats(self, api):
        r = api.get(f"{BASE_URL}/api/ledger/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ("total_usd", "member_support_usd", "by_bucket", "by_source"):
            assert k in d

    def test_tasks_list(self, api):
        r = api.get(f"{BASE_URL}/api/tasks")
        assert r.status_code == 200

    def test_providers(self, api):
        r = api.get(f"{BASE_URL}/api/providers")
        assert r.status_code == 200
        assert "providers" in r.json()

    def test_compliance_check_admin_gated(self, api):
        # unauthenticated → 401 (admin required)
        r = api.post(f"{BASE_URL}/api/compliance/check")
        assert r.status_code in (401, 503), f"expected admin-gate, got {r.status_code}"

    def test_compliance_check_authenticated(self, admin):
        r = admin.post(f"{BASE_URL}/api/compliance/check")
        # 200 OK or 503 if Manus key missing/timeout; should not be 5xx generic
        assert r.status_code in (200, 503), f"compliance check unexpected: {r.status_code} {r.text}"

    def test_broadcast_telegram(self, admin):
        # Telegram is LIVE — this WILL ping Joshua's DM (expected per iter10 note)
        r = admin.post(
            f"{BASE_URL}/api/broadcast/telegram",
            json={"text": "TEST_iter10 regression ping · Business-only product operations"},
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True


# ── 4. Destructive IP-allowlist test (mutates .env, restarts backend) ───── #
class TestIPAllowlistDestructive:
    """
    Sets ADMIN_IP_ALLOWLIST=99.99.99.99 in /app/backend/.env, restarts backend,
    verifies admin-gated endpoint 403s, then UN-sets and verifies it works again.

    Marked last (alphabetically) so it runs after the regression block.
    """

    @staticmethod
    def _set_allowlist(value: str | None):
        text = BACKEND_ENV.read_text()
        lines = [ln for ln in text.splitlines() if not ln.startswith("ADMIN_IP_ALLOWLIST=")]
        if value is not None:
            lines.append(f"ADMIN_IP_ALLOWLIST={value}")
        BACKEND_ENV.write_text("\n".join(lines) + "\n")
        subprocess.run(["sudo", "supervisorctl", "restart", "backend"],
                       check=False, capture_output=True)
        # wait for backend to come back
        for _ in range(30):
            try:
                r = requests.get(f"{BASE_URL}/api/hermes/healthz", timeout=2)
                if r.status_code == 200:
                    return
            except Exception:
                pass
            time.sleep(1)

    def test_allowlist_blocks_then_unblocks(self):
        try:
            # 1. Lock to a bogus IP
            self._set_allowlist("99.99.99.99")
            sess = requests.Session()
            sess.headers.update({"Content-Type": "application/json"})

            # Login should STILL work (no allowlist check on login itself)
            r_login = sess.post(f"{BASE_URL}/api/auth/login",
                                json={"password": ADMIN_PASSWORD})
            assert r_login.status_code == 200, \
                f"login should NOT be allowlist-gated, got {r_login.status_code}: {r_login.text}"

            # Admin-gated POST should 403
            r_seed = sess.post(f"{BASE_URL}/api/public/products/seed")
            assert r_seed.status_code == 403, \
                f"expected 403 with bogus allowlist, got {r_seed.status_code}: {r_seed.text}"
            detail = r_seed.json().get("detail", "")
            assert "ADMIN_IP_ALLOWLIST" in detail, f"detail missing allowlist hint: {detail}"

            # security posture should also show allowlist active
            posture = sess.get(f"{BASE_URL}/api/security/posture").json()
            assert posture["ip_allowlist"]["active"] is True
            assert "99.99.99.99" in posture["ip_allowlist"]["entries"]
            assert posture["ip_allowlist"]["current_ip_allowed"] is False

            # 2. Unset allowlist
            self._set_allowlist(None)
            sess2 = requests.Session()
            sess2.headers.update({"Content-Type": "application/json"})
            sess2.post(f"{BASE_URL}/api/auth/login",
                       json={"password": ADMIN_PASSWORD})
            r_seed2 = sess2.post(f"{BASE_URL}/api/public/products/seed")
            assert r_seed2.status_code in (200, 201), \
                f"seed should succeed after allowlist removed, got {r_seed2.status_code}: {r_seed2.text}"
        finally:
            # ALWAYS reset .env even on failure
            self._set_allowlist(None)
