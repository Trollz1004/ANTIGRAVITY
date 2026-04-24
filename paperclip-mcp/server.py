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
import subprocess
from pathlib import Path

import httpx
from mcp.server.fastmcp import FastMCP

ROOT = Path(os.environ.get("ANTIGRAVITY_ROOT", r"C:\ANTIGRAVITY"))
ADAPTERS = ROOT / "paperclip-adapters"
STATE = ROOT / "paperclip-mcp" / ".state"
STATE.mkdir(parents=True, exist_ok=True)
DEFAULT_FILE = STATE / "default_backend.txt"

LITELLM_BASE = os.environ.get("LITELLM_BASE_URL", "http://127.0.0.1:4000")

mcp = FastMCP("paperclip")


def _adapter_path(name: str) -> Path:
    p = ADAPTERS / f"{name}.cmd"
    if not p.exists():
        raise FileNotFoundError(f"adapter not found: {p}")
    return p


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
    gemini, opencode, hermes, etc.) that operates on the antigravity
    workspace. Returns the spawned PID — does not capture stdout.
    """
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


if __name__ == "__main__":
    mcp.run()
