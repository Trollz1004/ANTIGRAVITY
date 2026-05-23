"""Migration management and health monitoring router.

Provides endpoints for:
- GET /api/v1/migrations/status — current migration state, pending count
- GET /api/v1/migrations/health — full health report with pre-flight checks
- POST /api/v1/migrations/dry-run — generate SQL without executing
- POST /api/v1/migrations/check — run pre-flight safety checks
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from app.auth import get_current_user
from app.database import engine

logger = logging.getLogger("youandinotai.api.migrations")

router = APIRouter(prefix="/api/v1/migrations", tags=["Migrations"])


async def _get_current_revision() -> str | None:
    """Get the current Alembic revision from the database."""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version_num FROM alembic_version"))
            return result.scalar()
    except Exception:
        return None


async def _get_applied_count() -> int:
    """Get the number of applied migrations."""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT COUNT(*) FROM alembic_version"))
            return result.scalar() or 0
    except Exception:
        return 0


@router.get("/status")
async def migration_status(
    current_user=Depends(get_current_user),
) -> dict[str, Any]:
    """Get current migration state."""
    current = await _get_current_revision()
    applied = await _get_applied_count()

    # Count pending migrations
    try:
        from pathlib import Path

        from alembic.config import Config
        from alembic.script import ScriptDirectory

        alembic_cfg = Config(
            str(Path(__file__).resolve().parent.parent / "alembic" / "alembic.ini")
        )
        script_dir = ScriptDirectory.from_config(alembic_cfg)

        pending_count = 0
        if current:
            for rev in script_dir.walk_revisions(current, "heads"):
                if rev.revision != current:
                    pending_count += 1
        else:
            for _rev in script_dir.walk_revisions("base", "heads"):
                pending_count += 1
    except Exception as e:
        logger.warning(f"Could not determine pending migrations: {e}")
        pending_count = -1

    return {
        "current_revision": current,
        "applied_count": applied,
        "pending_count": pending_count,
        "status": (
            "up_to_date"
            if pending_count == 0
            else "pending" if pending_count > 0 else "unknown"
        ),
    }


@router.get("/health")
async def migration_health(
    current_user=Depends(get_current_user),
) -> dict[str, Any]:
    """Get comprehensive migration health report with pre-flight checks."""
    try:
        from scripts.migration_safety import get_migration_health

        report = get_migration_health()
        return report
    except Exception as e:
        logger.error(f"Failed to generate migration health report: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {e}") from e


@router.post("/dry-run")
async def migration_dry_run(
    target: str = "head",
    current_user=Depends(get_current_user),
) -> dict[str, Any]:
    """Run a migration in dry-run mode (generate SQL without executing)."""
    try:
        from scripts.migration_safety import dry_run_migration

        result = dry_run_migration(target)
        if result.get("errors"):
            raise HTTPException(status_code=500, detail=result["errors"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dry run failed: {e}")
        raise HTTPException(status_code=500, detail=f"Dry run failed: {e}") from e


@router.post("/check")
async def migration_pre_flight_check(
    current_user=Depends(get_current_user),
) -> dict[str, Any]:
    """Run pre-flight safety checks before migration."""
    try:
        from scripts.migration_safety import run_all_checks

        checks = run_all_checks()
        all_passed = all(c.get("passed", True) for c in checks)
        return {
            "all_passed": all_passed,
            "checks": checks,
        }
    except Exception as e:
        logger.error(f"Pre-flight check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Check failed: {e}") from e
