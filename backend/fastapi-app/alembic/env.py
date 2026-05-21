import asyncio
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncEngine

from alembic import context

# Import models and settings
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import Base
from app.models import *  # ensure all models are imported
from app.config import get_settings

# ---------------------------------------------------------------------------
# Migration safety checks (OPU-131)
# ---------------------------------------------------------------------------
from alembic.safety import MigrationSafetyChecker, ENV_VAR_DRY_RUN

settings = get_settings()

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def _run_safety_check() -> None:
    """Run pre-downgrade safety checks before any migration executes.

    Reads the target revision from Alembic's context and checks whether
    the downgrade would roll back any protected migrations.
    """
    # Only act on downgrade operations
    if context.is_offline_mode():
        return  # offline mode — safety checks handled separately

    # Determine if this is a downgrade by inspecting the current operation
    # Alembic sets context.config.cmd_opts or we can check the revision range
    # We hook into do_run_migrations which receives the connection.
    pass  # actual check is performed in do_run_migrations below


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() will emit the HRD for the
    script to a buffer.

    """
    url = settings.database_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    # ------------------------------------------------------------------
    # OPU-131: Pre-downgrade safety check
    # ------------------------------------------------------------------
    # Determine the target revision from Alembic's command context.
    # If the user is running a downgrade, cmd_opts.revision will be set.
    cfg = config
    cmd_opts = getattr(cfg, "cmd_opts", None)
    if cmd_opts is not None:
        cmd = getattr(cmd_opts, "cmd", None)
        if cmd is not None:
            # Check if the command is a downgrade
            cmd_name = getattr(cmd[0], "__name__", "") if cmd else ""
            if "downgrade" in cmd_name.lower():
                target_rev = getattr(cmd_opts, "revision", None)
                if target_rev:
                    checker = MigrationSafetyChecker(
                        cfg,
                        interactive=True,
                        dry_run=None,  # respects ALEMBIC_DRY_RUN env var
                        allow_protected=None,  # respects ALEMBIC_ALLOW_PROTECTED_DOWNGRADE
                    )
                    checker.check_downgrade(target_rev, connection=connection)

    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = settings.database_url
    connectable = AsyncEngine(
        engine_from_config(
            configuration,
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
            future=True,
        )
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
