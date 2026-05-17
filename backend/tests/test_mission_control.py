"""
Mission Control backend regression tests.

Covers:
  - /api/ identity
  - /api/hermes/healthz
  - /api/hermes/v1/chat/completions (real Emergent bridge)
  - /api/paperclip/health
  - /api/agents (6 agents, no "Haiku")
  - /api/system/status (6 services)
  - /api/dao/stats (4 tokens cap=2_500_000, 10 buckets)
  - /api/mission/metrics (tag='#UntilNoKidInNeed')
  - /api/git/status (no truncated filenames)
  - Doctrine: no forbidden strings ('donate','donation','solicitation','Haiku') in any JSON response
"""
from __future__ import annotations

import json
import os
import re
import time

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or ""
# allow local fallback for dev-only runs
if not BASE_URL:
    env_path = "/app/frontend/.env"
    with open(env_path) as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip()
                break
BASE_URL = BASE_URL.rstrip("/")

FORBIDDEN = ("haiku", "donate", "donation", "solicitation")


def _assert_no_forbidden(txt: str, where: str):
    lower = txt.lower()
    for bad in FORBIDDEN:
        assert bad not in lower, f"forbidden word '{bad}' found in {where}"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- identity / root ---------- #
def test_root_identity(api):
    r = api.get(f"{BASE_URL}/api/", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data.get("service") == "opuspawclaw-mission-control"
    assert "#UntilNoKidInNeed" in data.get("message", "")
    _assert_no_forbidden(json.dumps(data), "/api/")


# ---------- hermes ---------- #
def test_hermes_healthz(api):
    r = api.get(f"{BASE_URL}/api/hermes/healthz", timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert d["ok"] is True
    expected = {"hermes", "hermes-deep", "cfo", "code", "marketing", "kimi", "fast"}
    assert set(d["virtual_models"]) == expected
    assert isinstance(d["providers"], list) and len(d["providers"]) > 0
    _assert_no_forbidden(json.dumps(d), "/api/hermes/healthz")


def test_hermes_chat_completions_fast(api):
    payload = {
        "model": "fast",
        "messages": [
            {"role": "system", "content": "You are Opus, brief."},
            {"role": "user", "content": "Reply with exactly the word: READY"},
        ],
    }
    r = api.post(f"{BASE_URL}/api/hermes/v1/chat/completions", json=payload, timeout=60)
    assert r.status_code == 200, r.text
    # expose-headers must surface the three meta headers
    assert r.headers.get("X-Hermes-Provider")
    assert r.headers.get("X-Hermes-Real-Model")
    assert r.headers.get("X-Hermes-Latency-Ms")
    d = r.json()
    content = d["choices"][0]["message"]["content"]
    assert isinstance(content, str) and len(content) > 0
    _assert_no_forbidden(json.dumps(d) + " " + " ".join(r.headers.values()),
                         "/api/hermes/v1/chat/completions")


def test_hermes_chat_completions_unknown_model(api):
    payload = {"model": "does-not-exist", "messages": [{"role": "user", "content": "hi"}]}
    r = api.post(f"{BASE_URL}/api/hermes/v1/chat/completions", json=payload, timeout=15)
    assert r.status_code == 400
    detail = r.json().get("detail", "")
    assert "unknown virtual model" in detail
    # Must list the known models
    for m in ("fast", "hermes", "cfo", "code"):
        assert m in detail


# ---------- paperclip ---------- #
def test_paperclip_health(api):
    r = api.get(f"{BASE_URL}/api/paperclip/health", timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert d["ok"] is True
    assert d["source"] == "mirror"
    for k in ("deploy_time", "commit", "tunnel_id", "tunnel_config"):
        assert k in d, f"missing {k}"
    _assert_no_forbidden(json.dumps(d), "/api/paperclip/health")


# ---------- agents ---------- #
def test_agents_six_no_haiku(api):
    r = api.get(f"{BASE_URL}/api/agents", timeout=10)
    assert r.status_code == 200
    d = r.json()
    agents = d["agents"]
    assert len(agents) == 6
    names = {a["name"] for a in agents}
    assert names == {"OpenClaw", "Claude", "Codex", "OpenCode", "Droid", "Pi"}
    _assert_no_forbidden(json.dumps(d), "/api/agents")


# ---------- system status ---------- #
def test_system_status_six_services(api):
    r = api.get(f"{BASE_URL}/api/system/status", timeout=10)
    assert r.status_code == 200
    services = r.json()["services"]
    assert len(services) == 6
    names = {s["name"] for s in services}
    assert names == {"HERMES ROUTER", "PAPERCLIP WORKER", "OPENCODE", "GH COPILOT", "GCR", "OLLAMA CLOUD"}


# ---------- dao ---------- #
def test_dao_stats_shape(api):
    r = api.get(f"{BASE_URL}/api/dao/stats", timeout=10)
    assert r.status_code == 200
    d = r.json()
    tokens = d["tokens"]
    assert len(tokens) == 4
    symbols = {t["symbol"] for t in tokens}
    assert symbols == {"LOVE", "UKID", "GREEN", "AGRAV"}
    for t in tokens:
        assert t["cap"] == 2_500_000
    assert len(d["buckets"]) == 10
    _assert_no_forbidden(json.dumps(d), "/api/dao/stats")


# ---------- mission metrics ---------- #
def test_mission_metrics_tag(api):
    r = api.get(f"{BASE_URL}/api/mission/metrics", timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert d["tag"] == "#UntilNoKidInNeed"
    _assert_no_forbidden(json.dumps(d), "/api/mission/metrics")


# ---------- git status ---------- #
def test_git_status_no_truncation(api):
    r = api.get(f"{BASE_URL}/api/git/status", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert isinstance(d.get("current"), str) and d["current"]
    assert isinstance(d.get("modified"), list)
    assert isinstance(d.get("not_added"), list)
    # Filenames must not have lost their first character
    for p in d["modified"] + d["not_added"]:
        assert not p.startswith(tuple("/")), f"path leading slash unexpected: {p}"
        # common filenames that must be intact (never start with truncated letter)
        if p.startswith("ackend/") or p.startswith("rontend/"):
            pytest.fail(f"truncated filename detected: {p}")


# ---------- global doctrine sweep ---------- #
def test_no_forbidden_strings_across_endpoints(api):
    endpoints = [
        "/api/",
        "/api/hermes/healthz",
        "/api/paperclip/health",
        "/api/agents",
        "/api/system/status",
        "/api/dao/stats",
        "/api/mission/metrics",
        "/api/git/status",
    ]
    for ep in endpoints:
        r = api.get(f"{BASE_URL}{ep}", timeout=15)
        assert r.status_code == 200, f"{ep} -> {r.status_code}"
        _assert_no_forbidden(r.text, ep)
