"""
Admin sign-in + Sabretooth dev-node SSH relay.

Sign-in: per directive ("admin dashboard must require sign in"). Simple HMAC
session token. Joshua sets ADMIN_PASSWORD + ADMIN_SESSION_SECRET in
/app/backend/.env; the frontend gates the dashboard behind sign-in. If
ADMIN_PASSWORD is empty, /api/auth/status reports unconfigured and the UI
shows an honest "auth not configured — set ADMIN_PASSWORD" banner. NO
trust-me-bro: empty password is never silently accepted.

Sabretooth relay: posts a single shell command to the Sabretooth dev node
(192.168.0.8) via SSH. Requires SABRETOOTH_USER + SABRETOOTH_KEY_PATH (or
fallback to ~/.ssh/id_rsa) to be set. From this Emergent cloud preview the
LAN host 192.168.0.8 is unreachable by default — honest 503 if so.
"""
from __future__ import annotations

import asyncio
import hashlib
import hmac
import os
import secrets
import shlex
import socket
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Cookie, HTTPException, Request, Response
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

router = APIRouter(prefix="/api")

# ── Sign-in ─────────────────────────────────────────────────────────────── #
SESSION_COOKIE = "opc_session"
SESSION_TTL_S = 8 * 60 * 60  # 8 hours


def _admin_password() -> str:
    return os.environ.get("ADMIN_PASSWORD", "").strip()


def _session_secret() -> str:
    return os.environ.get("ADMIN_SESSION_SECRET", "").strip()


def _sign(payload: str) -> str:
    secret = _session_secret().encode()
    return hmac.new(secret, payload.encode(), hashlib.sha256).hexdigest()


def _mint_token() -> str:
    issued = int(time.time())
    payload = f"admin.{issued}.{secrets.token_hex(8)}"
    return f"{payload}.{_sign(payload)}"


def _verify_token(token: str) -> bool:
    if not token or not _session_secret():
        return False
    parts = token.split(".")
    if len(parts) != 4:
        return False
    payload = ".".join(parts[:3])
    sig = parts[3]
    try:
        issued = int(parts[1])
    except ValueError:
        return False
    if time.time() - issued > SESSION_TTL_S:
        return False
    return hmac.compare_digest(_sign(payload), sig)


class LoginRequest(BaseModel):
    password: str = Field(min_length=1)


@router.get("/auth/status")
async def auth_status(request: Request):
    """Honest readout: is admin auth configured at all? Is THIS session valid?"""
    configured = bool(_admin_password() and _session_secret())
    token = request.cookies.get(SESSION_COOKIE, "")
    return {
        "configured": configured,
        "missing_env": [v for v in ("ADMIN_PASSWORD", "ADMIN_SESSION_SECRET") if not os.environ.get(v, "").strip()],
        "signed_in": configured and _verify_token(token),
        "session_ttl_s": SESSION_TTL_S,
    }


@router.post("/auth/login")
async def auth_login(body: LoginRequest, response: Response):
    pw = _admin_password()
    if not pw or not _session_secret():
        raise HTTPException(
            status_code=503,
            detail="admin auth not configured — set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in /app/backend/.env",
        )
    # constant-time compare to avoid timing oracles
    if not hmac.compare_digest(body.password, pw):
        raise HTTPException(status_code=401, detail="invalid password")
    token = _mint_token()
    response.set_cookie(
        key=SESSION_COOKIE, value=token,
        max_age=SESSION_TTL_S, httponly=True, samesite="lax",
        secure=False,  # local-deploy compatible; Cloudflare-fronted edge will upgrade
        path="/",
    )
    return {"ok": True, "ttl_s": SESSION_TTL_S}


@router.post("/auth/logout")
async def auth_logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


def require_admin(request: Request) -> None:
    """Dependency-style guard — raises 401/503 if not signed in.
    Call inside any handler that must be locked to the admin dashboard."""
    if not (_admin_password() and _session_secret()):
        raise HTTPException(status_code=503, detail="admin auth not configured")
    token = request.cookies.get(SESSION_COOKIE, "")
    if not _verify_token(token):
        raise HTTPException(status_code=401, detail="sign-in required")


# ── Sabretooth SSH relay ───────────────────────────────────────────────── #
SABRETOOTH_HOST = os.environ.get("SABRETOOTH_HOST", "192.168.0.8").strip()
SABRETOOTH_USER = os.environ.get("SABRETOOTH_USER", "").strip()
SABRETOOTH_KEY = os.environ.get("SABRETOOTH_KEY_PATH", "").strip()

# Whitelist of safe commands the relay will execute. Anything else returns 400.
# Joshua extends this list by editing /app/backend/auth_relay.py — keeps the
# blast radius small even if a token leaks.
ALLOWED_COMMANDS: Dict[str, List[str]] = {
    "status":       ["uptime"],
    "disk":         ["df", "-h", "/"],
    "mem":          ["free", "-h"],
    "graph-status": ["bash", "-lc", "ls -la ~/antigravity/graphify-out 2>/dev/null || echo 'graphify-out not found on sabretooth'"],
    "git-log":      ["bash", "-lc", "cd ~/antigravity && git log --oneline -10 2>&1"],
    "git-status":   ["bash", "-lc", "cd ~/antigravity && git status 2>&1"],
    "ollama-ps":    ["bash", "-lc", "ollama ps 2>&1 || echo 'ollama not running'"],
    "hermes-health": ["bash", "-lc", "curl -fsS http://localhost:11435/healthz 2>&1 || echo 'hermes-router not reachable'"],
}


class SabretoothExecRequest(BaseModel):
    command: str = Field(min_length=1)


@router.get("/sabretooth/status")
async def sabretooth_status(request: Request):
    """Connectivity readout BEFORE attempting any execution.
    Returns: env config, reachability ping, allowed-command catalogue. Honest."""
    require_admin(request)
    configured = bool(SABRETOOTH_USER and SABRETOOTH_KEY)
    missing = [v for v, val in (("SABRETOOTH_USER", SABRETOOTH_USER), ("SABRETOOTH_KEY_PATH", SABRETOOTH_KEY)) if not val]
    # quick L4 reachability probe (no SSH yet) — 1-second TCP connect
    reachable = False
    err: Optional[str] = None
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1.0)
        s.connect((SABRETOOTH_HOST, 22))
        s.close()
        reachable = True
    except Exception as e:  # noqa: BLE001 — diagnostic
        err = str(e)

    return {
        "host": SABRETOOTH_HOST,
        "user": SABRETOOTH_USER or None,
        "key_path": SABRETOOTH_KEY or None,
        "configured": configured,
        "missing_env": missing,
        "tcp_22_reachable": reachable,
        "reachability_error": err,
        "allowed_commands": sorted(ALLOWED_COMMANDS.keys()),
        "note": (
            "This Emergent cloud preview cannot reach 192.168.0.8 over the LAN. "
            "Deploy this backend on a node with route-to-SABRETOOTH (or expose the "
            "dev node via tailscale/cloudflare-tunnel) before /sabretooth/exec works."
        ),
    }


@router.post("/sabretooth/exec")
async def sabretooth_exec(body: SabretoothExecRequest, request: Request):
    """Run one whitelisted command on Sabretooth and stream output back."""
    require_admin(request)
    cmd_key = body.command.strip()
    if cmd_key not in ALLOWED_COMMANDS:
        raise HTTPException(status_code=400, detail=f"command '{cmd_key}' not in allow-list. Available: {sorted(ALLOWED_COMMANDS.keys())}")

    if not (SABRETOOTH_USER and SABRETOOTH_KEY):
        raise HTTPException(status_code=503, detail="sabretooth not configured — set SABRETOOTH_USER + SABRETOOTH_KEY_PATH in /app/backend/.env")

    remote = " ".join(shlex.quote(p) for p in ALLOWED_COMMANDS[cmd_key])
    ssh_argv = [
        "ssh", "-i", SABRETOOTH_KEY,
        "-o", "StrictHostKeyChecking=accept-new",
        "-o", "ConnectTimeout=4",
        "-o", "BatchMode=yes",
        f"{SABRETOOTH_USER}@{SABRETOOTH_HOST}",
        remote,
    ]
    try:
        proc = await asyncio.create_subprocess_exec(
            *ssh_argv,
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        out_b, err_b = await asyncio.wait_for(proc.communicate(), timeout=15)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="sabretooth ssh timed out (15s)")
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="ssh binary not installed on this node")
    except Exception as exc:  # noqa: BLE001 — diagnostic
        raise HTTPException(status_code=502, detail=f"ssh launch failed: {exc}") from exc

    return {
        "command": cmd_key,
        "remote": remote,
        "exit_code": proc.returncode,
        "stdout": out_b.decode(errors="ignore"),
        "stderr": err_b.decode(errors="ignore"),
    }
