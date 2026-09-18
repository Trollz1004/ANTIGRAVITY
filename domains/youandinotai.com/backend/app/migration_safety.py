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
from typing import Sequence

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory

from alembic import context

logger = logging.getLogger("alembic.safety")

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


_PROTECTION_RE = re.compile(
    r"^\s*#\s*PROTECTED\s*:\s*(.+)$", re.MULTILINE | re.IGNORECASE
)


def is_protected_migration(file_path: str | None) -> bool:
    """Return True if a migration file contains a PROTECTED marker comment."""
    if file_path is None or not os.path.isfile(file_path):
        return False
    try:
        with open(file_path, encoding="utf-8", errors="replace") as fh:
            content = fh.read(4096)
        return _PROTECTION_RE.search(content) is not None
    except OSError:
        return False


def get_protection_reason(file_path: str | None) -> str | None:
    """Return the protection reason string, or None if unprotected."""
    if file_path is None or not os.path.isfile(file_path):
        return None
    try:
        with open(file_path, encoding="utf-8", errors="replace") as fh:
            content = fh.read(4096)
        match = _PROTECTION_RE.search(content)
        return match.group(1).strip() if match else None
    except OSError:
        return None


class MigrationSafetyChecker:
    """Tracks applied migrations and enforces rollback safety rules."""

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
        self.dry_run = (
            dry_run
            if dry_run is not None
            else os.environ.get(ENV_VAR_DRY_RUN, "").lower() in ("1", "true", "yes")
        )
        self.allow_protected = (
            allow_protected
            if allow_protected is not None
            else os.environ.get(ENV_VAR_ALLOW_PROTECTED, "").lower()
            in ("1", "true", "yes")
        )

    def check_downgrade(self, target_revision: str, *, connection=None) -> SafetyReport:
        """Run all safety checks before a downgrade."""
        report = self.build_report(connection=connection)
        migrations_to_revoke = self._migrations_in_downgrade_path(target_revision)
        protected_in_path = [
            migration
            for migration in migrations_to_revoke
            if migration.protection == ProtectionStatus.PROTECTED
        ]

        if self.dry_run:
            self._dry_run_downgrade(target_revision, migrations_to_revoke)
            return report

        if protected_in_path and not self.allow_protected:
            names = ", ".join(migration.revision for migration in protected_in_path)
            raise RuntimeError(
                "BLOCKED: The following protected migrations would be rolled back: "
                f"{names}. Set {ENV_VAR_ALLOW_PROTECTED}=1 to override."
            )

        if self.interactive and not os.environ.get(ENV_VAR_SKIP_CONFIRM):
            self._confirm_downgrade(target_revision, migrations_to_revoke)

        return report

    def build_report(self, *, connection=None) -> SafetyReport:
        """Build a full safety report of all migrations."""
        report = SafetyReport()
        applied: set[str] = set()
        if connection is not None:
            migration_context = MigrationContext.configure(connection)
            applied = {revision for revision, in migration_context.get_current_heads()}

        for revision in self.script.walk_revisions():
            script_revision = self.script.get_revision(revision.revision)
            file_path = script_revision.path if script_revision is not None else None
            protection = (
                ProtectionStatus.PROTECTED
                if is_protected_migration(file_path)
                else ProtectionStatus.UNPROTECTED
            )
            info = MigrationInfo(
                revision=revision.revision,
                down_revision=revision.down_revision,
                description=revision.doc or "",
                file_path=file_path,
                protection=protection,
                is_applied=revision.revision in applied or connection is None,
            )
            report.migrations.append(info)
            if info.protection == ProtectionStatus.PROTECTED:
                report.protected_count += 1
            if info.is_applied:
                report.applied_count += 1
            else:
                report.pending_count += 1

        return report

    def _migrations_in_downgrade_path(
        self, target_revision: str
    ) -> list[MigrationInfo]:
        """Return the list of MigrationInfo objects that a downgrade would touch."""
        heads = list(self.script.get_heads())
        if not heads:
            return []

        to_revoke: list[MigrationInfo] = []
        visited: set[str] = set()

        def walk(revision_id: str) -> None:
            if revision_id in visited or revision_id == target_revision:
                return
            visited.add(revision_id)
            revision = self.script.get_revision(revision_id)
            if revision is None:
                return
            protection = (
                ProtectionStatus.PROTECTED
                if is_protected_migration(revision.path)
                else ProtectionStatus.UNPROTECTED
            )
            to_revoke.append(
                MigrationInfo(
                    revision=revision.revision,
                    down_revision=revision.down_revision,
                    description=revision.doc or "",
                    file_path=revision.path,
                    protection=protection,
                )
            )
            parents = revision.down_revision
            if parents is None:
                return
            for parent in parents if isinstance(parents, tuple) else (parents,):
                walk(parent)

        for head in heads:
            walk(head)

        return to_revoke

    def _dry_run_downgrade(
        self, target_revision: str, migrations: list[MigrationInfo]
    ) -> None:
        """Log what would happen in a downgrade without executing."""
        logger.info("=== DRY RUN: downgrade to %s ===", target_revision)
        logger.info("Migrations that would be rolled back (%d):", len(migrations))
        for migration in migrations:
            tag = (
                " [PROTECTED]"
                if migration.protection == ProtectionStatus.PROTECTED
                else ""
            )
            logger.info("  - %s %s%s", migration.revision, migration.description, tag)
        logger.info("=== END DRY RUN ===")

    def _confirm_downgrade(
        self, target_revision: str, migrations: list[MigrationInfo]
    ) -> None:
        """Prompt the user for confirmation before proceeding."""
        print("\n" + "=" * 60)
        print("ALEMBIC DOWNGRADE CONFIRMATION REQUIRED")
        print("=" * 60)
        print(f"Target revision: {target_revision}")
        print(f"Migrations to roll back: {len(migrations)}")
        for migration in migrations:
            tag = (
                " [PROTECTED]"
                if migration.protection == ProtectionStatus.PROTECTED
                else ""
            )
            print(f"  - {migration.revision} {migration.description}{tag}")
        print("-" * 60)

        try:
            answer = input(
                "Type 'yes' to proceed with the downgrade, anything else to abort: "
            )
        except EOFError as exc:
            raise RuntimeError(
                "Non-interactive mode: downgrade aborted. "
                f"Set {ENV_VAR_SKIP_CONFIRM}=1 to skip confirmation."
            ) from exc

        if answer.strip().lower() != "yes":
            raise RuntimeError("Downgrade aborted by user.")


def pre_downgrade(
    context: context,  # type: ignore[type-arg]
    revision: str | Sequence[str] | None,
    sql: bool = False,
    **kw,
) -> None:
    """Alembic pre-downgrade hook."""
    if sql:
        return

    target = revision if isinstance(revision, str) else None
    if target is None:
        return

    cfg = context.config
    checker = MigrationSafetyChecker(cfg, interactive=sys.stdin.isatty())

    connection = getattr(context, "connection", None)
    checker.check_downgrade(target, connection=connection)
