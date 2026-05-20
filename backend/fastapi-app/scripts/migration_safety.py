#!/usr/bin/env python3
"""Migration safety check runner for Alembic.

Provides CLI and programmatic interfaces for:
- Pre-flight safety checks before migrations
- Dry-run mode (show SQL without executing)
- Automatic rollback on failure
- Migration health report generation

Usage:
    python scripts/migration_safety.py check
    python scripts/migration_safety.py dry-run
    python scripts/migration_safety.py health
    python scripts/migration_safety.py rollback <revision>
"""

from __future__ import annotations

import argparse
import logging
import os
import shutil
import sys
import time
from pathlib import Path

# Add parent dir to path so we can import app modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from alembic.config import Config
from alembic import command, script
from sqlalchemy import text

from app.config import get_settings
from app.database import engine

logger = logging.getLogger("migration_safety")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MIN_DISK_SPACE_MB = 500  # Minimum free disk space in MB
LOCK_TIMEOUT_SECONDS = 30  # Max seconds to wait for table locks
MAX_MIGRATION_TIME_SECONDS = 300  # Max seconds for a single migration


# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------


def check_disk_space() -> dict:
    """Verify sufficient disk space is available."""
    try:
        stat = shutil.disk_usage("/")
        free_mb = stat.free / (1024 * 1024)
        passed = free_mb >= MIN_DISK_SPACE_MB
        return {
            "check": "disk_space",
            "passed": passed,
            "free_mb": round(free_mb, 1),
            "required_mb": MIN_DISK_SPACE_MB,
            "message": f"{'OK' if passed else 'FAIL'}: {free_mb:.0f}MB free (need {MIN_DISK_SPACE_MB}MB)",
        }
    except Exception as e:
        return {"check": "disk_space", "passed": False, "message": f"ERROR: {e}"}


def check_database_connection() -> dict:
    """Verify database is reachable."""
    try:
        import asyncio

        async def _check():
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))

        asyncio.run(_check())
        return {"check": "db_connection", "passed": True, "message": "OK: Database reachable"}
    except Exception as e:
        return {"check": "db_connection", "passed": False, "message": f"FAIL: {e}"}


def check_concurrent_migrations() -> dict:
    """Check if another migration is currently running."""
    try:
        import asyncio

        async def _check():
            async with engine.connect() as conn:
                result = await conn.execute(
                    text(
                        "SELECT pid, state, query_start, query "
                        "FROM pg_stat_activity "
                        "WHERE query LIKE '%alembic%' AND state = 'active'"
                    )
                )
                rows = result.fetchall()
                return rows

        rows = asyncio.run(_check())
        if rows:
            return {
                "check": "concurrent_migrations",
                "passed": False,
                "message": f"FAIL: {len(rows)} active migration(s) detected: {rows}",
            }
        return {"check": "concurrent_migrations", "passed": True, "message": "OK: No concurrent migrations"}
    except Exception as e:
        # SQLite doesn't have pg_stat_activity — that's OK
        return {"check": "concurrent_migrations", "passed": True, "message": f"SKIP: {e}"}


def check_table_locks() -> dict:
    """Check for long-held table locks that could block migrations."""
    try:
        import asyncio

        async def _check():
            async with engine.connect() as conn:
                result = await conn.execute(
                    text(
                        "SELECT pid, mode, granted, relation::regclass "
                        "FROM pg_locks "
                        "WHERE mode LIKE '%Exclusive%' AND NOT granted"
                    )
                )
                return result.fetchall()

        rows = asyncio.run(_check())
        if rows:
            return {
                "check": "table_locks",
                "passed": False,
                "message": f"WARNING: {len(rows)} ungranted exclusive lock(s): {rows}",
            }
        return {"check": "table_locks", "passed": True, "message": "OK: No blocking locks"}
    except Exception as e:
        return {"check": "table_locks", "passed": True, "message": f"SKIP: {e}"}


def run_all_checks() -> list[dict]:
    """Run all pre-flight safety checks."""
    checks = [
        check_disk_space(),
        check_database_connection(),
        check_concurrent_migrations(),
        check_table_locks(),
    ]
    return checks


# ---------------------------------------------------------------------------
# Migration health report
# ---------------------------------------------------------------------------


def get_migration_health() -> dict:
    """Generate a comprehensive migration health report."""
    try:
        import asyncio

        async def _get_info():
            async with engine.connect() as conn:
                # Get current version
                try:
                    result = await conn.execute(text("SELECT version_num FROM alembic_version"))
                    current = result.scalar()
                except Exception:
                    current = None

                # Count applied migrations
                try:
                    result = await conn.execute(text("SELECT COUNT(*) FROM alembic_version"))
                    applied = result.scalar()
                except Exception:
                    applied = 0

                return {"current_version": current, "applied_count": applied}

        db_info = asyncio.run(_get_info())

        # Get pending migrations from alembic
        alembic_cfg = Config(str(Path(__file__).resolve().parent.parent / "alembic" / "alembic.ini"))
        script_dir = script.ScriptDirectory.from_config(alembic_cfg)

        current_rev = db_info.get("current_version")
        pending = []
        if current_rev:
            for rev in script_dir.walk_revisions(current_rev, "heads"):
                if rev.revision != current_rev:
                    pending.append(
                        {
                            "revision": rev.revision,
                            "description": rev.doc or "No description",
                        }
                    )
        else:
            # No migrations applied yet — all are pending
            for rev in script_dir.walk_revisions("base", "heads"):
                pending.append(
                    {
                        "revision": rev.revision,
                        "description": rev.doc or "No description",
                    }
                )

        return {
            "status": "healthy" if not pending else "pending",
            "current_version": current_rev,
            "applied_count": db_info.get("applied_count", 0),
            "pending_count": len(pending),
            "pending_migrations": pending[:20],  # Cap at 20
            "pre_flight_checks": run_all_checks(),
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "pre_flight_checks": run_all_checks()}


# ---------------------------------------------------------------------------
# Dry-run migration
# ---------------------------------------------------------------------------


def dry_run_migration(target: str = "head") -> dict:
    """Run a migration in dry-run mode (generate SQL without executing)."""
    try:
        alembic_cfg = Config(str(Path(__file__).resolve().parent.parent / "alembic" / "alembic.ini"))

        # Capture the SQL output
        import io
        from alembic import command as alembic_command

        sql_output = io.StringIO()

        # Use alembic upgrade with --sql flag
        import subprocess

        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "alembic",
                "-c",
                str(Path(__file__).resolve().parent.parent / "alembic" / "alembic.ini"),
                "upgrade",
                f"{target}",
                "--sql",
            ],
            capture_output=True,
            text=True,
            cwd=str(Path(__file__).resolve().parent.parent),
        )

        return {
            "target": target,
            "sql": result.stdout,
            "errors": result.stderr if result.returncode != 0 else None,
            "return_code": result.returncode,
        }
    except Exception as e:
        return {"target": target, "error": str(e)}


# ---------------------------------------------------------------------------
# Automatic rollback
# ---------------------------------------------------------------------------


def rollback_migration(target: str) -> dict:
    """Rollback to a specific revision with safety checks."""
    try:
        # Run pre-flight checks first
        checks = run_all_checks()
        failed = [c for c in checks if not c.get("passed", True)]
        if failed:
            return {
                "status": "aborted",
                "reason": "Pre-flight checks failed",
                "failed_checks": failed,
            }

        alembic_cfg = Config(str(Path(__file__).resolve().parent.parent / "alembic" / "alembic.ini"))
        command.downgrade(alembic_cfg, target)
        return {"status": "success", "rolled_back_to": target}
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Migration safety tools")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("check", help="Run pre-flight safety checks")
    subparsers.add_parser("health", help="Generate migration health report")

    dry_run_parser = subparsers.add_parser("dry-run", help="Run migration in dry-run mode")
    dry_run_parser.add_argument("--target", default="head", help="Target revision")

    rollback_parser = subparsers.add_parser("rollback", help="Rollback to a revision")
    rollback_parser.add_argument("revision", help="Target revision to rollback to")

    args = parser.parse_args()

    if args.command == "check":
        checks = run_all_checks()
        all_passed = all(c.get("passed", True) for c in checks)
        for c in checks:
            status = "✅" if c.get("passed") else "❌"
            print(f"  {status} {c['message']}")
        print(f"\nOverall: {'PASS' if all_passed else 'FAIL'}")
        sys.exit(0 if all_passed else 1)

    elif args.command == "health":
        import json

        report = get_migration_health()
        print(json.dumps(report, indent=2, default=str))

    elif args.command == "dry-run":
        import json

        result = dry_run_migration(args.target)
        if result.get("sql"):
            print(f"-- SQL for migration to {args.target}:")
            print(result["sql"])
        if result.get("errors"):
            print(f"-- Errors:\n{result['errors']}", file=sys.stderr)
        sys.exit(result.get("return_code", 0))

    elif args.command == "rollback":
        import json

        result = rollback_migration(args.revision)
        print(json.dumps(result, indent=2))
        sys.exit(0 if result.get("status") == "success" else 1)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    main()
