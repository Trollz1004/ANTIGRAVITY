#!/usr/bin/env python3
"""Paperclip MCP server.

Exposes paperclip-adapters (interactive agent launchers) and the local
LiteLLM gateway (one-shot routing to ollama/cloud) as MCP tools so Codex,
Claude Code, and Gemini CLI can list / launch / route between agent
backends from any session — all anchored to C:\ANTIGRAVITY.

Facts-only: no silent fallbacks. If a backend is missing or a call fails,
the literal error is returned to the caller.
"""

from __future__ import annotations

import os
import sqlite3
import subprocess
from pathlib import Path
from urllib.parse import urlparse

import httpx
from mcp.server.fastmcp import FastMCP

ROOT = Path(os.environ.get("ANTIGRAVITY_ROOT", r"C:\ANTIGRAVITY"))
ADAPTERS = ROOT / "paperclip-adapters"
STATE = ROOT / "paperclip-mcp" / ".state"
STATE.mkdir(parents=True, exist_ok=True)
DEFAULT_FILE = STATE / "default_backend.txt"
UPSTREAM_DB = STATE / "upstream_registry.db"

LITELLM_BASE = os.environ.get("LITELLM_BASE_URL", "http://127.0.0.1:4000")

# Derive host/port from LITELLM_BASE for upstream seeding
_parsed = urlparse(LITELLM_BASE)
LITELLM_HOST = _parsed.hostname or "127.0.0.1"
LITELLM_PORT = _parsed.port or 4000

mcp = FastMCP("paperclip")

# ---------------------------------------------------------------------------
# Upstream citation registry — sqlite3 stdlib only, self-hosted ONLY.
# The Cloudflare Worker (infra/paperclip-worker/) must NOT gain this routing.
# ---------------------------------------------------------------------------

_SCHEMA = """
CREATE TABLE IF NOT EXISTS upstream_sources (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    route_name  TEXT NOT NULL UNIQUE,
    upstream    TEXT NOT NULL,
    description TEXT,
    added_at    TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS cite_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    route_name  TEXT NOT NULL,
    called_at   TEXT DEFAULT (datetime('now')),
    caller_hint TEXT
);
CREATE INDEX IF NOT EXISTS idx_cite_log_route ON cite_log(route_name);
"""


def _init_upstream_db() -> None:
    """Create upstream_registry.db and apply schema if not already present."""
    STATE.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(str(UPSTREAM_DB))
    try:
        con.executescript(_SCHEMA)
        con.commit()
    finally:
        con.close()


def _log_cite(route_name: str, caller_hint: str | None) -> None:
    """Insert a cite_log row. Silently swallows all errors — must never break a tool call."""
    try:
        con = sqlite3.connect(str(UPSTREAM_DB))
        try:
            con.execute(
                "INSERT INTO cite_log (route_name, caller_hint) VALUES (?, ?)",
                (route_name, caller_hint),
            )
            con.commit()
        finally:
            con.close()
    except Exception:
        pass


def _record_upstream(route_name: str, upstream: str, description: str | None) -> None:
    """Upsert a row in upstream_sources (INSERT OR REPLACE)."""
    con = sqlite3.connect(str(UPSTREAM_DB))
    try:
        con.execute(
            "INSERT OR REPLACE INTO upstream_sources (route_name, upstream, description) "
            "VALUES (?, ?, ?)",
            (route_name, upstream, description),
        )
        con.commit()
    finally:
        con.close()


# Initialise DB and seed default upstreams at import time.
_init_upstream_db()
_litellm_upstream = f"litellm://{LITELLM_HOST}:{LITELLM_PORT}"
_record_upstream("complete", _litellm_upstream, "LiteLLM gateway for chat completions")
_record_upstream("list_models", _litellm_upstream, "LiteLLM model catalog")
_record_upstream("launch_backend", "local://paperclip-adapters", "Spawns adapter scripts")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _adapter_path(name: str) -> Path:
    p = ADAPTERS / f"{name}.cmd"
    if not p.exists():
        raise FileNotFoundError(f"adapter not found: {p}")
    return p


# ---------------------------------------------------------------------------
# Existing tools
# ---------------------------------------------------------------------------


@mcp.tool()
def list_backends() -> dict:
    """List all paperclip adapter launchers available on disk.

    Returns one entry per .cmd file in paperclip-adapters/.
    """
    if not ADAPTERS.exists():
        return {"ok": False, "error": f"adapters dir missing: {ADAPTERS}"}
    backends = sorted(p.stem for p in ADAPTERS.glob("*.cmd"))
    return {"ok": True, "adapters_dir": str(ADAPTERS), "backends": backends}


@mcp.tool()
def launch_backend(backend: str, extra_args: list[str] | None = None) -> dict:
    """Open a new console window running the named adapter in C:\\ANTIGRAVITY.

    Use this to drop into an interactive agent session (codex, claude,
    gemini, opencode, hermes, pi, etc.) that operates on the antigravity
    workspace. Returns the spawned PID — does not capture stdout.
    """
    _log_cite("launch_backend", None)
    try:
        adapter = _adapter_path(backend)
    except FileNotFoundError as e:
        return {"ok": False, "error": str(e)}
    args = list(extra_args or [])
    cmd = ["cmd", "/c", "start", "", "/D", str(ROOT), "cmd", "/k", str(adapter), *args]
    proc = subprocess.Popen(cmd, cwd=str(ROOT))
    return {"ok": True, "backend": backend, "pid": proc.pid, "cwd": str(ROOT)}


@mcp.tool()
def health_check(backend: str) -> dict:
    """Verify an adapter exists and report the underlying exec line."""
    try:
        adapter = _adapter_path(backend)
    except FileNotFoundError as e:
        return {"ok": False, "error": str(e)}
    text = adapter.read_text(errors="replace")
    exec_line = next(
        (
            ln.strip()
            for ln in text.splitlines()
            if ln.strip().lower().startswith(("call ", '"'))
        ),
        None,
    )
    return {
        "ok": True,
        "backend": backend,
        "adapter_path": str(adapter),
        "exec_line": exec_line,
    }


@mcp.tool()
def swap_default(backend: str) -> dict:
    """Set the session-default backend (persisted to disk for any client)."""
    try:
        _adapter_path(backend)
    except FileNotFoundError as e:
        return {"ok": False, "error": str(e)}
    DEFAULT_FILE.write_text(backend, encoding="utf-8")
    return {"ok": True, "default": backend, "path": str(DEFAULT_FILE)}


@mcp.tool()
def get_default() -> dict:
    """Return the currently-set default backend, or None."""
    if not DEFAULT_FILE.exists():
        return {"default": None}
    return {"default": DEFAULT_FILE.read_text(encoding="utf-8").strip()}


@mcp.tool()
def list_models() -> dict:
    """List models exposed by the local LiteLLM gateway."""
    try:
        r = httpx.get(f"{LITELLM_BASE}/v1/models", timeout=10.0)
        r.raise_for_status()
        return {"ok": True, "data": r.json()}
    except Exception as e:
        return {"ok": False, "error": f"{type(e).__name__}: {e}", "base": LITELLM_BASE}


@mcp.tool()
def complete(prompt: str, model: str = "gemma4:latest", system: str | None = None) -> dict:
    """One-shot chat completion via the local LiteLLM gateway.

    Routes to ollama / cloud backends per litellm-config.yaml. Returns the
    completion content on success or the literal error on failure.
    """
    _log_cite("complete", None)
    msgs: list[dict] = []
    if system:
        msgs.append({"role": "system", "content": system})
    msgs.append({"role": "user", "content": prompt})
    payload = {"model": model, "messages": msgs}
    try:
        r = httpx.post(
            f"{LITELLM_BASE}/v1/chat/completions",
            json=payload,
            timeout=120.0,
        )
        r.raise_for_status()
        data = r.json()
        return {
            "ok": True,
            "model": model,
            "content": data["choices"][0]["message"]["content"],
            "raw": data,
        }
    except Exception as e:
        return {"ok": False, "error": f"{type(e).__name__}: {e}", "model": model}


# ---------------------------------------------------------------------------
# New citation-registry tools (self-hosted paperclip ONLY)
# ---------------------------------------------------------------------------


@mcp.tool()
def cite_upstream(route_name: str, upstream: str, description: str = "") -> dict:
    """Record (or update) the upstream source for a named route.

    Persists to .state/upstream_registry.db.
    Returns confirmation of what was stored.
    """
    _record_upstream(route_name, upstream, description or None)
    return {"ok": True, "route": route_name, "upstream": upstream}


@mcp.tool()
def list_upstreams() -> dict:
    """List all registered upstream sources with recent cite counts.

    Returns every row from upstream_sources plus a per-route count of the
    last 100 cite_log entries so callers can see which routes are active.
    """
    con = sqlite3.connect(str(UPSTREAM_DB))
    con.row_factory = sqlite3.Row
    try:
        sources = [dict(r) for r in con.execute(
            "SELECT id, route_name, upstream, description, added_at "
            "FROM upstream_sources ORDER BY route_name"
        ).fetchall()]

        # Count recent cite_log hits (last 100 rows) per route.
        recent_counts: dict[str, int] = {}
        rows = con.execute(
            "SELECT route_name, COUNT(*) as cnt "
            "FROM (SELECT route_name FROM cite_log ORDER BY id DESC LIMIT 100) "
            "GROUP BY route_name"
        ).fetchall()
        for row in rows:
            recent_counts[row["route_name"]] = row["cnt"]

        for src in sources:
            src["recent_cite_count"] = recent_counts.get(src["route_name"], 0)

        return {"ok": True, "upstreams": sources, "total": len(sources)}
    finally:
        con.close()


if __name__ == "__main__":
    mcp.run()
