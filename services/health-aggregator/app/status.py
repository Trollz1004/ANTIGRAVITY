from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal

Level = Literal["green", "yellow", "red"]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Check:
    name: str
    status: Level
    summary: str
    data: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "status": self.status,
            "summary": self.summary,
            "data": self.data,
        }


def worst_status(checks: list[Check]) -> Level:
    statuses = {check.status for check in checks}
    if "red" in statuses:
        return "red"
    if "yellow" in statuses:
        return "yellow"
    return "green"
