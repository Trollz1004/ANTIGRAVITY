"""
Task management system — Paperclip replacement.

Replaces the Paperclip CEO/CFO/CMO/CTO/INTERN dispatcher with:
  - Agent registry (10 agents · CEO/CFO/CMO/CTO/INTERN + 6 launch ollama agents)
  - Tasks CRUD with status (open/in_progress/blocked/done/archived),
    priority (p0/p1/p2), 10-bucket tag, owner, due, dependencies
  - Heartbeats per agent (POST /api/agents/{id}/heartbeat)
  - Audit log (every state transition stamped, queryable)
  - Dispatch endpoint that fan-outs a task to multiple agents

Storage: MongoDB collections `tasks`, `audit`, `heartbeats`. Stable string IDs
(uuid4) — no ObjectIds in responses.
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]
TASKS = _db.tasks
AUDIT = _db.audit
HEARTBEATS = _db.heartbeats

# ── Agent registry — single source of truth, no Paperclip needed ──
AGENT_TIERS = ["ceo", "cfo", "cmo", "cto", "intern", "launch"]
AGENTS: List[Dict[str, Any]] = [
    {"id": "ceo",       "label": "CEO · Hermes",   "tier": "ceo",    "color": "#00d4ff", "task_cap": 25, "role": "orchestrator"},
    {"id": "cfo",       "label": "CFO",            "tier": "cfo",    "color": "#ffb300", "task_cap": 25, "role": "treasury · runway · margins"},
    {"id": "cmo",       "label": "CMO",            "tier": "cmo",    "color": "#e040fb", "task_cap": 25, "role": "content · social · campaigns"},
    {"id": "cto",       "label": "CTO",            "tier": "cto",    "color": "#00e676", "task_cap": 25, "role": "infra · deploys · audits"},
    {"id": "intern-1",  "label": "INTERN-1",       "tier": "intern", "color": "#6b82a6", "task_cap": 5,  "role": "social groundwork (Gemma 1B)"},
    {"id": "intern-2",  "label": "INTERN-2",       "tier": "intern", "color": "#6b82a6", "task_cap": 5,  "role": "social groundwork (Gemma 1B)"},
    {"id": "openclaw",  "label": "OpenClaw",       "tier": "launch", "color": "#00d4ff", "task_cap": 10, "role": "personal AI · 100+ skills"},
    {"id": "claude",    "label": "Claude · Opus",  "tier": "launch", "color": "#b200ff", "task_cap": 10, "role": "Opus conductor"},
    {"id": "codex",     "label": "Codex",          "tier": "launch", "color": "#00e676", "task_cap": 10, "role": "repo surgery · qwen3-coder"},
    {"id": "opencode",  "label": "OpenCode",       "tier": "launch", "color": "#3b82f6", "task_cap": 10, "role": "open-source coding agent"},
    {"id": "droid",     "label": "Droid",          "tier": "launch", "color": "#ffb300", "task_cap": 10, "role": "factory agent across IDEs"},
    {"id": "pi",        "label": "Pi",             "tier": "launch", "color": "#ec4899", "task_cap": 10, "role": "minimal toolkit"},
]
AGENT_BY_ID = {a["id"]: a for a in AGENTS}

STATUSES = Literal["open", "in_progress", "blocked", "done", "archived"]
PRIORITIES = Literal["p0", "p1", "p2"]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


# ── models ──
class TaskCreate(BaseModel):
    title: str
    body: Optional[str] = ""
    owner: str  # agent id
    bucket: Optional[int] = None  # 1..10 (10-bucket revenue engine)
    priority: PRIORITIES = "p1"
    due_at: Optional[str] = None
    depends_on: List[str] = Field(default_factory=list)
    source: Optional[str] = "Mission Control"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    owner: Optional[str] = None
    bucket: Optional[int] = None
    priority: Optional[PRIORITIES] = None
    status: Optional[STATUSES] = None
    due_at: Optional[str] = None
    note: Optional[str] = None  # appended to audit


class DispatchRequest(BaseModel):
    title: str
    body: Optional[str] = ""
    owners: List[str]  # multiple agents
    bucket: Optional[int] = None
    priority: PRIORITIES = "p1"
    source: Optional[str] = "Mission Control · Dispatch"


class HeartbeatPayload(BaseModel):
    note: Optional[str] = ""
    state: Optional[str] = "alive"


# ── router ──
router = APIRouter(prefix="/api/tasks")


@router.get("/agents")
async def list_agents():
    """Return every agent + load + heartbeat status."""
    out = []
    for a in AGENTS:
        active = await TASKS.count_documents({"owner": a["id"], "status": {"$in": ["open", "in_progress", "blocked"]}})
        hb = await HEARTBEATS.find_one({"agent": a["id"]}, {"_id": 0})
        out.append({**a, "active_tasks": active, "heartbeat": hb})
    return {"agents": out}


@router.post("/agents/{agent_id}/heartbeat")
async def beat(agent_id: str, payload: HeartbeatPayload):
    if agent_id not in AGENT_BY_ID:
        raise HTTPException(status_code=404, detail=f"unknown agent '{agent_id}'")
    doc = {"agent": agent_id, "at": _now(), "state": payload.state, "note": payload.note}
    await HEARTBEATS.update_one({"agent": agent_id}, {"$set": doc}, upsert=True)
    return doc


@router.get("")
async def list_tasks(
    status: Optional[str] = None,
    owner: Optional[str] = None,
    bucket: Optional[int] = None,
    limit: int = 200,
):
    q: Dict[str, Any] = {}
    if status: q["status"] = status
    if owner:  q["owner"] = owner
    if bucket is not None: q["bucket"] = bucket
    rows = await TASKS.find(q, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return {"tasks": rows, "count": len(rows)}


@router.post("")
async def create_task(payload: TaskCreate):
    if payload.owner not in AGENT_BY_ID:
        raise HTTPException(status_code=400, detail=f"unknown owner '{payload.owner}'")
    task = {
        "id": _new_id(),
        "title": payload.title.strip(),
        "body": (payload.body or "").strip(),
        "owner": payload.owner,
        "bucket": payload.bucket,
        "priority": payload.priority,
        "status": "open",
        "due_at": payload.due_at,
        "depends_on": payload.depends_on or [],
        "source": payload.source or "Mission Control",
        "created_at": _now(),
        "updated_at": _now(),
    }
    await TASKS.insert_one(task.copy())  # copy so insert can't mutate the dict we return
    await AUDIT.insert_one({
        "id": _new_id(), "task_id": task["id"], "action": "create",
        "actor": payload.source, "at": _now(), "snapshot": task,
    })
    return task


@router.patch("/{task_id}")
async def update_task(task_id: str, payload: TaskUpdate):
    existing = await TASKS.find_one({"id": task_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="task not found")
    patch = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if k != "note"}
    if "owner" in patch and patch["owner"] not in AGENT_BY_ID:
        raise HTTPException(status_code=400, detail=f"unknown owner '{patch['owner']}'")
    patch["updated_at"] = _now()
    await TASKS.update_one({"id": task_id}, {"$set": patch})
    updated = await TASKS.find_one({"id": task_id}, {"_id": 0})
    await AUDIT.insert_one({
        "id": _new_id(), "task_id": task_id, "action": "update",
        "actor": "ui", "at": _now(),
        "before": existing, "after": updated, "note": payload.note or None,
    })
    return updated


@router.delete("/{task_id}")
async def delete_task(task_id: str):
    existing = await TASKS.find_one({"id": task_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="task not found")
    await TASKS.delete_one({"id": task_id})
    await AUDIT.insert_one({
        "id": _new_id(), "task_id": task_id, "action": "delete",
        "actor": "ui", "at": _now(), "snapshot": existing,
    })
    return {"ok": True, "deleted": task_id}


@router.post("/dispatch")
async def dispatch(payload: DispatchRequest):
    """Fan a single brief out to multiple agents. Returns the created task ids."""
    bad = [o for o in payload.owners if o not in AGENT_BY_ID]
    if bad:
        raise HTTPException(status_code=400, detail=f"unknown owners: {bad}")

    created = []
    for owner in payload.owners:
        t = {
            "id": _new_id(),
            "title": payload.title.strip(),
            "body": (payload.body or "").strip(),
            "owner": owner,
            "bucket": payload.bucket,
            "priority": payload.priority,
            "status": "open",
            "due_at": None,
            "depends_on": [],
            "source": payload.source or "Mission Control · Dispatch",
            "created_at": _now(),
            "updated_at": _now(),
        }
        await TASKS.insert_one(t.copy())
        await AUDIT.insert_one({
            "id": _new_id(), "task_id": t["id"], "action": "dispatch",
            "actor": payload.source, "at": _now(), "snapshot": t,
        })
        created.append(t)
    return {"dispatched": len(created), "tasks": created}


@router.get("/audit")
async def audit_log(task_id: Optional[str] = None, limit: int = 100):
    q: Dict[str, Any] = {}
    if task_id: q["task_id"] = task_id
    rows = await AUDIT.find(q, {"_id": 0}).sort("at", -1).to_list(limit)
    return {"entries": rows, "count": len(rows)}


@router.get("/stats")
async def stats():
    """Top-line counters that drive the Mission ribbon."""
    by_status: Dict[str, int] = {}
    for s in ("open", "in_progress", "blocked", "done", "archived"):
        by_status[s] = await TASKS.count_documents({"status": s})
    by_priority: Dict[str, int] = {}
    for p in ("p0", "p1", "p2"):
        by_priority[p] = await TASKS.count_documents({"priority": p, "status": {"$in": ["open", "in_progress", "blocked"]}})
    by_bucket: List[Dict[str, Any]] = []
    for n in range(1, 11):
        c = await TASKS.count_documents({"bucket": n, "status": {"$in": ["open", "in_progress", "blocked"]}})
        by_bucket.append({"bucket": n, "active": c})
    return {
        "by_status": by_status,
        "by_priority": by_priority,
        "by_bucket": by_bucket,
        "total": sum(by_status.values()),
        "active": by_status["open"] + by_status["in_progress"] + by_status["blocked"],
    }
