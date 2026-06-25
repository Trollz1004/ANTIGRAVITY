"""
Iteration-2 regression: hub.py (multi-platform chat + broadcast) + tasks.py
(internal task system).

Covers:
  - GET /api/providers (12 platforms, tier metadata, broadcast block)
  - POST /api/chat/send (hermes 'fast' real bridge + headers)
  - POST /api/chat/send (BYOK with no key → 503 with env var hint)
  - POST /api/broadcast/telegram + /api/broadcast/whatsapp (graceful unconfigured)
  - GET /api/tasks/agents (12 agents)
  - Tasks CRUD + dispatch + audit + stats + heartbeat
  - Filters: status / owner / bucket
  - Doctrine sweep across new endpoints (no Haiku/donate/donation/solicitation)
"""
from __future__ import annotations

import json
import os

import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

FORBIDDEN = ("haiku", "donate", "donation", "solicitation")


def _no_forbidden(txt: str, where: str) -> None:
    low = txt.lower()
    for w in FORBIDDEN:
        assert w not in low, f"forbidden '{w}' in {where}"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created_task_ids():
    """Track ids created in this module so we can cleanup at end."""
    return []


# ── /api/providers ──────────────────────────────────────────────── #
def test_providers_lists_twelve_platforms(api):
    r = api.get(f"{BASE_URL}/api/providers", timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    ids = {p["id"] for p in d["providers"]}
    expected = {
        "hermes", "emergent", "claude", "openai", "gemini", "grok",
        "perplexity", "openrouter", "genspark", "manus", "openclaw", "ollama",
    }
    assert ids == expected, f"missing/extra: {expected ^ ids}"
    # tier + color + models + ready required
    for p in d["providers"]:
        assert p["tier"] in ("emergent", "byok", "local")
        assert p["color"].startswith("#")
        assert isinstance(p["models"], list) and len(p["models"]) > 0
        assert "ready" in p
        assert isinstance(p["description"], str)
    # broadcast.{telegram,whatsapp}.configured
    bc = d["broadcast"]
    assert "telegram" in bc and "whatsapp" in bc
    assert "configured" in bc["telegram"]
    assert "configured" in bc["whatsapp"]
    _no_forbidden(json.dumps(d), "/api/providers")


# ── POST /api/chat/send ────────────────────────────────────────── #
def test_chat_send_hermes_fast_real_bridge(api):
    payload = {
        "provider": "hermes",
        "model": "fast",
        "messages": [{"role": "user", "content": "Reply with one word: ready"}],
    }
    r = api.post(f"{BASE_URL}/api/chat/send", json=payload, timeout=60)
    assert r.status_code == 200, r.text
    assert r.headers.get("X-Hermes-Provider") == "hermes"
    assert r.headers.get("X-Hermes-Real-Model")
    assert r.headers.get("X-Hermes-Latency-Ms")
    d = r.json()
    content = d["choices"][0]["message"]["content"]
    assert isinstance(content, str) and len(content) > 0
    _no_forbidden(json.dumps(d), "/api/chat/send hermes")


def test_chat_send_byok_missing_key_returns_503(api):
    # XAI_API_KEY is intentionally blank
    payload = {
        "provider": "grok",
        "model": "grok-4-fast",
        "messages": [{"role": "user", "content": "ping"}],
    }
    r = api.post(f"{BASE_URL}/api/chat/send", json=payload, timeout=15)
    assert r.status_code == 503, f"expected 503, got {r.status_code}: {r.text}"
    detail = r.json().get("detail", "")
    assert "XAI_API_KEY" in detail


def test_chat_send_unknown_provider(api):
    r = api.post(
        f"{BASE_URL}/api/chat/send",
        json={"provider": "nope", "model": "x", "messages": [{"role": "user", "content": "hi"}]},
        timeout=10,
    )
    assert r.status_code == 400


# ── Broadcast ──────────────────────────────────────────────────── #
def test_broadcast_telegram_unconfigured_graceful(api):
    r = api.post(f"{BASE_URL}/api/broadcast/telegram",
                 json={"text": "hello", "source": "pytest"}, timeout=10)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["ok"] is False
    assert d["configured"] is False
    assert "hint" in d


def test_broadcast_whatsapp_unconfigured_graceful(api):
    r = api.post(f"{BASE_URL}/api/broadcast/whatsapp",
                 json={"text": "hello", "source": "pytest"}, timeout=10)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["ok"] is False
    assert d["configured"] is False
    assert "hint" in d


# ── /api/tasks/agents ──────────────────────────────────────────── #
def test_tasks_agents_twelve(api):
    r = api.get(f"{BASE_URL}/api/tasks/agents", timeout=10)
    assert r.status_code == 200, r.text
    d = r.json()
    agents = d["agents"]
    ids = {a["id"] for a in agents}
    expected = {"ceo", "cfo", "cmo", "cto", "intern-1", "intern-2",
                "openclaw", "claude", "codex", "opencode", "droid", "pi"}
    assert ids == expected
    for a in agents:
        assert "task_cap" in a
        assert "active_tasks" in a
    _no_forbidden(json.dumps(d), "/api/tasks/agents")


# ── Tasks CRUD ─────────────────────────────────────────────────── #
def test_create_task_then_get(api, created_task_ids):
    payload = {"title": "TEST_create_task", "owner": "cto", "priority": "p1", "bucket": 4}
    r = api.post(f"{BASE_URL}/api/tasks", json=payload, timeout=10)
    assert r.status_code == 200, r.text
    t = r.json()
    assert t["status"] == "open"
    assert t["owner"] == "cto"
    assert t["bucket"] == 4
    assert isinstance(t["id"], str) and len(t["id"]) >= 8
    created_task_ids.append(t["id"])

    # confirm persistence via list
    r2 = api.get(f"{BASE_URL}/api/tasks?owner=cto", timeout=10)
    assert r2.status_code == 200
    ids = {x["id"] for x in r2.json()["tasks"]}
    assert t["id"] in ids


def test_create_task_unknown_owner(api):
    r = api.post(f"{BASE_URL}/api/tasks",
                 json={"title": "TEST_bad_owner", "owner": "ghost"}, timeout=10)
    assert r.status_code == 400


def test_dispatch_fanout(api, created_task_ids):
    payload = {
        "title": "TEST_dispatch_Y",
        "owners": ["cmo", "intern-1", "intern-2"],
        "priority": "p1",
    }
    r = api.post(f"{BASE_URL}/api/tasks/dispatch", json=payload, timeout=10)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["dispatched"] == 3
    assert len(d["tasks"]) == 3
    owners = {t["owner"] for t in d["tasks"]}
    assert owners == {"cmo", "intern-1", "intern-2"}
    for t in d["tasks"]:
        assert t["status"] == "open"
        created_task_ids.append(t["id"])


def test_patch_task_audit(api, created_task_ids):
    assert created_task_ids, "previous test must have created a task"
    tid = created_task_ids[0]
    r = api.patch(f"{BASE_URL}/api/tasks/{tid}",
                  json={"status": "in_progress", "note": "kicking off"}, timeout=10)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "in_progress"

    # audit shows newest-first with this task_id
    a = api.get(f"{BASE_URL}/api/tasks/audit?task_id={tid}", timeout=10)
    assert a.status_code == 200
    entries = a.json()["entries"]
    assert any(e["action"] == "update" for e in entries)
    assert any(e["action"] == "create" for e in entries)


def test_filters_status_owner_bucket(api):
    r = api.get(f"{BASE_URL}/api/tasks?status=open", timeout=10)
    assert r.status_code == 200
    for t in r.json()["tasks"]:
        assert t["status"] == "open"

    r = api.get(f"{BASE_URL}/api/tasks?owner=cto", timeout=10)
    for t in r.json()["tasks"]:
        assert t["owner"] == "cto"

    r = api.get(f"{BASE_URL}/api/tasks?bucket=4", timeout=10)
    for t in r.json()["tasks"]:
        assert t["bucket"] == 4


def test_audit_log_newest_first(api):
    r = api.get(f"{BASE_URL}/api/tasks/audit?limit=20", timeout=10)
    assert r.status_code == 200
    entries = r.json()["entries"]
    assert len(entries) >= 2
    times = [e["at"] for e in entries]
    assert times == sorted(times, reverse=True)


def test_stats_shape(api):
    r = api.get(f"{BASE_URL}/api/tasks/stats", timeout=10)
    assert r.status_code == 200
    d = r.json()
    for s in ("open", "in_progress", "blocked", "done", "archived"):
        assert s in d["by_status"]
    for p in ("p0", "p1", "p2"):
        assert p in d["by_priority"]
    assert len(d["by_bucket"]) == 10
    assert {b["bucket"] for b in d["by_bucket"]} == set(range(1, 11))
    assert "total" in d and "active" in d


def test_heartbeat_surfaces_in_agents(api):
    r = api.post(f"{BASE_URL}/api/tasks/agents/cto/heartbeat",
                 json={"state": "alive", "note": "wiring deploy"}, timeout=10)
    assert r.status_code == 200, r.text
    assert r.json()["agent"] == "cto"

    r2 = api.get(f"{BASE_URL}/api/tasks/agents", timeout=10)
    cto = next(a for a in r2.json()["agents"] if a["id"] == "cto")
    assert cto["heartbeat"] is not None
    assert cto["heartbeat"]["note"] == "wiring deploy"


def test_heartbeat_unknown_agent(api):
    r = api.post(f"{BASE_URL}/api/tasks/agents/nobody/heartbeat",
                 json={"state": "alive"}, timeout=10)
    assert r.status_code == 404


# ── Cleanup + DELETE verification ─────────────────────────────── #
def test_delete_task_and_audit(api, created_task_ids):
    assert created_task_ids
    tid = created_task_ids.pop()
    r = api.delete(f"{BASE_URL}/api/tasks/{tid}", timeout=10)
    assert r.status_code == 200
    # confirm gone
    r2 = api.patch(f"{BASE_URL}/api/tasks/{tid}", json={"status": "done"}, timeout=10)
    assert r2.status_code == 404
    # audit has delete entry
    a = api.get(f"{BASE_URL}/api/tasks/audit?task_id={tid}", timeout=10)
    assert any(e["action"] == "delete" for e in a.json()["entries"])


def test_cleanup_remaining(api, created_task_ids):
    """Best-effort cleanup of TEST_-prefixed tasks created above."""
    while created_task_ids:
        tid = created_task_ids.pop()
        api.delete(f"{BASE_URL}/api/tasks/{tid}", timeout=10)


# ── Doctrine sweep on new endpoints ──────────────────────────── #
def test_no_forbidden_strings_new_endpoints(api):
    for ep in ("/api/providers", "/api/tasks/agents", "/api/tasks/stats",
               "/api/tasks/audit", "/api/broadcast/status"):
        r = api.get(f"{BASE_URL}{ep}", timeout=15)
        assert r.status_code == 200, f"{ep} -> {r.status_code}"
        _no_forbidden(r.text, ep)
