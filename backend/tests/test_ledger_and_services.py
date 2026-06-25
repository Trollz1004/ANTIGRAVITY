"""
Iteration 3 backend tests:
- Mission Ledger (contribute / list / stats / webhook / delete)
- Watchdog status (tier-0 agents)
- Image generation (real Nano Banana via Emergent key)
- Doctrine sweep across new endpoints
"""
import os
import time
from datetime import datetime, timezone, timedelta

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://selenium-automation-3.preview.emergentagent.com"
API = f"{BASE_URL}/api"

FORBIDDEN = ["haiku", "donate", "donation", "solicitation"]


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def mongo():
    cli = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    db = cli[os.environ.get("DB_NAME", "test_database")]
    yield db
    cli.close()


# ── Mission Ledger CRUD ─────────────────────────────────────────────────── #
class TestLedger:
    def test_contribute_ok(self, session):
        r = session.post(f"{API}/ledger/contribute", json={"amount_usd": 50, "bucket": 1, "source": "manual", "note": "TEST_iter3_a"})
        assert r.status_code == 200
        data = r.json()
        assert "id" in data and isinstance(data["id"], str)
        assert data["bucket_name"] == "Kids Fund"
        assert data["amount_usd"] == 50
        assert data["bucket"] == 1
        assert data["source"] == "manual"
        # Verify persistence via list filter
        lst = session.get(f"{API}/ledger?bucket=1").json()
        assert any(e["id"] == data["id"] for e in lst["entries"])

    def test_contribute_unknown_bucket(self, session):
        r = session.post(f"{API}/ledger/contribute", json={"amount_usd": 10, "bucket": 99, "source": "manual"})
        assert r.status_code == 422 or r.status_code == 400  # pydantic ge/le returns 422

    def test_webhook_square_cents_conversion(self, session):
        r = session.post(f"{API}/ledger/webhook/square", json={"amount_cents": 2500, "bucket": 5, "note": "TEST_iter3_sq"})
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["amount_usd"] == 25.0
        assert data["bucket"] == 5
        # Verify via list filter
        lst = session.get(f"{API}/ledger?source=square").json()
        assert any(e["id"] == data["id"] for e in lst["entries"])

    def test_webhook_unknown_source(self, session):
        r = session.post(f"{API}/ledger/webhook/badname", json={"amount_usd": 5})
        assert r.status_code == 400
        assert "unknown source" in r.json().get("detail", "").lower()

    def test_webhook_no_amount(self, session):
        r = session.post(f"{API}/ledger/webhook/square", json={"bucket": 1})
        assert r.status_code == 400

    def test_list_filters(self, session):
        a = session.get(f"{API}/ledger?bucket=1").json()
        b = session.get(f"{API}/ledger?source=square").json()
        assert all(e["bucket"] == 1 for e in a["entries"])
        assert all(e["source"] == "square" for e in b["entries"])

    def test_stats_shape(self, session):
        s = session.get(f"{API}/ledger/stats").json()
        for k in ("total_usd", "kids_fund_usd", "kids_estimate", "by_bucket", "by_source", "tag", "kids_threshold_usd"):
            assert k in s, f"missing {k}"
        assert s["tag"] == "#UntilNoKidInNeed"
        assert isinstance(s["by_bucket"], list) and len(s["by_bucket"]) == 10
        for b in s["by_bucket"]:
            assert "name" in b and "amount_usd" in b and "count" in b
        # estimate is floor division
        if s["kids_threshold_usd"]:
            assert s["kids_estimate"] == int(s["kids_fund_usd"] / s["kids_threshold_usd"])

    def test_delete_entry(self, session):
        # Create an entry and delete it
        c = session.post(f"{API}/ledger/contribute", json={"amount_usd": 1, "bucket": 2, "source": "manual", "note": "TEST_iter3_del"}).json()
        entry_id = c["id"]
        d = session.delete(f"{API}/ledger/{entry_id}")
        assert d.status_code == 200
        assert d.json()["deleted"] == entry_id
        # Verify gone
        again = session.delete(f"{API}/ledger/{entry_id}")
        assert again.status_code == 404


# ── Watchdog ────────────────────────────────────────────────────────────── #
class TestWatchdog:
    def test_watchdog_status_shape(self, session):
        r = session.get(f"{API}/watchdog/status")
        assert r.status_code == 200
        data = r.json()
        for k in ("ok", "alerts", "agents", "checked_at"):
            assert k in data
        assert isinstance(data["alerts"], list)
        assert isinstance(data["agents"], list)
        agent_names = {a["agent"] for a in data["agents"]}
        assert agent_names == {"ceo", "cfo", "cmo", "cto", "e1"}

    def test_watchdog_recent_heartbeats(self, session):
        # Backend has been running >60s — all agents should have non-null at + not stale
        data = session.get(f"{API}/watchdog/status").json()
        for a in data["agents"]:
            assert a["at"] is not None, f"{a['agent']} has no heartbeat"
            assert a["stale"] is False, f"{a['agent']} stale"

    def test_watchdog_alert_path(self, session, mongo):
        """Insert a stale heartbeat for cfo and verify alerts appear."""
        old = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
        original = mongo.heartbeats.find_one({"agent": "cfo"}, {"_id": 0})
        try:
            mongo.heartbeats.update_one({"agent": "cfo"}, {"$set": {"at": old, "agent": "cfo", "state": "alive"}}, upsert=True)
            data = session.get(f"{API}/watchdog/status").json()
            # cfo must appear in alerts
            assert any(al["agent"] == "cfo" for al in data["alerts"]), "cfo should be alerted"
            assert data["ok"] is False
        finally:
            # Restore to recent
            if original and "at" in original:
                mongo.heartbeats.update_one({"agent": "cfo"}, {"$set": original}, upsert=True)
            else:
                mongo.heartbeats.update_one({"agent": "cfo"}, {"$set": {"at": datetime.now(timezone.utc).isoformat()}}, upsert=True)


# ── Image gen (real Nano Banana call) ───────────────────────────────────── #
class TestImages:
    def test_generate_image(self, session):
        r = session.post(f"{API}/images/generate", json={"prompt": "A small orange origami rocket"}, timeout=90)
        assert r.status_code == 200, f"got {r.status_code}: {r.text[:200]}"
        data = r.json()
        # Truncate base64 — never print the full thing
        truncated = (data.get("data_uri", "") or "")[:60] + "...(truncated)"
        print(f"image record: id={data.get('id')} mime={data.get('mime_type')} model={data.get('model')} data_uri={truncated}")
        assert "id" in data
        assert data["model"] == "gemini-3.1-flash-image-preview"
        assert data["mime_type"].startswith("image/")
        assert data["data_uri"].startswith("data:image")
        assert len(data["data_uri"]) > 200  # actual image data, not just prefix

    def test_list_images_strips_data_uri(self, session):
        r = session.get(f"{API}/images?limit=5")
        assert r.status_code == 200
        body = r.json()
        assert "images" in body
        for img in body["images"]:
            assert "data_uri" not in img, "data_uri must be stripped from list response"


# ── Doctrine sweep ──────────────────────────────────────────────────────── #
class TestDoctrine:
    def test_no_forbidden_words_in_endpoints(self, session):
        endpoints = ["/ledger/stats", "/watchdog/status", "/images?limit=5"]
        for ep in endpoints:
            txt = session.get(f"{API}{ep}").text.lower()
            for word in FORBIDDEN:
                assert word not in txt, f"forbidden '{word}' found in {ep}"

    def test_providers_doctrine(self, session):
        # /api/providers comes from hub.py
        r = session.get(f"{API}/providers")
        if r.status_code == 200:
            txt = r.text.lower()
            for word in FORBIDDEN:
                assert word not in txt, f"forbidden '{word}' found in /providers"


# ── Cleanup ─────────────────────────────────────────────────────────────── #
@pytest.fixture(scope="module", autouse=True)
def cleanup(mongo):
    yield
    # Remove TEST_ prefixed entries from ledger
    try:
        mongo.ledger.delete_many({"note": {"$regex": "^TEST_iter3"}})
    except Exception:
        pass
