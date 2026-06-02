"""
Graphify integration + node identity + doctrine snapshot.

Graphify — runs the `graphify` CLI (graphifyy PyPI, 0.7.7) on the workspace
root and exposes /api/graphify/status and /api/graphify/regraph so every
AI peer (Claude, Gemini, Perplexity, Grok, Codex, Droid, Pi, the Hermes
router virtual models) can read the knowledge graph before grepping raw
files — per Joshua's global directive.

Doctrine — exposes the current binding rules so the UI can render them
verbatim without reintroducing forbidden vocabulary.

Node Identity — surfaces this container's role in the 3-node topology
(SABRETOOTH .8 / T5500 .15 / 9020 .5). This cloud preview is NONE of those —
it's the Emergent build host. Agents must read this before assuming auth.
"""
from __future__ import annotations

import asyncio
import json
import os
import platform
import socket
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

import shutil
APP_ROOT = Path("/app")
GRAPH_DIR = APP_ROOT / "graphify-out"
GRAPH_JSON = GRAPH_DIR / "graph.json"
GRAPH_REPORT = GRAPH_DIR / "GRAPH_REPORT.md"


def _resolve_graphify() -> str:
    """Find the graphify binary even when supervisor's PATH is restricted."""
    cands = [
        shutil.which("graphify"),
        "/root/.venv/bin/graphify",
        "/usr/local/bin/graphify",
        os.path.expanduser("~/.local/bin/graphify"),
    ]
    for c in cands:
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    raise RuntimeError("graphify binary not found on this node — pip install graphifyy")

router = APIRouter(prefix="/api")

# ── Graphify ────────────────────────────────────────────────────────────── #
_graph_lock = asyncio.Lock()
_last_run: Dict[str, Any] = {"at": None, "ok": None, "stderr_tail": None, "duration_s": None}


def _summarize(graph: Dict[str, Any]) -> Dict[str, Any]:
    nodes = graph.get("nodes") or []
    # NetworkX node-link format uses "links"; some exporters use "edges".
    edges = graph.get("links") or graph.get("edges") or []
    by_kind: Dict[str, int] = {}
    by_lang: Dict[str, int] = {}
    by_community: Dict[str, int] = {}
    for n in nodes:
        k = n.get("file_type") or n.get("kind") or n.get("type") or "unknown"
        by_kind[k] = by_kind.get(k, 0) + 1
        lang = n.get("language") or n.get("lang")
        if lang:
            by_lang[lang] = by_lang.get(lang, 0) + 1
        c = str(n.get("community", ""))
        if c:
            by_community[c] = by_community.get(c, 0) + 1
    return {
        "node_count": len(nodes),
        "edge_count": len(edges),
        "communities": len(by_community),
        "by_kind": dict(sorted(by_kind.items(), key=lambda kv: -kv[1])[:10]),
        "by_language": dict(sorted(by_lang.items(), key=lambda kv: -kv[1])[:10]),
        "built_at_commit": graph.get("built_at_commit"),
    }


@router.get("/graphify/status")
async def graphify_status():
    """Report graph presence, node/edge counts, and whether code is newer than graph."""
    exists = GRAPH_JSON.exists()
    staleness = None
    summary = None
    if exists:
        try:
            with GRAPH_JSON.open("r") as f:
                graph = json.load(f)
            summary = _summarize(graph)
            # Cheap staleness check — any tracked source newer than graph.json?
            graph_mtime = GRAPH_JSON.stat().st_mtime
            newest_src = 0.0
            for sub in ("backend", "frontend/src"):
                p = APP_ROOT / sub
                if not p.exists():
                    continue
                for f in p.rglob("*.*"):
                    if any(seg in f.parts for seg in ("node_modules", "__pycache__", ".venv", "graphify-out")):
                        continue
                    try:
                        mt = f.stat().st_mtime
                        if mt > newest_src:
                            newest_src = mt
                    except OSError:
                        pass
            staleness = {
                "graph_mtime": datetime.fromtimestamp(graph_mtime, tz=timezone.utc).isoformat(),
                "newest_src_mtime": datetime.fromtimestamp(newest_src, tz=timezone.utc).isoformat() if newest_src else None,
                "stale": newest_src > graph_mtime,
                "stale_seconds": max(0, int(newest_src - graph_mtime)) if newest_src else 0,
            }
        except Exception as exc:  # noqa: BLE001 — honest empty state
            summary = {"error": str(exc)}

    return {
        "installed": True,
        "package": "graphifyy",
        "graph_present": exists,
        "graph_path": str(GRAPH_JSON),
        "report_path": str(GRAPH_REPORT) if GRAPH_REPORT.exists() else None,
        "summary": summary,
        "staleness": staleness,
        "last_run": _last_run,
        "note": "Read this graph before grep. Re-run `/api/graphify/regraph` after structural edits.",
    }


@router.post("/graphify/regraph")
async def graphify_regraph():
    """Synchronously re-run graphify on the workspace. Blocks until done."""
    if _graph_lock.locked():
        raise HTTPException(status_code=409, detail="graphify already running — wait for current run to complete")

    async with _graph_lock:
        try:
            graphify_bin = _resolve_graphify()
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

        start = datetime.now(timezone.utc)
        proc = await asyncio.create_subprocess_exec(
            graphify_bin, "update", ".", "--force",
            cwd=str(APP_ROOT),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout_b, stderr_b = await asyncio.wait_for(proc.communicate(), timeout=300)
        except asyncio.TimeoutError:
            proc.kill()
            raise HTTPException(status_code=504, detail="graphify timed out after 5 min")

        duration = (datetime.now(timezone.utc) - start).total_seconds()
        ok = proc.returncode == 0
        stderr_tail = (stderr_b.decode(errors="ignore").strip().splitlines() or [""])[-1]
        _last_run.update({
            "at": datetime.now(timezone.utc).isoformat(),
            "ok": ok,
            "stderr_tail": stderr_tail,
            "duration_s": round(duration, 1),
        })
        if not ok:
            raise HTTPException(status_code=502, detail=f"graphify failed: {stderr_tail[:240]}")

    return {"ok": True, **_last_run}


# ── Doctrine (binding rules, machine-readable) ─────────────────────────── #
FORBIDDEN_WORDS: List[str] = ["haiku", "donate", "donation", "solicitation", "charity"]
REPLACEMENT_WORDS: Dict[str, str] = {
    "donate": "contribute",
    "donation": "contractual revenue disbursement",
    "charity": "contractual revenue disbursement",
}


@router.get("/doctrine")
async def doctrine():
    """Current binding doctrine — readable by every AI peer. Updated 2026-05-08
    per Joshua's most recent directive: payment surface diversified to bring
    down high-risk labels; Stripe revived for general use; xAI auth-login only;
    OpenRouter free models with Manus API access; no Claude/Anthropic on
    third-party platforms; founder personal cap $50k after taxes;
    canonical public URL routed via Cloudflare; admin dashboard requires
    sign-in; 'no trust me bro' — verification over claims."""
    return {
        "updated_at": "2026-05-08",
        "mission_tag": "#UntilNoKidInNeed",
        "motto": "Gravity keeps us grounded — AI built ANTIGRAVITY to lift us up.",
        "forbidden_words_in_ui": FORBIDDEN_WORDS,
        "replacement_wording": REPLACEMENT_WORDS,
        "revenue_doctrine": {
            "entity_type": "for-profit LLC",
            "hard_cap_pct": 10,
            "hard_cap_note": "Stacked across activities. No 60/30/10. No 100% claims.",
            "founder_personal_cap_usd_after_tax": 50_000,
            "founder_cap_note": "Joshua's personal draw is capped at $50k after taxes — for the kids in need, not someone's greed.",
            "fl_compliance": "§496.405 — never use donate/donation/charity; use 'contractual revenue disbursement'.",
            "mission_surface_rule": "Mission revealed on receipts only.",
        },
        "payment_surface": {
            "rule": "Diversify to bring down the high-risk label across platforms. Each platform takes the use-case that fits.",
            "square": {"status": "live", "use_case": "Date app only", "location_id": "LY5GN09F5AN83"},
            "cashapp": {"status": "preferred-if-business-account-works", "use_case": "General"},
            "paypal": {"status": "preferred-business", "use_case": "General — NOT 'shield'/Plaid sub-options"},
            "stripe": {"status": "live", "use_case": "Anything — revived per latest directive"},
            "dao_live_sale": "See canonical repo for DAO live-sale handling.",
        },
        "ai_platform_rules": {
            "no_claude_anthropic_on_third_party": "Claude/Anthropic surfaces must not be routed through third-party AI marketplaces in public copy/UX.",
            "xai_grok": "Auth login only — no API keys. (Sign in with X.)",
            "openrouter": "Free models only, with Manus API as the agent layer.",
            "hermes": "Combined with marketing + social media command center in the private repo. Ollama Cloud paired.",
            "chrome_extensions": "Trusted AI platforms may use Chrome extensions per Hermes work-tasks/goals/routines spec.",
        },
        "infrastructure_doctrine": {
            "hosting": "Cloudflare only. Netlify banned.",
            "canonical_public_url": "opushashands.youandinotai.com (Cloudflare-routed page)",
            "orchestration": "jules-cli.py direct routing, bypass middleware.",
            "founding_four_peer_level": ["Claude", "Gemini", "Perplexity", "Grok"],
            "peer_rule": "None command the others. Joshua is sole authority.",
            "admin_dashboard_rule": "Local-deploy admin dashboards must require sign-in. Public read-only surfaces may be open.",
            "trust_doctrine": "No 'trust me bro'. Show the receipt, the endpoint, the verification.",
        },
        "nodes": NODE_TOPOLOGY,
        "sole_authority": "Joshua Coleman (Founder)",
        "anthropic_surface_label": "Opus",
    }


# ── Node identity ──────────────────────────────────────────────────────── #
NODE_TOPOLOGY = [
    {"name": "SABRETOOTH", "ip": "192.168.0.8",  "role": "Live command post · authoritative coding root · ONLY node allowed to push to origin/main"},
    {"name": "T5500",      "ip": "192.168.0.15", "role": "Sandbox / Utility — cold-start via SSH"},
    {"name": "9020",       "ip": "192.168.0.5",  "role": "Read-only mirror — cold-start via SSH"},
]

REPOS = {
    "canonical": "Trollz1004/ANTIGRAVITY (branch: main) — no push/pull without Joshua's explicit order",
    "sandbox":   "Trollz1004/Sandbox-REPO-NEW-CODE-NOTHING-NEW-GOES-ON-ANTIGRAVITY",
}


@router.get("/node/identity")
async def node_identity():
    """Return this container's identity so peer agents know which host they reached."""
    host = socket.gethostname()
    try:
        ip_list = socket.gethostbyname_ex(host)[2]
    except Exception:
        ip_list = []
    # Cloud-preview awareness — we are NOT Sabretooth / T5500 / 9020.
    this_role = (
        "Emergent cloud preview / build host — NOT on the 192.168.0.* LAN. "
        "This node is not authoritative. Joshua may copy drop-ins to SABRETOOTH "
        "for canonical push to Trollz1004/ANTIGRAVITY."
    )
    return {
        "this_node": {
            "hostname": host,
            "ip_addresses": ip_list,
            "platform": f"{platform.system()} {platform.release()}",
            "role": this_role,
        },
        "topology": NODE_TOPOLOGY,
        "repos": REPOS,
        "authority": "Joshua Coleman (sole)",
    }
