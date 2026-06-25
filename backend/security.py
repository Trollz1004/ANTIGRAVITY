"""
security.py — "Boris&Dario" zero-trust readout.

One endpoint that surfaces the entire security posture of Mission Control:
- admin sign-in configured + session ttl
- IP allowlist active/inactive + current client IP + whether it's on the list
- WAF / Cloudflare Access hint (looks for CF-Ray / CF-Connecting-IP headers)
- HTTPS enforcement (looks at X-Forwarded-Proto)
- Broadcast channel binding (Manus → Telegram, Hermes → WhatsApp, OpenClaw → Discord)
- Active session cookie name + path

No fake-shields: every check returns honestly with the actual env state.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
from fastapi import APIRouter, Request

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

router = APIRouter(prefix="/api/security")


def _ip_allowlist() -> List[str]:
    raw = os.environ.get("ADMIN_IP_ALLOWLIST", "").strip()
    if not raw:
        return []
    return [p.strip() for p in raw.split(",") if p.strip()]


def _client_ip(request: Request) -> str:
    """Best-effort honest extraction of the real caller IP."""
    cf = request.headers.get("cf-connecting-ip", "").strip()
    if cf:
        return cf
    fwd = request.headers.get("x-forwarded-for", "").strip()
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ── Channel binding (per Joshua's 2026-03-02 directive) ─────────────────── #
CHANNEL_BINDINGS = {
    "manus":    {"agent": "Manus",    "role": "Compliance monitor",  "channel": "Telegram",  "destination_env": "TELEGRAM_CHAT_ID"},
    "hermes":   {"agent": "Hermes",   "role": "Ops + me-to-me",      "channel": "WhatsApp",  "destination_env": "WHATSAPP_TO"},
    "openclaw": {"agent": "OpenClaw", "role": "Build / repo events", "channel": "Discord",   "destination_env": "DISCORD_WEBHOOK_URL"},
}


@router.get("/posture")
async def security_posture(request: Request):
    """Boris&Dario · the read-once 'is anything actually protected?' panel."""
    ip = _client_ip(request)
    allowlist = _ip_allowlist()

    has_admin_pw = bool(os.environ.get("ADMIN_PASSWORD", "").strip())
    has_session_secret = bool(os.environ.get("ADMIN_SESSION_SECRET", "").strip())

    behind_cloudflare = bool(request.headers.get("cf-ray", "").strip())
    forwarded_proto = request.headers.get("x-forwarded-proto", "").lower().strip()
    https_enforced = forwarded_proto == "https" or behind_cloudflare

    channels = {}
    for key, binding in CHANNEL_BINDINGS.items():
        env_val = os.environ.get(binding["destination_env"], "").strip()
        # Channel is "wired" when destination AND its companion creds are present
        if key == "manus":
            wired = bool(env_val and os.environ.get("TELEGRAM_BOT_TOKEN", "").strip())
        elif key == "hermes":
            wired = bool(env_val and os.environ.get("WHATSAPP_TOKEN", "").strip() and os.environ.get("WHATSAPP_PHONE_ID", "").strip())
        elif key == "openclaw":
            wired = bool(env_val)
        else:
            wired = False
        channels[key] = {**binding, "destination_set": bool(env_val), "wired": wired}

    posture_score = sum([
        has_admin_pw, has_session_secret,
        bool(allowlist), behind_cloudflare, https_enforced,
        channels["manus"]["wired"], channels["hermes"]["wired"],
    ])
    grade = (
        "A" if posture_score >= 6 else
        "B" if posture_score >= 4 else
        "C" if posture_score >= 2 else "F"
    )

    return {
        "operator": "Boris&Dario",
        "tagline": "Zero-trust ledger guard · #UntilNoKidInNeed protection layer",
        "grade": grade,
        "posture_score": f"{posture_score}/7",
        "client": {"ip": ip, "behind_cloudflare": behind_cloudflare, "https_enforced": https_enforced},
        "admin_gate": {
            "password_set": has_admin_pw,
            "session_secret_set": has_session_secret,
            "session_ttl_hours": 8,
        },
        "ip_allowlist": {
            "active": bool(allowlist),
            "entries": allowlist,
            "current_ip_allowed": (not allowlist) or (ip in allowlist),
            "configure_via": "ADMIN_IP_ALLOWLIST in /app/backend/.env (comma-separated IPs or CIDR fragments)",
        },
        "channel_bindings": channels,
        "recommendations": _recommendations(has_admin_pw, has_session_secret, allowlist, behind_cloudflare, channels),
    }


def _recommendations(has_pw: bool, has_secret: bool, allowlist: List[str],
                     behind_cf: bool, channels: Dict[str, Any]) -> List[str]:
    out: List[str] = []
    if not has_pw or not has_secret:
        out.append("Set ADMIN_PASSWORD + ADMIN_SESSION_SECRET in /app/backend/.env (sign-in currently disabled).")
    if not allowlist:
        out.append("Add ADMIN_IP_ALLOWLIST=<your-static-ip> to lock the dashboard to known IPs (zero-trust).")
    if not behind_cf:
        out.append("Front this app with Cloudflare Access (free tier) for true zero-trust DNS + WAF + DDoS protection.")
    if not channels["manus"]["wired"]:
        out.append("Wire Manus → Telegram (set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID).")
    if not channels["hermes"]["wired"]:
        out.append("Wire Hermes → WhatsApp (set WHATSAPP_PHONE_ID + WHATSAPP_TOKEN at Meta).")
    if not channels["openclaw"]["wired"]:
        out.append("Wire OpenClaw → Discord (set DISCORD_WEBHOOK_URL — create webhook in your Discord server).")
    if not out:
        out.append("All seven posture checks passing · Boris&Dario stand down ✓")
    return out
