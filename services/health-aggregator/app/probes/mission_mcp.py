from __future__ import annotations

import json

from ..config import REPO_ROOT
from ..status import Check
from .common import tcp_open


def _count_json(path) -> int | None:
    if not path.exists():
        return None
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(value, list):
            return len(value)
    except json.JSONDecodeError:
        return None
    return None


def probe_mission_mcp() -> list[Check]:
    checks = [Check("mission-mcp port", "green" if tcp_open("127.0.0.1", 3901) else "yellow", "localhost:3901", {})]
    tasks = REPO_ROOT / "tasks" / "queue.json"
    failed = REPO_ROOT / "tasks" / "failed.json"
    checks.append(Check("open tasks", "green" if tasks.exists() else "yellow", "task queue file", {"count": _count_json(tasks)}))
    checks.append(Check("open issues", "green" if failed.exists() else "yellow", "failed task file", {"count": _count_json(failed)}))
    return checks
