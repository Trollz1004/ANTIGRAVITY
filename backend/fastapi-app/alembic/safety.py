"""Migration rollback safety checks for Alembic.

Provides:
- MigrationSafetyChecker: tracks applied migrations and protects critical ones.
- Confirmation prompt before downgrade/rollback operations.
- Dry-run mode that shows SQL without executing it.
- Protection markers in migration files (# PROTECTED: production-critical).
- pre_downgrade hook that blocks rollback of protected migrations.
"""

from __future__ import annotations

import logging
import os
import re
import sys
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Optional, Sequence

from alembic import command, context
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import text

logger = logging.getLogger("alembic.safety")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PROTECTION_MARKER = "# PROTECTED"
PROTECTION_COMMENT = "# PROTECTED: production-critical"
ENV_VAR_SKIP_CONFIRM = "ALEMBIC_SKIP_DOWNGRADE_CONFIRM"
ENV_VAR_DRY_RUN = "ALEMBIC_DRY_RUN"
ENV_VAR_ALLOW_PROTECTED = "ALEMBIC_ALLOW_PROTECTED_DOWNGRADE"


class ProtectionStatus(Enum):
    """Protection level of a migration."""

    UNPROTECTED = "unprotected"
    PROTECTED = "protected"


@dataclass
class MigrationInfo:
    """Metadata about a single migration revision."""

    revision: str
    down_revision: str | None
    description: str
    file_path: str | None
    protection: ProtectionStatus
    is_applied: bool = False


@dataclass
class SafetyReport:
    """Aggregated safety report for all migrations."""

    migrations: list[MigrationInfo] = field(default_factory=list)
    protected_count: int = 0
    applied_count: int = 0
    pending_count: int = 0

    @property
    def has_protected(self) -> bool:
        return self.protected_count > 0


# ---------------------------------------------------------------------------
# Protection marker detection
# ---------------------------------------------------------------------------

_PROTECTION_RE = re.compile(
    r"^\s*#\s*PROTECTED\s*:\s*(.+)$", re.MULTILINE | re.IGNORECASE
)


def is_protected_migration(file_path: str | None) -> bool:
    """Return True if a migration file contains a PROTECTED marker comment."""
    if file_path is None or not os.path.isfile(file_path):
        return False
    try:
        with open(file_path, "r", encoding="utf-8") as fh:
            content = fh.read(4096)  # only need the header
        return _PROTECTION_RE.search(content) is not None
    except OSError:
        return False


def get_protection_reason(file_path: str | None) -> str | None:
    """Return the protection reason string, or None if unprotected."""
    if file_path is None or not os.path.isfile(file_path):
        return None
    try:
        with open(file_path, "r", encoding="utf-8") as fh:
            content = fh.read(4096)
        m = _PROTECTION_RE.search(content)
        return m.group(1).strip() if m else None
    except OSError:
        return None


# ---------------------------------------------------------------------------
# Safety checker
# ---------------------------------------------------------------------------

class MigrationSafetyChecker:
    """Tracks applied migrations and enforces rollback safety rules.

    Usage::

        checker = MigrationSafetyChecker(alembic_cfg)
        checker.check_downgrade(target_revision)
    """

    def __init__(
        self,
        alembic_cfg: Config,
        *,
        interactive: bool = True,
        dry_run: bool | None = None,
        allow_protected: bool | None = None,
    ):
        self.cfg = alembic_cfg
        self.script = ScriptDirectory.from_config(alembic_cfg)
        self.interactive = interactive
        # Dry-run: explicit arg > env var > default False
        if dry_run is not None:
            self.dry_run = dry_run
        else:
            self.dry_run = os.environ.get(ENV_VAR_DRY_RUN, "").lower() in (
                "1", "true", "yes"
            )
        # Allow protected: explicit arg > env var > default False
        if allow_protected is not None:
            self.allow_protected = allow_protected
        else:
            self.allow_protected = os.environ.get(
                ENV_VAR_ALLOW_PROTECTED, ""
            ).lower() in ("1", "true", "yes")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def check_downgrade(
        self,
        target_revision: str,
        *,
        connection=None,
    ) -> SafetyReport:
        """Run all safety checks before a downgrade.

        Raises RuntimeError if the downgrade should be blocked.
        Returns a SafetyReport on success.
        """
        report = self.build_report(connection=connection)

        # Determine which migrations would be rolled back
        migrations_to_revoke = self._migrations_in_downgrade_path(target_revision)

        # Check for protected migrations in the path
        protected_in_path = [
            m for m in migrations_to_revoke
            if m.protection == ProtectionStatus.PROTECTED
        ]

        if protected_in_path and not self.allow_protected:
            names = ", ".join(m.revision for m in protected_in_path)
            raise RuntimeError(
                f"BLOCKED: The following protected migrations would be rolled back: "
                f"{names}. Set {ENV_VAR_ALLOW_PROTECTED}=1 to override."
            )

        # Dry-run mode
        if self.dry_run:
            self._dry_run_downgrade(target_revision, migrations_to_revoke)
            return report

        # Interactive confirmation
        if self.interactive and not os.environ.get(ENV_VAR_SKIP_CONFIRM):
            self._confirm_downgrade(target_revision, migrations_to_revoke)

        return report

    def build_report(
        self, *, connection=None
    ) -> SafetyReport:
        """Build a full safety report of all migrations."""
        report = SafetyReport()

        # Determine applied revisions
        applied: set[str] = set()
        if connection is not None:
            mc = MigrationContext.configure(connection)
            applied = {r for r, in mc.get_current_heads()}
        # If no connection, fall back to head comparison (best-effort)

        for rev in self.script.walk_revisions():
            file_path = self.script.get_revision(rev.revision).path
            prot = (
                ProtectionStatus.PROTECTED
                if is_protected_migration(file_path)
                else ProtectionStatus.UNPROTECTED
            )
            info = MigrationInfo(
                revision=rev.revision,
                down_revision=rev.down_revision,
                description=rev.doc or "",
                file_path=file_path,
                protection=prot,
                is_applied=rev.revision in applied or bool(
                    connection is None
                ),  # assume applied if no connection
            )
            report.migrations.append(info)
            if info.protection == ProtectionStatus.PROTECTED:
                report.protected_count += 1
            if info.is_applied:
                report.applied_count += 1
            else:
                report.pending_count += 1

        return report

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _migrations_in_downgrade_path(
        self, target_revision: str
    ) -> list[MigrationInfo]:
        """Return the list of MigrationInfo objects that a downgrade would touch."""
        heads = list(self.script.get_heads())
        if not heads:
            return []

        # Walk from each head down to target_revision
        to_revoke: list[MigrationInfo] = []
        visited: set[str] = set()

        def _walk(rev_id: str) -> None:
            if rev_id in visited or rev_id == target_revision:
                return
            visited.add(rev_id)
            rev = self.script.get_revision(rev_id)
            if rev is None:
                return
            file_path = rev.path
            prot = (
                ProtectionStatus.PROTECTED
                if is_protected_migration(file_path)
                else ProtectionStatus.UNPROTECTED
            )
            to_revoke.append(
                MigrationInfo(
                    revision=rev.revision,
                    down_revision=rev.down_revision,
                    description=rev.doc or "",
                    file_path=file_path,
                    protection=prot,
                )
            )
            # Walk parents
            for parent_rev in (rev.down_revision,) if rev.down_revision else ():
                if isinstance(parent_rev, tuple):
                    for p in parent_rev:
                        _walk(p)
                else:
                    _walk(parent_rev)

        for head in heads:
            _walk(head)

        return to_revoke

    def _dry_run_downgrade(
        self,
        target_revision: str,
        migrations: list[MigrationInfo],
    ) -> None:
        """Print what would happen in a downgrade without executing."""
        logger.info("=== DRY RUN: downgrade to %s ===", target_revision)
        logger.info("Migrations that would be rolled back (%d):", len(migrations))
        for m in migrations:
            tag = " [PROTECTED]" if m.protection == ProtectionStatus.PROTECTED else ""
            logger.info("  -%s %s%s", m.revision, m.description, tag)
        logger.info("=== END DRY RUN ===")
        # In dry-run mode we do NOT raise — the caller decides whether to proceed.

    def _confirm_downgrade(
        self,
        target_revision: str,
        migrations: list[MigrationInfo],
    ) -> None:
        """Prompt the user for confirmation before proceeding."""
        print("\n" + "=" * 60)
        print("⚠️  ALEMBIC DOWNGRADE CONFIRMATION REQUIRED")
        print("=" * 60)
        print(f"Target revision: {target_revision}")
        print(f"Migrations to roll back: {len(migrations)}")
        for m in migrations:
            tag = " [PROTECTED]" if m.protection == ProtectionStatus.PROTECTED else ""
            print(f"  - {m.revision} {m.description}{tag}")
        print("-" * 60)

        try:
            answer = input(
                "Type 'yes' to proceed with the downgrade, anything else to abort: "
            )
        except EOFError:
            raise RuntimeError(
                "Non-interactive mode: downgrade aborted. "
                f"Set {ENV_VAR_SKIP_CONFIRM}=1 to skip confirmation."
            )

        if answer.strip().lower() != "yes":
            raise RuntimeError("Downgrade aborted by user.")


# ---------------------------------------------------------------------------
# Hook for env.py integration
# ---------------------------------------------------------------------------

def pre_downgrade(
    context: context,  # type: ignore[type-arg]
    revision: str | Sequence[str] | None,
    sql: bool = False,
    **kw,
) -> None:
    """Alembic pre-downgrade hook.

    Import and call this from env.py's ``context.configure`` or as a
    ``process_revision_directives`` callback.

    In offline (SQL) mode the hook is a no-op so that ``alembic upgrade --sql``
    still works.
    """
    if sql:
        return  # offline SQL generation — nothing to check

    # Determine the effective alembic config
    cfg = context.config
    checker = MigrationSafetyChecker(cfg, interactive=sys.stdin.isatty())

    # Resolve target
    target = revision if isinstance(revision, str) else None
    if target is None:
        return  # no specific target — let Alembic resolve

    # Use the live connection from the migration context
    connection = getattr(context, "connection", None)
    checker.check_downgrade(target, connection=connection)
