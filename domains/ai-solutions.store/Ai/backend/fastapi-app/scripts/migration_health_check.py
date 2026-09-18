#!/usr/bin/env python3
"""Migration health check script.

Checks the current Alembic revision against the head revision and reports
any pending migrations. Intended for use as a pre-deploy gate in CI/CD.

Exit codes:
  0 - Database is up to date (no pending migrations)
  1 - Pending migrations detected or connection error
"""

from __future__ import annotations

import os
import sys

# Ensure the app package is importable when run from the repo root or scripts/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory

from app.config import get_settings


def get_head_revision(alembic_cfg: Config) -> str:
    """Return the head (latest) revision from the script directory."""
    script = ScriptDirectory.from_config(alembic_cfg)
    return script.get_current_head()


def get_current_revision(database_url: str, alembic_cfg: Config) -> str | None:
    """Return the current revision stored in the database, or None if not set."""
    from sqlalchemy.ext.asyncio import create_async_engine

    db_url = database_url
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    import asyncio

    async def _query() -> str | None:
        engine = create_async_engine(db_url, pool_pre_ping=True)
        try:
            async with engine.connect() as conn:

                def _get_rev(sync_conn):
                    context = MigrationContext.configure(sync_conn)
                    return context.get_current_revision()

                return await conn.run_sync(_get_rev)
        finally:
            await engine.dispose()

    return asyncio.run(_query())


def main() -> int:
    """Run the health check and print results. Returns exit code."""
    settings = get_settings()
    database_url = settings.primary_database_url

    alembic_cfg = Config(
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "alembic.ini")
    )

    head = get_head_revision(alembic_cfg)
    current = get_current_revision(database_url, alembic_cfg)

    print("=" * 60)
    print("  Migration Health Check")
    print("=" * 60)
    print(f"  Head revision : {head}")
    print(f"  Current rev   : {current}")
    print("-" * 60)

    if current is None:
        print("  Status: ⚠️  No revision recorded — database may be uninitialized.")
        print("  Action: Run `alembic upgrade head` to apply all migrations.")
        print("=" * 60)
        return 1

    if current == head:
        print("  Status: ✅ Up to date — no pending migrations.")
        print("=" * 60)
        return 0

    # Determine pending revisions
    script = ScriptDirectory.from_config(alembic_cfg)
    pending = []
    for rev in script.walk_revisions(base=head, head=current):
        pending.append(rev)
    # walk_revisions yields from newest to oldest; reverse for display
    pending.reverse()

    print(f"  Status: ⚠️  {len(pending)} pending migration(s):")
    for rev in pending:
        print(f"    → {rev.revision} : {rev.doc}")
    print("  Action: Run `alembic upgrade head` to apply pending migrations.")
    print("=" * 60)
    return 1


if __name__ == "__main__":
    sys.exit(main())
