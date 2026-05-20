from __future__ import annotations

import subprocess

from ..config import REPO_ROOT
from ..status import Check
from .common import tcp_open


def probe_hermes() -> list[Check]:
    checks = [
        Check("Hermes router port", "green" if tcp_open("127.0.0.1", 11435) else "red", "localhost:11435", {}),
    ]
    audit = REPO_ROOT / "services" / "hermes-router" / "audit"
    today = audit / "2026-05-20.jsonl"
    checks.append(
        Check(
            "Hermes audit log",
            "green" if today.exists() else "yellow",
            "today audit file",
            {"entries": len(today.read_text(encoding="utf-8").splitlines()) if today.exists() else 0},
        )
    )
    script = REPO_ROOT / "scripts" / "hermes-env-audit.ps1"
    if script.exists():
        completed = subprocess.run(
            ["powershell", "-ExecutionPolicy", "Bypass", "-File", str(script)],
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
        checks.append(Check("Hermes env audit", "green" if completed.returncode == 0 else "red", "Anthropic key hard-wall audit", {"returncode": completed.returncode}))
    else:
        checks.append(Check("Hermes env audit", "yellow", "audit script missing", {}))
    return checks
