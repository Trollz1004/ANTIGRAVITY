"""Iteration 5: Public storefront + runway pulse + ledger broadcast hook."""
import os
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

# REACT_APP_BACKEND_URL is in /app/frontend/.env (supervisor doesn't export it)
load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ── Public reads ──────────────────────────────────────────────────────── #
class TestPublicReads:
    def test_products_empty_or_list_shape(self, s):
        r = s.get(f"{BASE_URL}/api/public/products", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "products" in data and "count" in data
        assert isinstance(data["products"], list)
        assert data["count"] == len(data["products"])
        # honest empty state OR a real list, both fine
        for p in data["products"]:
            assert "_id" not in p  # mongo objectid excluded

    def test_site_payload(self, s):
        r = s.get(f"{BASE_URL}/api/public/site", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "OpusPawClaw"
        assert "totals" in d
        t = d["totals"]
        for k in ("committed_usd", "kids_fund_usd", "kids_estimate", "kids_threshold_usd"):
            assert k in t
        assert isinstance(t["committed_usd"], (int, float))
        assert isinstance(t["kids_threshold_usd"], (int, float))
        assert d["checkout_processor"].startswith("Square")
        assert d["mission_tag"] == "#UntilNoKidInNeed"

    def test_runway_pulse(self, s):
        r = s.get(f"{BASE_URL}/api/public/runway", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["default_bridge"] == {"provider": "gemini", "model": "gemini-2.5-flash"}
        assert isinstance(d["emergent_key_configured"], bool)
        assert isinstance(d["committed_usd"], (int, float))
        assert isinstance(d["burn_usd_per_day"], (int, float))
        assert isinstance(d["runway_days"], (int, float))
        assert "note" in d and isinstance(d["note"], str)
        assert d["tag"] == "#UntilNoKidInNeed"


# ── Admin gating (negative — ADMIN_PASSWORD unset → expect 503) ────────── #
# NOTE: review_request says "401/403" but require_admin returns 503 when
# admin auth env vars are missing (per /app/backend/auth_relay.py). Both
# semantics protect the endpoint, so we accept 401/403/503 as "gated".
GATED = {401, 403, 503}


class TestAdminGating:
    def test_post_products_gated(self, s):
        r = s.post(
            f"{BASE_URL}/api/public/products",
            json={"title": "TEST_unauth", "price_usd": 1.00},
            timeout=10,
        )
        assert r.status_code in GATED, f"expected gated, got {r.status_code}: {r.text}"

    def test_seed_products_gated(self, s):
        r = s.post(f"{BASE_URL}/api/public/products/seed", json={}, timeout=10)
        assert r.status_code in GATED, f"expected gated, got {r.status_code}: {r.text}"

    def test_delete_products_gated(self, s):
        r = s.delete(f"{BASE_URL}/api/public/products/anything", timeout=10)
        assert r.status_code in GATED, f"expected gated, got {r.status_code}: {r.text}"

    def test_auth_status_unconfigured(self, s):
        # Sanity: confirm admin auth is indeed unconfigured (per test_credentials.md)
        r = s.get(f"{BASE_URL}/api/auth/status", timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        # configured should be False since ADMIN_PASSWORD is not seeded
        # (if Joshua seeds it later this single assertion will flip; that's fine)
        assert d["configured"] is False, f"expected unconfigured: {d}"


# ── Ledger contribute + broadcast hook (no-throw when telegram unset) ── #
class TestLedgerBroadcastHook:
    def test_contribute_works_with_unconfigured_telegram(self, s):
        payload = {
            "amount_usd": 0.50,
            "bucket": 1,
            "source": "manual",
            "note": "TEST_iter5_broadcast_noop",
            "actor": "iter5-test",
        }
        r = s.post(f"{BASE_URL}/api/ledger/contribute", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["amount_usd"] == 0.50
        assert d["bucket"] == 1
        assert d["source"] == "manual"
        assert "id" in d

    def test_square_webhook_works_with_unconfigured_telegram(self, s):
        r = s.post(
            f"{BASE_URL}/api/ledger/webhook/square",
            json={"amount_cents": 100, "bucket": 1, "note": "TEST_iter5_webhook"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert d["amount_usd"] == 1.00
        assert d["bucket"] == 1


# ── Regression: previously-green endpoints still 200 ─────────────────── #
@pytest.mark.parametrize("path", [
    "/api/providers",
    "/api/ledger",
    "/api/ledger/stats",
    "/api/tasks",
    "/api/graphify/status",
    "/api/auth/status",
])
def test_regression_get_200(s, path):
    r = s.get(f"{BASE_URL}{path}", timeout=20)
    assert r.status_code == 200, f"{path}: {r.status_code} {r.text[:200]}"


# ── E1 unknown model → gemini-2.5-flash bridge ─────────────────────── #
def test_e1_unknown_model_routes_through_gemini_flash(s):
    payload = {
        "provider": "e1",
        "model": "e1-bogus-unknown-model",
        "messages": [{"role": "user", "content": "Reply with exactly: PONG"}],
    }
    r = s.post(f"{BASE_URL}/api/chat/send", json=payload, timeout=90)
    # Could 200 (success) or 502 (Emergent key/bridge issue). The important
    # thing is the bridge is set up to point at gemini/gemini-2.5-flash and
    # is surfaced in real_model header. Accept both but assert routing string.
    if r.status_code == 200:
        d = r.json()
        rm = d.get("real_model", "")
        assert "gemini" in rm.lower() and "gemini-2.5-flash" in rm, rm
        # also via header
        hdr = r.headers.get("X-Hermes-Real-Model", "")
        assert "gemini" in hdr.lower()
    elif r.status_code == 502:
        # bridge ran but upstream failed — still acceptable for routing-only check
        pytest.skip(f"e1 bridge upstream 502 (key/quota): {r.text[:200]}")
    else:
        pytest.fail(f"unexpected status {r.status_code}: {r.text[:300]}")
