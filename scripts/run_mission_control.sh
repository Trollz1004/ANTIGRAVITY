#!/bin/bash
# Run Mission Control monitoring using a small Python helper that invokes
# the Windows venv Python with the correct Windows-style path.
# This avoids bash's backslash-stripping when passing paths to a Windows binary.
python3 -c "
import subprocess, sys
py_bin = r'C:\Users\joshl\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe'
script = r'C:\Users\joshl\AppData\Local\hermes\scripts\mission_control_automation.py'
result = subprocess.run([py_bin, script, *sys.argv[1:]], capture_output=False)
sys.exit(result.returncode)
" "$@"
