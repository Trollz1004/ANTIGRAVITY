from __future__ import annotations

import json

from ..config import REPO_ROOT
from ..status import Check


def probe_graphify() -> list[Check]:
    needs_update = REPO_ROOT / ".graphify" / "needs_update"
    branch = REPO_ROOT / ".graphify" / "branch.json"
    checks = [
        Check(".graphify needs_update", "red" if needs_update.exists() else "green", "graph freshness marker", {"exists": needs_update.exists()})
    ]
    if branch.exists():
        try:
            data = json.loads(branch.read_text(encoding="utf-8"))
            stale = bool(data.get("stale"))
            checks.append(Check(".graphify branch stale", "red" if stale else "green", "branch stale flag", {"stale": stale}))
        except json.JSONDecodeError:
            checks.append(Check(".graphify branch stale", "yellow", "branch.json parse failed", {}))
    else:
        checks.append(Check(".graphify branch stale", "yellow", "branch.json missing", {}))
    return checks
