"""Tests for migration rollback safety checks (OPU-131)."""

from __future__ import annotations

# Ensure the app root is importable
import sys
import textwrap
from pathlib import Path
from unittest.mock import MagicMock

import pytest

APP_ROOT = Path(__file__).resolve().parent.parent
if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))

from app.migration_safety import (
    ENV_VAR_ALLOW_PROTECTED,
    ENV_VAR_DRY_RUN,
    PROTECTION_COMMENT,
    MigrationSafetyChecker,
    ProtectionStatus,
    SafetyReport,
    get_protection_reason,
    is_protected_migration,
    pre_downgrade,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def tmp_migration_dir(tmp_path):
    """Create a temporary directory with sample migration files."""
    versions = tmp_path / "versions"
    versions.mkdir()

    # Unprotected migration
    (versions / "001_initial.py").write_text(textwrap.dedent("""\
        \"\"\"initial

        Revision ID: 001
        Revises:
        Create Date: 2026-01-01

        \"\"\"

        from alembic import op
        import sqlalchemy as sa

        revision = "001"
        down_revision = None

        def upgrade():
            pass

        def downgrade():
            pass
    """))

    # Protected migration
    (versions / "002_add_users.py").write_text(textwrap.dedent(f"""\
        \"\"\"add users table

        Revision ID: 002
        Revises: 001
        Create Date: 2026-01-02

        {PROTECTION_COMMENT}
        \"\"\"

        from alembic import op
        import sqlalchemy as sa

        revision = "002"
        down_revision = "001"

        def upgrade():
            pass

        def downgrade():
            pass
    """))

    # Protected migration with custom reason
    (versions / "003_add_payments.py").write_text(textwrap.dedent("""\
        \"\"\"add payments

        Revision ID: 003
        Revises: 002
        Create Date: 2026-01-03

        # PROTECTED: contains financial data — irreversible
        \"\"\"

        from alembic import op
        import sqlalchemy as sa

        revision = "003"
        down_revision = "002"

        def upgrade():
            pass

        def downgrade():
            pass
    """))

    return versions


# ---------------------------------------------------------------------------
# Tests: is_protected_migration
# ---------------------------------------------------------------------------


class TestIsProtectedMigration:
    def test_detects_protected_marker(self, tmp_migration_dir):
        path = str(tmp_migration_dir / "002_add_users.py")
        assert is_protected_migration(path) is True

    def test_unprotected_migration(self, tmp_migration_dir):
        path = str(tmp_migration_dir / "001_initial.py")
        assert is_protected_migration(path) is False

    def test_nonexistent_file(self):
        assert is_protected_migration("/nonexistent/path.py") is False

    def test_none_path(self):
        assert is_protected_migration(None) is False

    def test_custom_protection_reason(self, tmp_migration_dir):
        path = str(tmp_migration_dir / "003_add_payments.py")
        assert is_protected_migration(path) is True


# ---------------------------------------------------------------------------
# Tests: get_protection_reason
# ---------------------------------------------------------------------------


class TestGetProtectionReason:
    def test_returns_reason_for_protected(self, tmp_migration_dir):
        path = str(tmp_migration_dir / "002_add_users.py")
        reason = get_protection_reason(path)
        assert reason is not None
        assert "production-critical" in reason

    def test_returns_none_for_unprotected(self, tmp_migration_dir):
        path = str(tmp_migration_dir / "001_initial.py")
        assert get_protection_reason(path) is None

    def test_returns_none_for_nonexistent(self):
        assert get_protection_reason("/nonexistent/path.py") is None

    def test_custom_reason(self, tmp_migration_dir):
        path = str(tmp_migration_dir / "003_add_payments.py")
        reason = get_protection_reason(path)
        assert reason is not None
        assert "financial data" in reason


# ---------------------------------------------------------------------------
# Tests: MigrationSafetyChecker
# ---------------------------------------------------------------------------


class TestMigrationSafetyChecker:
    def _make_checker(self, tmp_path, **kwargs):
        """Create a MigrationSafetyChecker with a real ScriptDirectory."""
        from alembic.config import Config

        versions_dir = tmp_path / "versions"
        versions_dir.mkdir(exist_ok=True)

        # Write alembic.ini
        ini_path = tmp_path / "alembic.ini"
        ini_path.write_text(textwrap.dedent(f"""\
            [alembic]
            script_location = {tmp_path}
            version_path_separator = os

            [loggers]
            keys = root

            [handlers]
            keys = console

            [formatters]
            keys = generic

            [logger_root]
            level = WARNING
            handlers = console

            [handler_console]
            class = StreamHandler
            args = (sys.stderr,)
            level = NOTSET
            formatter = generic

            [formatter_generic]
            format = %(levelname)-5.5s [%(name)s] %(message)s
            """))

        cfg = Config(str(ini_path))
        interactive = kwargs.pop("interactive", False)
        checker = MigrationSafetyChecker(cfg, interactive=interactive, **kwargs)
        return checker

    def _write_migration(self, versions_dir, name, content):
        versions_dir.mkdir(parents=True, exist_ok=True)
        (versions_dir / name).write_text(content)

    def test_build_report_detects_protection(self, tmp_path):
        checker = self._make_checker(tmp_path)
        report = checker.build_report()
        # No migrations yet — empty report
        assert report.migrations == []
        assert report.protected_count == 0

    def test_build_report_with_protected_migration(self, tmp_path):
        versions_dir = tmp_path / "versions"
        self._write_migration(
            versions_dir,
            "abc123_add_users.py",
            textwrap.dedent(f'''\
            """add users table

            Revision ID: abc123
            Revises:
            Create Date: 2026-01-01 00:00:00.000000

            {PROTECTION_COMMENT}
            """

            from alembic import op
            import sqlalchemy as sa

            revision = "abc123"
            down_revision = None

            def upgrade():
                pass

            def downgrade():
                pass
        '''),
        )
        checker = self._make_checker(tmp_path)
        report = checker.build_report()
        assert len(report.migrations) == 1
        assert report.migrations[0].protection == ProtectionStatus.PROTECTED
        assert report.protected_count == 1

    def test_check_downgrade_blocks_protected(self, tmp_path):
        versions_dir = tmp_path / "versions"
        self._write_migration(
            versions_dir,
            "abc123_initial.py",
            textwrap.dedent('''\
            """initial

            Revision ID: abc123
            Revises:
            Create Date: 2026-01-01 00:00:00.000000

            """

            from alembic import op

            revision = "abc123"
            down_revision = None

            def upgrade():
                pass

            def downgrade():
                pass
        '''),
        )
        self._write_migration(
            versions_dir,
            "def456_protected.py",
            textwrap.dedent(f'''\
            """protected migration

            Revision ID: def456
            Revises: abc123
            Create Date: 2026-01-02 00:00:00.000000

            {PROTECTION_COMMENT}
            """

            from alembic import op

            revision = "def456"
            down_revision = "abc123"

            def upgrade():
                pass

            def downgrade():
                pass
        '''),
        )
        checker = self._make_checker(tmp_path, interactive=False)
        with pytest.raises(RuntimeError, match="BLOCKED"):
            checker.check_downgrade("abc123")

    def test_check_downgrade_allows_unprotected(self, tmp_path):
        versions_dir = tmp_path / "versions"
        self._write_migration(
            versions_dir,
            "abc123_initial.py",
            textwrap.dedent('''\
            """initial

            Revision ID: abc123
            Revises:
            Create Date: 2026-01-01 00:00:00.000000

            """

            from alembic import op

            revision = "abc123"
            down_revision = None

            def upgrade():
                pass

            def downgrade():
                pass
        '''),
        )
        self._write_migration(
            versions_dir,
            "def456_unprotected.py",
            textwrap.dedent('''\
            """unprotected migration

            Revision ID: def456
            Revises: abc123
            Create Date: 2026-01-02 00:00:00.000000

            """

            from alembic import op

            revision = "def456"
            down_revision = "abc123"

            def upgrade():
                pass

            def downgrade():
                pass
        '''),
        )
        checker = self._make_checker(tmp_path, interactive=False)
        # Should NOT raise
        report = checker.check_downgrade("abc123")
        assert isinstance(report, SafetyReport)

    def test_check_downgrade_allows_protected_with_override(self, tmp_path):
        versions_dir = tmp_path / "versions"
        self._write_migration(
            versions_dir,
            "abc123_initial.py",
            textwrap.dedent('''\
            """initial

            Revision ID: abc123
            Revises:
            Create Date: 2026-01-01 00:00:00.000000

            """

            from alembic import op

            revision = "abc123"
            down_revision = None

            def upgrade():
                pass

            def downgrade():
                pass
        '''),
        )
        self._write_migration(
            versions_dir,
            "def456_protected.py",
            textwrap.dedent(f'''\
            """protected migration

            Revision ID: def456
            Revises: abc123
            Create Date: 2026-01-02 00:00:00.000000

            {PROTECTION_COMMENT}
            """

            from alembic import op

            revision = "def456"
            down_revision = "abc123"

            def upgrade():
                pass

            def downgrade():
                pass
        '''),
        )
        checker = self._make_checker(tmp_path, interactive=False, allow_protected=True)
        # Should NOT raise because allow_protected=True
        report = checker.check_downgrade("abc123")
        assert isinstance(report, SafetyReport)

    def test_dry_run_does_not_raise(self, tmp_path, caplog):
        versions_dir = tmp_path / "versions"
        self._write_migration(
            versions_dir,
            "abc123_initial.py",
            textwrap.dedent('''\
            """initial"""

            from alembic import op

            revision = "abc123"
            down_revision = None

            def upgrade():
                pass

            def downgrade():
                pass
        '''),
        )
        self._write_migration(
            versions_dir,
            "def456_protected.py",
            textwrap.dedent(f'''\
            """protected"""

            from alembic import op

            revision = "def456"
            down_revision = "abc123"

            {PROTECTION_COMMENT}

            def upgrade():
                pass

            def downgrade():
                pass
        '''),
        )
        checker = self._make_checker(tmp_path, interactive=False, dry_run=True)
        # Dry run should NOT raise even for protected
        report = checker.check_downgrade("abc123")
        assert isinstance(report, SafetyReport)

    def test_env_var_dry_run(self, tmp_path, monkeypatch):
        monkeypatch.setenv(ENV_VAR_DRY_RUN, "1")
        checker = self._make_checker(tmp_path)
        assert checker.dry_run is True

    def test_env_var_allow_protected(self, tmp_path, monkeypatch):
        monkeypatch.setenv(ENV_VAR_ALLOW_PROTECTED, "1")
        checker = self._make_checker(tmp_path)
        assert checker.allow_protected is True


# ---------------------------------------------------------------------------
# Tests: pre_downgrade hook
# ---------------------------------------------------------------------------


class TestPreDowngrade:
    def test_noop_in_sql_mode(self):
        """pre_downgrade should be a no-op when sql=True (offline mode)."""
        ctx = MagicMock()
        # Should not raise
        pre_downgrade(ctx, "some_revision", sql=True)

    def test_noop_when_no_revision(self):
        """pre_downgrade should be a no-op when revision is None."""
        ctx = MagicMock()
        ctx.config = MagicMock()
        # Should not raise
        pre_downgrade(ctx, None, sql=False)


# ---------------------------------------------------------------------------
# Tests: SafetyReport
# ---------------------------------------------------------------------------


class TestSafetyReport:
    def test_has_protected_false_when_empty(self):
        report = SafetyReport()
        assert report.has_protected is False

    def test_has_protected_true_when_protected(self):
        report = SafetyReport(protected_count=1)
        assert report.has_protected is True

    def test_default_counts(self):
        report = SafetyReport()
        assert report.migrations == []
        assert report.protected_count == 0
        assert report.applied_count == 0
        assert report.pending_count == 0
