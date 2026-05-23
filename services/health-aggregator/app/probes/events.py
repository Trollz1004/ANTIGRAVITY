from __future__ import annotations

from ..config import REPO_ROOT
from ..status import Check


def read_events_tail(limit: int = 20) -> list[str]:
    path = REPO_ROOT / "tasks" / "events.jsonl"
    if not path.exists():
        return []
    return path.read_text(encoding="utf-8", errors="ignore").splitlines()[-limit:]


def probe_paperweight_audit() -> list[Check]:
    audit = REPO_ROOT / "services" / "hermes-router" / "audit" / "2026-05-20.jsonl"
    entries = audit.read_text(encoding="utf-8").splitlines() if audit.exists() else []
    refusals = [line for line in entries if '"refusal":null' not in line]
    return [
        Check("audit entries today", "green" if entries else "yellow", "Paperweight audit count", {"count": len(entries)}),
        Check("refusals today", "green", "Paperweight refusal count", {"count": len(refusals)}),
    ]
