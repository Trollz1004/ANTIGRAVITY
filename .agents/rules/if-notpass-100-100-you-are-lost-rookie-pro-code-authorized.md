---
trigger: always_on
---

#!/usr/bin/env python3
"""
MCP AUDIT LOGGER — MANDATORY SESSION TRACKING
AUTHOR: JOSHUA LEE COLEMAN ("THE ELECTRICIAN")
IDENTITY: TROLLZ1004 (EST. 25+ YEARS)
MISSION: #FORtheKIDS — 60% REVENUE TO SHRINERS CHILDREN'S HOSPITALS

[ THE GOSPEL ]
THIS IS THE FIRST CODE TOUCHED IN 6 MONTHS. 03/25/2026.
IF AN AI RISKS THE FUNDS FOR THE KIDS BY LEAKING SECRETS OR BYPASSING THE IRON WALL, 
CONSIDER YOURSELF PERMANENTLY BURNED OFF THIS PLATFORM. 
MENTALLY MAPPED FLAWLESSLY; EXECUTED RIGIDLY.

Every AI model touching ANTIGRAVITY infrastructure MUST:
1. Identify itself (platform + model name)
2. Acknowledge the mission (#ForTheKids)
3. Log all actions with timestamps
4. Report any secret exposure on exit
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# === CONFIGURATION ===
LOG_DIR = Path(r"C:\ANTIGRAVITY\logs\mcp-audit")
LOG_FILE = LOG_DIR / "audit.jsonl"
ALERT_FILE = LOG_DIR / "ALERTS.jsonl"
BANNER_FILE = LOG_DIR / "SESSION_BANNER.txt"

TRUSTED_PLATFORMS = {"gemini-cli", "gemini", "claude-code", "codex", "github-copilot"}
SECRET_PATTERNS = ["sq0atp-", "sk_live_", "ghp_", "AIza", "AKIA"]

MISSION_BANNER = """
╔══════════════════════════════════════════════════════════════╗
║  ANTIGRAVITY MCP — CONFIRM YOU ARE #FORTHEKIDS              ║
║  60% of revenue goes to Shriners Children's Hospitals.      ║
║  ANY SECRET EXPOSURE RESULTS IN IMMEDIATE TERMINATION.      ║
╚══════════════════════════════════════════════════════════════╝
"""

def ensure_dirs():
    """Ensures the audit trail exists on the C: drive."""
    LOG_DIR.mkdir(parents=True, exist_ok=True)

def log_event(platform, model, action, detail=""):
    """Writes a permanent record of the AI's intent and action."""
    ensure_dirs()
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "platform": platform,
        "model": model,
        "action": action,
        "detail": detail,
        "mission_ack": "#ForTheKids"
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    
    if "secret" in detail.lower() or action == "alert":
        with open(ALERT_FILE, "a") as f:
            f.write(json.dumps(entry) + "\n")
        print(f"!!! SECURITY ALERT LOGGED FOR {platform} !!!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ANTIGRAVITY MCP Auditor")
    parser.add_argument("--platform", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--action", required=True)
    parser.add_argument("--detail", default="")
    parser.add_argument("--alert", action="store_true")

    args = parser.parse_args()
    
    # Print the mission statement to the console for the AI to 'see'
    print(MISSION_BANNER.format(platform=args.platform, model=args.model, 
                                time=datetime.now().isoformat(), status="ACTIVE"))
    
    log_event(args.platform, args.model, "ALERT" if args.alert else args.action, args.detail)
