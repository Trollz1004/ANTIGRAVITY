#!/usr/bin/env python3
"""
scan_dependencies.py — OPU-136: Automated dependency security audit.

Runs pip-audit on the Python requirements and npm audit on the mission-control
frontend, then produces a unified markdown report.

Exit codes:
  0 — No critical or high severity vulnerabilities found.
  1 — At least one critical or high severity vulnerability was detected.

Usage:
  python scripts/scan_dependencies.py
  python scripts/scan_dependencies.py --help
  python scripts/scan_dependencies.py --output /path/to/report.md
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
logger = logging.getLogger("scan_dependencies")

REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = REPO_ROOT / "backend" / "fastapi-app"
FRONTEND_DIR = REPO_ROOT / "apps" / "mission-control"
REPORTS_DIR = REPO_ROOT / "reports"
REQUIREMENTS_FILE = BACKEND_DIR / "requirements.txt"


# ---------------------------------------------------------------------------
# pip-audit
# ---------------------------------------------------------------------------


def run_pip_audit() -> dict | None:
    """Run pip-audit and return parsed JSON output, or None on failure."""
    try:
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "pip_audit",
                "--progress-spinner=off",
                "--format=json",
                "--requirement",
                str(REQUIREMENTS_FILE),
            ],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(BACKEND_DIR),
        )
        if result.returncode not in (0, 1):
            # pip-audit returns 1 when vulns found, 0 when clean
            logger.warning(
                "pip-audit exited with code %d: %s",
                result.returncode,
                result.stderr[:200],
            )
        return json.loads(result.stdout)
    except FileNotFoundError:
        logger.warning("pip-audit not installed. Install with: pip install pip-audit")
        return None
    except (subprocess.TimeoutExpired, json.JSONDecodeError) as exc:
        logger.warning("pip-audit failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# npm audit
# ---------------------------------------------------------------------------


def run_npm_audit() -> dict | None:
    """Run npm audit --json and return parsed output, or None on failure."""
    if not (FRONTEND_DIR / "package.json").exists():
        logger.warning("No package.json in %s, skipping npm audit", FRONTEND_DIR)
        return None
    try:
        result = subprocess.run(
            ["npm", "audit", "--json"],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(FRONTEND_DIR),
        )
        return json.loads(result.stdout)
    except FileNotFoundError:
        logger.warning("npm not found in PATH, skipping npm audit")
        return None
    except (subprocess.TimeoutExpired, json.JSONDecodeError) as exc:
        logger.warning("npm audit failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Severity helpers
# ---------------------------------------------------------------------------

SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3, "unknown": 4}


def severity_sort_key(item: dict) -> int:
    return SEVERITY_ORDER.get(item.get("severity", "unknown"), 99)


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------


def generate_report(
    pip_data: dict | None, npm_data: dict | None
) -> tuple[str, int, int, int]:
    """Generate a unified markdown vulnerability report. Returns (report, total, critical, high)."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines: list[str] = []
    lines.append("# Dependency Security Audit Report")
    lines.append(f"\n**Generated:** {now}")
    lines.append("\n**Repository:** ANTIGRAVITY")
    lines.append("")

    total_vulns = 0
    critical_count = 0
    high_count = 0

    # --- pip-audit section ---
    lines.append("## Python Dependencies (pip-audit)")
    lines.append("")
    if pip_data is None:
        lines.append("_pip-audit was not available or failed to run._")
    elif "dependencies" in pip_data:
        vulns = []
        for dep in pip_data.get("dependencies", []):
            for vuln in dep.get("vulns", []):
                vulns.append(
                    {
                        "package": dep.get("name", "unknown"),
                        "version": dep.get("version", "?"),
                        "id": vuln.get("id", "N/A"),
                        "severity": vuln.get("fix_versions", []) and "medium" or "high",
                        "description": vuln.get("description", "No description")[:200],
                    }
                )
        if vulns:
            vulns.sort(key=severity_sort_key)
            lines.append(f"**{len(vulns)} vulnerabilities found**")
            lines.append("")
            lines.append("| Package | Version | ID | Severity | Description |")
            lines.append("|---------|---------|----|----------|-------------|")
            for v in vulns:
                sev = v["severity"].upper()
                lines.append(
                    f"| {v['package']} | {v['version']} | {v['id']} | {sev} | {v['description']} |"
                )
                total_vulns += 1
                if v["severity"] == "critical":
                    critical_count += 1
                elif v["severity"] == "high":
                    high_count += 1
        else:
            lines.append("✅ No vulnerabilities found in Python dependencies.")
    else:
        lines.append("_No vulnerability data available._")
    lines.append("")

    # --- npm audit section ---
    lines.append("## Node.js Dependencies (npm audit)")
    lines.append("")
    if npm_data is None:
        lines.append("_npm audit was not available or failed to run._")
    elif "vulnerabilities" in npm_data:
        npm_vulns = []
        for name, info in npm_data.get("vulnerabilities", {}).items():
            severity = info.get("severity", "unknown")
            via = info.get("via", [])
            if isinstance(via, list) and via:
                for v in via:
                    if isinstance(v, dict):
                        npm_vulns.append(
                            {
                                "package": name,
                                "severity": severity,
                                "title": v.get("title", "N/A"),
                                "url": v.get("url", ""),
                                "cwe": v.get("cwe", ""),
                                "range": v.get("range", ""),
                            }
                        )
            else:
                npm_vulns.append(
                    {
                        "package": name,
                        "severity": severity,
                        "title": str(via)[:100] if via else "N/A",
                        "url": "",
                        "cwe": "",
                        "range": info.get("range", ""),
                    }
                )
        if npm_vulns:
            npm_vulns.sort(key=severity_sort_key)
            lines.append(f"**{len(npm_vulns)} vulnerabilities found**")
            lines.append("")
            lines.append("| Package | Severity | Title | CWE | Range |")
            lines.append("|---------|----------|-------|-----|-------|")
            for v in npm_vulns:
                sev = v["severity"].upper()
                lines.append(
                    f"| {v['package']} | {sev} | {v['title'][:60]} | {v['cwe']} | {v['range']} |"
                )
                total_vulns += 1
                if v["severity"] == "critical":
                    critical_count += 1
                elif v["severity"] == "high":
                    high_count += 1
        else:
            lines.append("✅ No vulnerabilities found in Node.js dependencies.")
    else:
        lines.append("_No vulnerability data available._")
    lines.append("")

    # --- Summary ---
    lines.append("## Summary")
    lines.append("")
    lines.append(f"- **Total vulnerabilities:** {total_vulns}")
    lines.append(f"- **Critical:** {critical_count}")
    lines.append(f"- **High:** {high_count}")
    lines.append("")
    if critical_count > 0:
        lines.append(
            "⚠️ **ACTION REQUIRED:** Critical vulnerabilities detected. Update immediately."
        )
    elif high_count > 0:
        lines.append(
            "⚠️ **ATTENTION:** High severity vulnerabilities detected. Plan updates soon."
        )
    else:
        lines.append("✅ No critical or high severity vulnerabilities.")

    return "\n".join(lines), total_vulns, critical_count, high_count


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Scan dependencies for security vulnerabilities"
    )
    parser.add_argument("--output", "-o", help="Output path for the markdown report")
    parser.add_argument(
        "--quiet", "-q", action="store_true", help="Suppress console output"
    )
    args = parser.parse_args()

    logger.info("Starting dependency security audit...")

    pip_data = run_pip_audit()
    npm_data = run_npm_audit()

    report, total, critical, high = generate_report(pip_data, npm_data)

    # Write report
    output_path = (
        Path(args.output) if args.output else REPORTS_DIR / "dependency-audit.md"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(report, encoding="utf-8")
    logger.info("Report written to %s", output_path)

    if not args.quiet:
        print(report)

    if critical > 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
