#!/usr/bin/env python3
import subprocess
import json
import sys

REPO = "trollz1004/antigravity"

def run_gh(command):
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        return {"error": result.stderr.strip()}
    return {"output": result.stdout.strip()}

def list_issues():
    return run_gh(f"gh issue list --repo {REPO} --json number,title,status")

def list_prs():
    return run_gh(f"gh pr list --repo {REPO} --json number,title,status")

def check_ci():
    return run_gh(f"gh pr checks --repo {REPO}")

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "list_issues"
    if action == "list_issues":
        print(json.dumps(list_issues()))
    elif action == "list_prs":
        print(json.dumps(list_prs()))
    elif action == "check_ci":
        print(json.dumps(check_ci()))
    else:
        print(json.dumps({"error": "Invalid action"}))
