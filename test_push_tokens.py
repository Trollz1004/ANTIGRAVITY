import os
import subprocess

env_path = r"C:\Users\joshl\OneDrive\JOSHUA's-DO-NOT-COMMIT-TO-GITHUB\JOSHUAS.ENV"
env_vars = {}
with open(env_path, "r", encoding="utf-8", errors="ignore") as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env_vars[k.strip()] = v.strip()

for var in ['GITHUB_PAT', 'GH_PAT', 'GITHUB_TOKEN']:
    token = env_vars.get(var)
    if not token:
        continue
    token = token.strip('"\'')
    print(f"Testing {var} with username Trollz1004...")
    url = f"https://Trollz1004:{token}@github.com/Trollz1004/ANTIGRAVITY.git"
    res = subprocess.run(["git", "push", url, "deploy/youandinotai-final:deploy/youandinotai-final", "--dry-run"], cwd="C:\\antigravity", capture_output=True, text=True)
    if res.returncode == 0:
        print(f"[OK] {var} (Trollz1004) works!")
    else:
        stderr = res.stderr.replace(token, "REDACTED")
        print(f"[FAIL] {var} (Trollz1004) failed: {stderr.strip()}")

    print(f"Testing {var} with no username...")
    url = f"https://{token}@github.com/Trollz1004/ANTIGRAVITY.git"
    res = subprocess.run(["git", "push", url, "deploy/youandinotai-final:deploy/youandinotai-final", "--dry-run"], cwd="C:\\antigravity", capture_output=True, text=True)
    if res.returncode == 0:
        print(f"[OK] {var} (no-user) works!")
    else:
        stderr = res.stderr.replace(token, "REDACTED")
        print(f"[FAIL] {var} (no-user) failed: {stderr.strip()}")
