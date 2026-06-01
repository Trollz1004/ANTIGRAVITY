"""Specialist goal counts — backs the HTML's `GOALS LOOP` rows for Grok/Manus/Gemini/Perplexity.

Real data only. The HTML marks cells RED if a probe errors or returns an empty body.
- Grok → x.com posts + replies (auth-only; counts come from x.AI Builder or local counters)
- Manus → Meta (Facebook/IG) posts + comments (auth-only; same)
- Gemini → YouTube uploads + Google SEO/Brand searches
- Perplexity → Research reports + citations

This module returns the **actual persisted counters** for each specialist. Until the
specialists are wired and producing real activity, counts will be 0 — and the HTML
correctly shows `0` (not `—` or `N/A`). The HTML does NOT fake-green.
"""
import time
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter

router = APIRouter()

# State files written by the specialist adapter code. For now these don't exist
# (specialist adapters are declared in MISSION-CONTROL-ADAPTERS-2026-06-01.md
# but their real counter files are not yet wired). When the specialists run,
# they write JSON like {hashtags: 12, posts: 7, replies: 4, ...} here.
SPECIALIST_STATE_DIR = Path("C:/Antigravity/services/mission-control-api/data/specialists")


def _read_state(specialist: str) -> dict:
    """Read the persisted state for a specialist. Returns 0s for every field if no file exists."""
    fields = {
        "grok": ["hashtags", "posts", "replies", "comments", "followups", "leads", "sales"],
        "manus": ["hashtags", "posts", "replies", "comments", "followups", "leads", "sales"],
        "gemini": ["videos", "subs", "views", "impressions", "maps", "leads"],
        "perplexity": ["reports", "citations", "audits", "posts"],
    }.get(specialist, [])
    state_path = SPECIALIST_STATE_DIR / f"{specialist}.json"
    if not state_path.exists():
        # Honest: no state file → all zeros. The HTML shows 0, not fake.
        return {f: 0 for f in fields}
    import json
    try:
        with state_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        out = {f: 0 for f in fields}
        for f in fields:
            if f in data and isinstance(data[f], (int, float)):
                out[f] = data[f]
        out["_updated_at"] = data.get("_updated_at", "")
        out["_source"] = str(state_path)
        return out
    except Exception as e:
        out = {f: 0 for f in fields}
        out["_error"] = str(e)
        return out


@router.get("/goals/{specialist}/counts")
async def goals_counts(specialist: str):
    if specialist not in ("grok", "manus", "gemini", "perplexity"):
        return {"ok": False, "error": f"unknown specialist: {specialist}"}
    started = time.monotonic()
    counts = _read_state(specialist)
    return {
        "ok": True,
        "specialist": specialist,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "duration_ms": int((time.monotonic() - started) * 1000),
        **counts,
    }


@router.get("/sticky-notes")
async def sticky_notes():
    """OPUSnots — sticky notes from Opus-tier specialists (CEO/CFO/CTO/CMO/CSO/UX/INTERN).

    Real data only. Until the agents write notes to disk, the response is empty notes
    (not fake content). The HTML silently keeps the last-known state.
    """
    state_path = SPECIALIST_STATE_DIR / "sticky-notes.json"
    if not state_path.exists():
        return {"ok": True, "notes": {}, "_source": "no notes yet — Opus-tier agents have not authored any"}
    import json
    try:
        with state_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return {"ok": True, "notes": data.get("notes", {}), "_source": str(state_path)}
    except Exception as e:
        return {"ok": False, "error": str(e), "notes": {}}


@router.get("/manus/credits")
async def manus_credits():
    """Manus API credit balance. Until the Manus adapter is wired, return 0/0 — not fake."""
    state_path = SPECIALIST_STATE_DIR / "manus-credits.json"
    if not state_path.exists():
        return {
            "ok": True,
            "balance": 0.0,
            "limit": 50.0,
            "specialist": "manus",
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "_note": "Manus adapter not yet wired — counts will be real once it is",
        }
    import json
    try:
        with state_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return {"ok": True, **data, "specialist": "manus", "checked_at": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        return {"ok": False, "error": str(e), "balance": 0.0, "limit": 50.0}


@router.get("/compliance/status")
async def compliance_status():
    """Compliance doctrine gate — FL §496.405 + 1 LLC 1 Square wallet.

    Real: derived from Square probe + revenue_buckets probe (both exist).
    """
    from ..envelope import make_envelope
    from ..probes import square as square_mod, revenue_buckets as revenue_mod
    sq = await square_mod.square_probe()
    rev = await revenue_mod.revenue_buckets_probe()
    verified = sq.status in ("ok", "degraded") and rev.status == "ok"
    return {
        "ok": True,
        "verified": verified,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "square": sq.dict(),
        "revenue_buckets": rev.dict(),
        "doctrine": "1 LLC 1 Square wallet · 10% per-bucket max · FL §496.405 customer-facing language ban",
    }
