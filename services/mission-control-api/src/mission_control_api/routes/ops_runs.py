"""Ops-runs router — reads run records from ops-runs.jsonl with offset/limit pagination.

GET  /ops/runs         — list runs with pagination (offset, limit, total)
GET  /ops/runs/{id}    — get a single run by run_id
POST /ops/runs/{cmd}   — trigger a command (placeholder)
GET  /ops/commands     — list available operation commands
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from mission_control_api.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter()

# ── Data paths ────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parents[5]
OPS_RUNS_JSONL = REPO_ROOT / "services" / "mission-control-api" / "data" / "ops-runs.jsonl"

# ── In-memory command store (mirrors QUICK_COMMANDS from the frontend) ────────
_COMMANDS = [
    {
        "id": "autostart",
        "title": "Start Mission Stack",
        "description": "Run the autostart-mission.ps1 script to bring up the full stack.",
        "command": "powershell -ExecutionPolicy Bypass -File C:\\ANTIGRAVITY\\scripts\\autostart-mission.ps1",
        "cwd": "C:\\ANTIGRAVITY",
        "timeout_s": 120,
        "caution": "This starts Docker, Postgres, Hermes Router, Paperclip, and OpenClaw.",
    },
    {
        "id": "api",
        "title": "Run Mission Control API",
        "description": "Start the Mission Control API via uvicorn.",
        "command": "python -m uvicorn mission_control_api.main:app --host 0.0.0.0 --port 8787 --app-dir C:\\ANTIGRAVITY\\services\\mission-control-api\\src",
        "cwd": "C:\\ANTIGRAVITY",
        "timeout_s": 10,
        "caution": None,
    },
    {
        "id": "build",
        "title": "Build Dashboard",
        "description": "Build the mission-control frontend with tsc + vite.",
        "command": "pnpm --dir C:\\ANTIGRAVITY\\apps\\mission-control build",
        "cwd": "C:\\ANTIGRAVITY",
        "timeout_s": 60,
        "caution": None,
    },
    {
        "id": "guardian",
        "title": "Run Guardian",
        "description": "Run the Opus Guardian integrity sweep.",
        "command": "python C:\\ANTIGRAVITY\\scripts\\clawx-control\\opus-guardian.py",
        "cwd": "C:\\ANTIGRAVITY",
        "timeout_s": 30,
        "caution": None,
    },
]

# ── In-memory run store for triggered commands ────────────────────────────────
_RUNS: list[dict] = []


def _load_jsonl(path: Path) -> list[dict]:
    """Parse a JSONL file, returning a list of dicts (most-recent-last)."""
    if not path.exists():
        return []
    records: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip().rstrip("\r")
        if not line:
            continue
        try:
            records.append(json.loads(line))
        except json.JSONDecodeError:
            logger.warning("skipping malformed JSONL line", extra={"line": line[:120]})
    return records


# ── Commands endpoint ─────────────────────────────────────────────────────────


@router.get("/ops/commands", summary="List available operation commands")
async def list_commands() -> dict:
    return {"commands": _COMMANDS}


# ── Runs endpoints ────────────────────────────────────────────────────────────


@router.get("/ops/runs", summary="List ops run events with pagination")
async def list_ops_runs(
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
) -> dict:
    """Return paginated run records from ops-runs.jsonl (most-recent-first)."""
    # Merge JSONL records with in-memory triggered runs
    file_records = _load_jsonl(OPS_RUNS_JSONL)
    all_records = list(_RUNS) + file_records
    # Deduplicate by run_id (in-memory takes precedence)
    seen: dict[str, dict] = {}
    for rec in all_records:
        seen[rec.get("run_id", "")] = rec
    merged = list(seen.values())
    # Sort most-recent-first by started_at
    merged.sort(key=lambda r: r.get("started_at", ""), reverse=True)

    total = len(merged)
    # Clamp offset
    if offset >= total:
        offset = max(0, total - limit)
    page = merged[offset : offset + limit]

    return {
        "runs": page,
        "pagination": {
            "offset": offset,
            "limit": limit,
            "total": total,
            "has_next": offset + limit < total,
            "has_prev": offset > 0,
            "next_offset": min(offset + limit, total) if offset + limit < total else None,
            "prev_offset": max(offset - limit, 0) if offset > 0 else None,
        },
    }


@router.get("/ops/runs/{run_id}", summary="Get a single ops run event")
async def get_ops_run(run_id: str):
    """Look up a single run by run_id across JSONL and in-memory stores."""
    # Check in-memory first
    for rec in _RUNS:
        if rec.get("run_id") == run_id:
            return JSONResponse(rec)
    # Check JSONL
    for rec in _load_jsonl(OPS_RUNS_JSONL):
        if rec.get("run_id") == run_id:
            return JSONResponse(rec)
    return JSONResponse({"error": f"Run '{run_id}' not found"}, status_code=404)


@router.post("/ops/runs/{command_id}", summary="Trigger an operation command")
async def trigger_ops_run(command_id: str):
    """Record a triggered run (placeholder — does not actually execute)."""
    command = next((c for c in _COMMANDS if c["id"] == command_id), None)
    if not command:
        return JSONResponse({"error": f"Command '{command_id}' not found"}, status_code=404)

    run_id = uuid.uuid4().hex[:12]
    now = datetime.now(timezone.utc).isoformat()
    run = {
        "run_id": run_id,
        "command_id": command_id,
        "title": command["title"],
        "command": command["command"],
        "cwd": command["cwd"],
        "status": "running",
        "started_at": now,
        "finished_at": None,
        "duration_s": None,
        "exit_code": None,
        "output": "",
        "error": None,
    }
    _RUNS.insert(0, run)
    logger.info("ops run triggered", extra={"run_id": run_id, "command_id": command_id})
    return run
