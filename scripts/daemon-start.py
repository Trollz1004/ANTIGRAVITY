"""Start the social engine daemon as a detached subprocess on Windows."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
PYTHON = ROOT / ".venv" / "Scripts" / "python.exe"
SCRIPT = ROOT / "scripts" / "social-engine-24x7.py"
LOG = ROOT / "logs" / "social-engine-daemon.log"
LOG.parent.mkdir(parents=True, exist_ok=True)

# Open log file for stdout/stderr
log_fh = open(LOG, "a", encoding="utf-8")

# Launch detached — survives parent exit
proc = subprocess.Popen(
    [str(PYTHON), str(SCRIPT), "--daemon"],
    cwd=str(ROOT),
    stdout=log_fh,
    stderr=log_fh,
    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS,
)

print(f"Social Engine daemon started — PID {proc.pid}")
print(f"Log: {LOG}")
print(f"Kill: taskkill /PID {proc.pid} /F")
