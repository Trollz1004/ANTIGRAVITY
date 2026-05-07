import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel, Field, validator

router = APIRouter(prefix="/tasks", tags=["tasks"])

REPO_ROOT = Path(__file__).resolve().parents[5]
TASK_LOG = REPO_ROOT / "services" / "mission-control-api" / "data" / "tasks.log"

# Allowlist configuration (matches frontend input-validation.ts)
ALLOWED_AGENTS = {"codex", "claude", "hermes", "ollama", "paperclip"}
MAX_BRIEF_LENGTH = 500
BRIEF_PATTERN = r'^[a-zA-Z0-9\s.,!?;:\'"()\-]+$'


class TaskBrief(BaseModel):
    brief: str = Field(..., max_length=MAX_BRIEF_LENGTH)
    agents: List[str] = []

    @validator('brief')
    def validate_brief(cls, v):
        """Validate task brief against allowlist: max length, allowed characters."""
        if not v.strip():
            raise ValueError('Task brief cannot be empty')
        if len(v) > MAX_BRIEF_LENGTH:
            raise ValueError(f'Task brief must be {MAX_BRIEF_LENGTH} characters or less')
        if not re.match(BRIEF_PATTERN, v):
            raise ValueError('Task brief contains invalid characters')
        return v.strip()

    @validator('agents')
    def validate_agents(cls, v):
        """Validate all agent IDs against allowlist."""
        for agent in v:
            if agent not in ALLOWED_AGENTS:
                raise ValueError(f'Agent ID {agent} is not allowed. Must be one of: {", ".join(sorted(ALLOWED_AGENTS))}')
        return v


@router.post("/dispatch")
async def dispatch(payload: TaskBrief):
    TASK_LOG.parent.mkdir(parents=True, exist_ok=True)
    task_id = uuid.uuid4().hex[:12]
    record = {
        "task_id": task_id,
        "queued_at": datetime.now(timezone.utc).isoformat(),
        "brief": payload.brief,
        "agents": payload.agents,
        "status": "queued",
    }
    with TASK_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")
    return {"task_id": task_id, "queued": True}


@router.get("")
async def list_tasks(limit: int = 50):
    if not TASK_LOG.exists():
        return {"tasks": []}
    lines = TASK_LOG.read_text(encoding="utf-8").strip().splitlines()
    items = []
    for line in lines[-limit:]:
        try:
            items.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    items.reverse()
    return {"tasks": items}
