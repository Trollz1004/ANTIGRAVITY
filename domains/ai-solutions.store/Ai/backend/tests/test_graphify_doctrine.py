"""Iteration 4 tests — Graphify + Doctrine + Node Identity + Stripe-410 webhook.

Covers Joshua's GLOBAL SYSTEM DIRECTIVE (Graphify integration, persistent
memory, for-profit LLC 10% hard cap, Square-only payments, Stripe dead)."""
from __future__ import annotations

import os
import re

import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s

# ── Graphify status ──────────────────────────────────────────────────────
class TestGraphifyStatus:
    def test_status_shape(self, client):
        r = client.get(f"{API}/graphify/status", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["installed"] is True
        assert data["package"] == "graphifyy"
        assert data["graph_present"] is True
        summary = data["summary"]
        assert summary["node_count"] > 0
        assert summary["edge_count"] > 0
        assert summary["communities"] > 0
        assert isinstance(summary["by_kind"], dict) and len(summary["by_kind"]) > 0
        staleness = data["staleness"]
        assert "stale" in staleness and isinstance(staleness["stale"], bool)
        assert "graph_mtime" in staleness

# ── Graphify regraph ─────────────────────────────────────────────────────
class TestGraphifyRegraph:
    def test_regraph_completes(self, client):
        r = client.post(f"{API}/graphify/regraph", json={}, timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert "duration_s" in data and data["duration_s"] is not None
        assert "at" in data

    def test_status_fresh_after_regraph(self, client):
        r = client.get(f"{API}/graphify/status", timeout=15)
        assert r.status_code == 200
        assert r.json()["staleness"]["stale"] is False

# ── Doctrine ─────────────────────────────────────────────────────────────
class TestDoctrine:
    def test_doctrine_payload(self, client):
        r = client.get(f"{API}/doctrine", timeout=10)
        assert r.status_code == 200
        d = r.json()
        # Forbidden words
        fw = [w.lower() for w in d["forbidden_words_in_ui"]]
        for w in ("", "haiku", "payment", "payment", "outreach"):
            assert w in fw, f"'{w}' missing from forbidden_words_in_ui"
        # Revenue doctrine
        rd = d["revenue_doctrine"]
        assert rd["hard_cap_pct"] == 10
        assert rd["entity_type"] == "for-profit LLC"
        assert "§496.405" in rd["fl_compliance"]
        for w in ("payment", "payment", ""):
            assert w in rd["fl_compliance"].lower()
        assert rd["mission_surface_rule"] == "Mission revealed on receipts only."
        # Infrastructure doctrine
        infra = d["infrastructure_doctrine"]
        assert "Square" in infra["payments_live"] and "LY5GN09F5AN83" in infra["payments_live"]
        assert any("Stripe" in x and "410" in x for x in infra["payments_dead"])
        assert infra["hosting"] == "Cloudflare only. Netlify banned."
        assert "jules-cli.py" in infra["orchestration"]
        assert infra["founding_four_peer_level"] == ["Claude", "Gemini", "Perplexity", "Grok"]
        assert "None command the others" in infra["peer_rule"]
        assert d["sole_authority"] == "Joshua Coleman (Founder)"

# ── Node identity ────────────────────────────────────────────────────────
class TestNodeIdentity:
    def test_identity_payload(self, client):
        r = client.get(f"{API}/node/identity", timeout=10)
        assert r.status_code == 200
        data = r.json()
        tn = data["this_node"]
        assert tn["hostname"] and isinstance(tn["ip_addresses"], list)
        role = tn["role"].lower()
        assert "emergent cloud preview" in role
        assert "not on the 192.168.0.* lan".lower() in role or "not on the 192.168.0" in role
        assert "not authoritative" in role
        topo = data["topology"]
        assert len(topo) == 3
        names = [n["name"] for n in topo]
        assert names == ["SABRETOOTH", "T5500", "9020"]
        assert "Trollz1004/ANTIGRAVITY" in data["repos"]["canonical"]
        assert "Sandbox-REPO-NEW-CODE-NOTHING-NEW-GOES-ON-ANTIGRAVITY" in data["repos"]["sandbox"]

# ── Ledger webhooks (Stripe 410, unknown 400, Square 200) ────────────────
class TestLedgerWebhooks:
    def test_stripe_is_dead_410(self, client):
        r = client.post(f"{API}/ledger/webhook/stripe", json={"amount_usd": 10}, timeout=10)
        assert r.status_code == 410
        detail = r.json().get("detail", "").lower()
        assert "stripe is dead" in detail
        assert "square" in detail
        assert "ly5gn09f5an83" in detail

    def test_paypal_unknown_source_400(self, client):
        r = client.post(f"{API}/ledger/webhook/paypal", json={"amount_usd": 10}, timeout=10)
        assert r.status_code == 400
        assert "unknown source" in r.json()["detail"].lower()

    def test_square_webhook_cents_works(self, client):
        r = client.post(f"{API}/ledger/webhook/square", json={"amount_cents": 5000, "note": "TEST_iter4_square"}, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["amount_usd"] == 50.0
        assert data["bucket"] == 1

# ── Doctrine sweep — forbidden words must NOT appear in user-facing API output
FORBIDDEN = ["payment", "payment", "", "outreach", "haiku"]

def _sweep(text: str) -> list[str]:
    found = []
    low = text.lower()
    for w in FORBIDDEN:
        if re.search(rf"\b{re.escape(w)}\b", low):
            found.append(w)
    return found

class TestDoctrineSweep:
    @pytest.mark.parametrize("path", [
        "/providers", "/tasks/agents", "/ledger/stats", "/dao/stats",
        "/system/status", "/mission/metrics", "/agents", "/node/identity",
    ])
    def test_endpoint_clean(self, client, path):
        r = client.get(f"{API}{path}", timeout=15)
        assert r.status_code == 200, f"{path} returned {r.status_code}"
        found = _sweep(r.text)
        assert not found, f"{path} leaked forbidden words: {found}"

    def test_doctrine_endpoint_only_in_allowed_locations(self, client):
        """The /doctrine endpoint intentionally lists forbidden words inside
        forbidden_words_in_ui and replacement_wording — that is allowed."""
        r = client.get(f"{API}/doctrine", timeout=10)
        assert r.status_code == 200
        data = r.json()
        # Remove the allowed locations and sweep the rest.
        sanitized = dict(data)
        sanitized.pop("forbidden_words_in_ui", None)
        sanitized.pop("replacement_wording", None)
        import json as _json
        found = _sweep(_json.dumps(sanitized))
        # fl_compliance legitimately names them as prohibited — allow inside that string.
        # So we also strip fl_compliance before asserting the rest is clean.
        if found:
            rd = sanitized.get("revenue_doctrine", {})
            rd.pop("fl_compliance", None)
            found = _sweep(_json.dumps(sanitized))
        assert not found, f"/doctrine leaked forbidden words outside allow-list: {found}"

# ── Regression spot-checks ───────────────────────────────────────────────
class TestRegression:
    def test_providers_13(self, client):
        r = client.get(f"{API}/providers", timeout=10)
        assert r.status_code == 200
        data = r.json()
        providers = data.get("providers") or data
        assert isinstance(providers, list)
        assert len(providers) == 13

    def test_tasks_stats(self, client):
        r = client.get(f"{API}/tasks/stats", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), dict)

    def test_ledger_stats(self, client):
        r = client.get(f"{API}/ledger/stats", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert "total_usd" in d and "kids_fund_usd" in d

    def test_watchdog_status(self, client):
        r = client.get(f"{API}/watchdog/status", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data.get("ok") in (True, False) or "agents" in data or "heartbeats" in data
