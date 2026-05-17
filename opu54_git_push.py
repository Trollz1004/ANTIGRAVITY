#!/usr/bin/env python3
"""Git commit and push for OPU-54."""
import subprocess
import os

os.chdir('/mnt/c/ANTIGRAVITY')

def run(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    print(f"CMD: {cmd}")
    print(f"STDOUT: {result.stdout.strip()}")
    print(f"STDERR: {result.stderr.strip()}")
    print(f"RC: {result.returncode}")
    print("---")
    return result

# Update issue status to done
run('curl -fsS -X PATCH http://localhost:3100/api/issues/19f0eb05-ac4a-4580-9a00-443e25cc6e16 '
    '-H "Content-Type: application/json" -d \'{"status":"done"}\'')

# Git add
run('git add -A')

# Git commit
run('git commit -m "feat(infra): add Docker container health checks (OPU-54)"')

# Git push
run('git push origin main')
