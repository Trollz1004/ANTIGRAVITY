import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/tasks", tags=["tasks"])

REPO_ROOT = Path(__file__).resolve().parents[5]
TASK_LOG = REPO_ROOT / "services" / "mission-control-api" / "data" / "tasks.log"


class TaskBrief(BaseModel):
    brief: str
    agents: List[str] = []


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
