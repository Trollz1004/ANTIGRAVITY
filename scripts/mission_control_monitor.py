#!/usr/bin/env python3
"""Mission Control monitor wrapper.

The Hermes cron runner calls: python3 <script>
On Windows, the system python3 (Windows Store stub) cannot resolve /c/ paths.
This script resolves its own location at runtime to find the automation script
and the venv Python, then invokes them with Windows-style paths.
"""
import os
import sys
import subprocess

def to_win_path(posix_path):
    """Convert /c/Users/... to C:\\Users\\... for Windows APIs."""
    if not posix_path:
        return posix_path
    if posix_path.startswith("/c/") or posix_path.startswith("/C/"):
        return "C:" + posix_path[2:].replace("/", "\\")
    if posix_path.startswith("/"):
        # Other drives: /d/ -> D:
        parts = posix_path.split("/")
        if len(parts) > 2 and len(parts[1]) == 1:
            return parts[1].upper() + ":" + "\\".join(parts[2:])
    return posix_path

# The venv Python and automation script paths (Windows format)
VENV_PYTHON = r"C:\Users\joshl\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe"
AUTOMATION_SCRIPT = r"C:\Users\joshl\AppData\Local\hermes\scripts\mission_control_automation.py"

if __name__ == "__main__":
    if not os.path.exists(VENV_PYTHON):
        print(f"ERROR: venv Python not found at {VENV_PYTHON}", file=sys.stderr)
        # Try the system python3 with forward-slash path as fallback
        print("Falling back to system python3...", file=sys.stderr)
        try:
            result = subprocess.run([sys.executable, AUTOMATION_SCRIPT, *sys.argv[1:]])
            sys.exit(result.returncode)
        except Exception as e:
            print(f"Fallback also failed: {e}", file=sys.stderr)
            sys.exit(1)
    if not os.path.exists(AUTOMATION_SCRIPT):
        print(f"ERROR: automation script not found at {AUTOMATION_SCRIPT}", file=sys.stderr)
        sys.exit(1)
    result = subprocess.run([VENV_PYTHON, AUTOMATION_SCRIPT, *sys.argv[1:]])
    sys.exit(result.returncode)
