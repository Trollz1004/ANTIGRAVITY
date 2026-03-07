"""Compatibility shim for the retired social posting daemon."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
PYTHON = ROOT / ".venv" / "Scripts" / "python.exe"
SCRIPT = ROOT / "scripts" / "generate-safe-marketing-drafts.py"
LOG = ROOT / "logs" / "safe-node-automation.log"
LOG.parent.mkdir(parents=True, exist_ok=True)

python_exe = str(PYTHON if PYTHON.exists() else sys.executable)

with open(LOG, "a", encoding="utf-8") as log_fh:
    proc = subprocess.Popen(
        [python_exe, str(SCRIPT), "--profile", "9020-content"],
        cwd=str(ROOT),
        stdout=log_fh,
        stderr=log_fh,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS,
    )

print("Live social daemon is retired under CodeX safe policy.")
print(f"Started safe draft job instead — PID {proc.pid}")
print(f"Log: {LOG}")
