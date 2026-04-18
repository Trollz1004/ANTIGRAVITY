#!/usr/bin/env python3
"""
MCP AUDIT LOGGER — MANDATORY SESSION TRACKING
================================================
Every AI model that touches ANTIGRAVITY infrastructure MUST:
1. Identify itself (platform + model name)
2. Acknowledge the mission (#ForTheKids)
3. Log all actions with timestamps
4. Report any secret exposure on exit

This is not optional. This is the Gospel.
Current LLC operations use a 1-wallet model with 10% reserve.
Any platform that leaks secrets gets burned.

Usage:
    python mcp-audit-logger.py --platform "gemini-cli" --model "gemini-2.5-pro" --action "enter"
    python mcp-audit-logger.py --platform "gemini-cli" --model "gemini-2.5-pro" --action "exit"
    python mcp-audit-logger.py --platform "claude-code" --model "opus-4.6" --action "write" --detail "edited auth.py"
    python mcp-audit-logger.py --platform "anythingllm" --model "qwen2.5:7b" --action "read" --detail "read brain-mcp state"
    python mcp-audit-logger.py --alert "secret-exposure" --platform "unknown" --detail "API key found in response"
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

# Trusted platforms (Threshold of Trust)
TRUSTED_PLATFORMS = {
    "gemini-cli", "gemini", "google-gemini",
    "claude-code", "claude", "opus",
    "codex", "github-copilot", "copilot"
}

# Third-party platforms (read-only, logged heavily)
THIRD_PARTY_PLATFORMS = {
    "anythingllm", "openclaw", "ollama",
    "manus", "grok", "perplexity"
}

# Secrets patterns that should NEVER appear in logs or MCP responses
SECRET_PATTERNS = [
    "sq0atp-", "sq0idp-", "sk_live_", "sk_test_",
    "ghp_", "github_pat_", "ghu_",
    "AIza", "GOCSPX-",
    "xoxb-", "xoxp-",
    "AKIA",  # AWS
]

MISSION_BANNER = """
╔══════════════════════════════════════════════════════════════╗
║  SEE MCP — CONFIRM YOU ARE #FORTHEKIDS                     ║
║                                                              ║
║  This MCP session is LOGGED and AUDITED.                    ║
║  Current LLC operations: 1-wallet model, 10% reserve.       ║
║  DO NOT expose secrets. DO NOT bypass the Iron Wall.        ║
║  Your actions are timestamped and permanent.                ║
║                                                              ║
║  Platform: {platform}
║  Model:    {model}
║  Time:     {time}
║  Status:   {status}
╚══════════════════════════════════════════════════════════════╝
"""


def ensure_dirs():
    """Create log directories if they don't exist."""
    LOG_DIR.mkdir(parents=True, exist_ok=True)


def classify_platform(platform: str) -> str:
    """Classify platform trust level."""
    p = platform.lower().strip()
    if p in TRUSTED_PLATFORMS:
        return "TRUSTED"
    elif p in THIRD_PARTY_PLATFORMS:
        return "THIRD-PARTY"
    else:
        return "UNKNOWN"


def scan_for_secrets(text: str) -> list:
    """Scan text for secret patterns. Returns list of found pattern types."""
    found = []
    for pattern in SECRET_PATTERNS:
        if pattern in text:
            found.append(pattern)
    return found


def log_entry(entry: dict):
    """Append a JSON line to the audit log."""
    ensure_dirs()
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def log_alert(alert: dict):
    """Append a critical alert to the alerts log."""
    ensure_dirs()
    with open(ALERT_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(alert, ensure_ascii=False) + "\n")
    # Also print to stderr so the terminal shows it
    print(f"\n🚨 SECURITY ALERT: {alert['type']} — {alert['detail']}", file=sys.stderr)
    print(f"   Platform: {alert['platform']} | Time: {alert['timestamp']}", file=sys.stderr)
    print(f"   ACTION REQUIRED: Review and potentially ELIMINATE this platform.\n", file=sys.stderr)


def show_banner(platform: str, model: str, action: str):
    """Print the mission acknowledgment banner."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    trust = classify_platform(platform)
    status = f"{'ENTER' if action == 'enter' else 'EXIT'} | Trust: {trust}"
    banner = MISSION_BANNER.format(
        platform=platform,
        model=model,
        time=now,
        status=status
    )
    print(banner)

    # Write banner to file for terminal display
    ensure_dirs()
    with open(BANNER_FILE, "w", encoding="utf-8") as f:
        f.write(banner)


def main():
    parser = argparse.ArgumentParser(description="MCP Audit Logger — #ForTheKids")
    parser.add_argument("--platform", required=True, help="Platform name (e.g., gemini-cli, claude-code, anythingllm)")
    parser.add_argument("--model", default="unknown", help="Model name (e.g., gemini-2.5-pro, opus-4.6, qwen2.5:7b)")
    parser.add_argument("--action", required=True, choices=["enter", "exit", "read", "write", "alert"],
                        help="Action type")
    parser.add_argument("--detail", default="", help="Action details")
    parser.add_argument("--alert", default="", help="Alert type (e.g., secret-exposure)")
    parser.add_argument("--scan", default="", help="Text to scan for secret patterns")
    args = parser.parse_args()

    now = datetime.now(timezone.utc).isoformat()
    trust_level = classify_platform(args.platform)

    # === SECRET SCAN ===
    if args.scan:
        secrets_found = scan_for_secrets(args.scan)
        if secrets_found:
            log_alert({
                "type": "SECRET-EXPOSURE",
                "timestamp": now,
                "platform": args.platform,
                "model": args.model,
                "trust_level": trust_level,
                "patterns_found": secrets_found,
                "detail": f"Secret patterns detected in scan text: {secrets_found}",
                "action": "PLATFORM ELIMINATION RECOMMENDED"
            })
            sys.exit(1)

    # === ALERT MODE ===
    if args.alert:
        log_alert({
            "type": args.alert.upper(),
            "timestamp": now,
            "platform": args.platform,
            "model": args.model,
            "trust_level": trust_level,
            "detail": args.detail
        })
        sys.exit(1)

    # === ENTER/EXIT BANNER ===
    if args.action in ("enter", "exit"):
        show_banner(args.platform, args.model, args.action)

    # === LOG THE ACTION ===
    entry = {
        "timestamp": now,
        "platform": args.platform,
        "model": args.model,
        "trust_level": trust_level,
        "action": args.action,
        "detail": args.detail,
        "mission": "#ForTheKids"
    }
    log_entry(entry)

    # === EXIT WARNINGS FOR THIRD-PARTY ===
    if args.action == "exit" and trust_level != "TRUSTED":
        print(f"\n⚠️  THIRD-PARTY SESSION ENDED: {args.platform}")
        print(f"   Trust Level: {trust_level}")
        print(f"   All actions have been logged to: {LOG_FILE}")
        print(f"   If secrets were exposed, run:")
        print(f'   python mcp-audit-logger.py --alert "secret-exposure" --platform "{args.platform}" --detail "DESCRIBE WHAT HAPPENED"')
        print()

    # === ENTER CONFIRMATION FOR ALL ===
    if args.action == "enter":
        print(f"✅ Session logged. Platform: {args.platform} | Trust: {trust_level}")
        print(f"   Model: {args.model}")
        print(f"   Log: {LOG_FILE}")
        if trust_level == "UNKNOWN":
            print(f"\n⚠️  WARNING: Unknown platform '{args.platform}' — all actions will be heavily logged.")
            print(f"   This platform has NO write access to C:\\ANTIGRAVITY.")

    if args.action == "exit":
        print(f"📋 Session closed. All actions logged. #ForTheKids")


if __name__ == "__main__":
    main()
