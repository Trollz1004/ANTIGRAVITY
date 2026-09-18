#!/usr/bin/env python3
"""Migration safety report CLI.

Generates a report of all Alembic migrations with their protection status,
applied state, and any safety concerns.

Usage:
    python scripts/migration-safety-report.py [--format text|json] [--alembic-config PATH]
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# Ensure the fastapi-app root is on sys.path so we can import alembic.safety
SCRIPT_DIR = Path(__file__).resolve().parent
APP_ROOT = SCRIPT_DIR.parent
if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))

from alembic.config import Config  # noqa: E402

from alembic.safety import (  # noqa: E402
    MigrationSafetyChecker,
    get_protection_reason,
)


def build_report(alembic_ini_path: str, *, as_json: bool = False) -> str:
    """Build and return the migration safety report."""
    cfg = Config(alembic_ini_path)
    checker = MigrationSafetyChecker(cfg, interactive=False)
    report = checker.build_report()

    if as_json:
        data = {
            "summary": {
                "total": len(report.migrations),
                "protected": report.protected_count,
                "applied": report.applied_count,
                "pending": report.pending_count,
            },
            "migrations": [
                {
                    "revision": m.revision,
                    "down_revision": m.down_revision,
                    "description": m.description,
                    "file_path": m.file_path,
                    "protection": m.protection.value,
                    "protection_reason": get_protection_reason(m.file_path),
                    "is_applied": m.is_applied,
                }
                for m in report.migrations
            ],
        }
        return json.dumps(data, indent=2)

    # Text format
    lines = []
    lines.append("=" * 70)
    lines.append("  MIGRATION SAFETY REPORT")
    lines.append("=" * 70)
    lines.append("")
    lines.append(
        f"  Total migrations: {len(report.migrations)}  "
        f"| Protected: {report.protected_count}  "
        f"| Applied: {report.applied_count}  "
        f"| Pending: {report.pending_count}"
    )
    lines.append("-" * 70)

    for m in report.migrations:
        status = "✓ applied" if m.is_applied else "○ pending"
        prot = ""
        if m.protection.value == "protected":
            reason = get_protection_reason(m.file_path) or "production-critical"
            prot = f"  🛡️  PROTECTED ({reason})"
        lines.append(f"  {m.revision:<14}  {status:<12}  {m.description}{prot}")

    lines.append("-" * 70)

    if report.has_protected:
        lines.append("")
        lines.append("  ⚠️  Protected migrations cannot be rolled back without setting")
        lines.append("     ALEMBIC_ALLOW_PROTECTED_DOWNGRADE=1  environment variable.")

    lines.append("")
    lines.append("  Environment variables:")
    lines.append("    ALEMBIC_DRY_RUN=1                   Show SQL without executing")
    lines.append("    ALEMBIC_SKIP_DOWNGRADE_CONFIRM=1    Skip interactive prompt")
    lines.append(
        "    ALEMBIC_ALLOW_PROTECTED_DOWNGRADE=1 Allow rollback of protected migrations"
    )
    lines.append("=" * 70)

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a migration safety report")
    parser.add_argument(
        "--format",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)",
    )
    parser.add_argument(
        "--alembic-config",
        default=None,
        help="Path to alembic.ini (default: alembic/alembic.ini relative to app root)",
    )
    args = parser.parse_args()

    ini_path = args.alembic_config
    if ini_path is None:
        ini_path = str(APP_ROOT / "alembic" / "alembic.ini")

    if not os.path.isfile(ini_path):
        print(f"ERROR: alembic.ini not found at {ini_path}", file=sys.stderr)
        sys.exit(1)

    report = build_report(ini_path, as_json=(args.format == "json"))
    print(report)


if __name__ == "__main__":
    main()
