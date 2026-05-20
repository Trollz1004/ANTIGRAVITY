#!/usr/bin/env python3
"""
check_outdated.py — Check for outdated dependencies.

Compares currently installed pip and npm packages against their latest
available versions and generates a markdown report.

Usage:
  python scripts/check_outdated.py
  python scripts/check_outdated.py --output /path/to/report.md
"""

from __future__ import annotations

import argparse
import json
import logging
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("check_outdated")

REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = REPO_ROOT / "backend" / "fastapi-app"
FRONTEND_DIR = REPO_ROOT / "apps" / "mission-control"
REPORTS_DIR = REPO_ROOT / "reports"


def categorize_update(current: str, latest: str) -> str:
    """Categorize an update as major, minor, or patch."""
    try:
        c_parts = current.strip().split(".")
        l_parts = latest.strip().split(".")
        if len(c_parts) >= 1 and len(l_parts) >= 1:
            if c_parts[0] != l_parts[0]:
                return "major"
            if len(c_parts) >= 2 and len(l_parts) >= 2 and c_parts[1] != l_parts[1]:
                return "minor"
        return "patch"
    except (ValueError, IndexError):
        return "unknown"


def run_pip_outdated() -> list[dict]:
    """Run pip list --outdated and return parsed results."""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "list", "--outdated", "--format=json"],
            capture_output=True, text=True, timeout=60,
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
    except (FileNotFoundError, subprocess.TimeoutExpired, json.JSONDecodeError) as exc:
        logger.warning("pip list --outdated failed: %s", exc)
    return []


def run_npm_outdated() -> dict:
    """Run npm outdated --outdated and return parsed results."""
    try:
        result = subprocess.run(
            ["npm", "outdated", "--json"],
            capture_output=True, text=True, timeout=60,
            cwd=str(FRONTEND_DIR),
        )
        if result.returncode in (0, 1):
            return json.loads(result.stdout)
    except (FileNotFoundError, subprocess.TimeoutExpired, json.JSONDecodeError) as exc:
        logger.warning("npm outdated failed: %s", exc)
    return {}


def generate_report(pip_outdated: list[dict], npm_outdated: dict) -> str:
    """Generate a markdown report of outdated packages."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines: list[str] = []
    lines.append("# Outdated Dependencies Report")
    lines.append(f"\n**Generated:** {now}")
    lines.append("")

    # Python section
    lines.append("## Python (pip)")
    lines.append("")
    if pip_outdated:
        lines.append(f"**{len(pip_outdated)} outdated packages**")
        lines.append("")
        lines.append("| Package | Current | Latest | Type |")
        lines.append("|---------|---------|--------|------|")
        for pkg in sorted(pip_outdated, key=lambda p: p.get("name", "")):
            name = pkg.get("name", "unknown")
            current = pkg.get("version", "?")
            latest = pkg.get("latest_version", "?")
            update_type = categorize_update(current, latest)
            lines.append(f"| {name} | {current} | {latest} | {update_type} |")
    else:
        lines.append("✅ All Python dependencies are up to date.")
    lines.append("")

    # Node.js section
    lines.append("## Node.js (npm)")
    lines.append("")
    if npm_outdated:
        lines.append(f"**{len(npm_outdated)} outdated packages**")
        lines.append("")
        lines.append("| Package | Current | Wanted | Latest | Type |")
        lines.append("|---------|---------|--------|--------|------|")
        for name, info in sorted(npm_outdated.items()):
            if isinstance(info, dict):
                current = info.get("current", "?")
                wanted = info.get("wanted", "?")
                latest = info.get("latest", "?")
                update_type = categorize_update(current, latest)
                lines.append(f"| {name} | {current} | {wanted} | {latest} | {update_type} |")
    else:
        lines.append("✅ All Node.js dependencies are up to date.")
    lines.append("")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Check for outdated dependencies")
    parser.add_argument("--output", "-o", help="Output path for the markdown report")
    args = parser.parse_args()

    pip_outdated = run_pip_outdated()
    npm_outdated = run_npm_outdated()

    report = generate_report(pip_outdated, npm_outdated)

    output_path = Path(args.output) if args.output else REPORTS_DIR / "outdated-dependencies.md"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(report, encoding="utf-8")
    logger.info("Report written to %s", output_path)
    print(report)
    return 0


if __name__ == "__main__":
    sys.exit(main())
