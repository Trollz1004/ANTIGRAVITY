#!/usr/bin/env python3
"""Post-commit hook helper - commits idempotency changes."""
import subprocess
import sys

def run(cmd, cwd="/mnt/c/ANTIGRAVITY"):
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, shell=True)
    print(f"CMD: {cmd}")
    print(f"  rc={result.returncode}")
    print(f"  stdout={result.stdout.strip()}")
    print(f"  stderr={result.stderr.strip()}")
    return result

if __name__ == "__main__":
    run("git add -A")
    run('git commit -m "feat(idempotency): OPU-49 implement API idempotency keys"')
