"""Database engine and session utilities."""

from collections.abc import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.allocation_compat import ENGAGEMENT_SCORE_COLUMN, MEMBER_BADGE_COLUMN
from app.config import get_settings

settings = get_settings()

_database_url = settings.primary_database_url
if _database_url.startswith("postgresql://"):
    _database_url = _database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    _database_url,
    pool_pre_ping=True,
    **(
        {
            "pool_size": settings.db_pool_size,
            "max_overflow": settings.db_max_overflow,
            "pool_timeout": settings.db_pool_timeout,
            "pool_recycle": settings.db_pool_recycle,
        }
        if not _database_url.startswith("sqlite")
        else {}
    ),
    echo_pool=settings.app_env == "development",
)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Declarative base class for ORM models."""


async def get_db() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency that yields an async database session."""
    async with SessionLocal() as session:
        yield session


async def check_db_health() -> bool:
    """Return True when database can answer a trivial query."""
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def get_pool_status() -> dict:
    """Return connection pool statistics for monitoring."""
    pool = engine.pool
    return {
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
    }


async def reconcile_legacy_schema() -> None:
    """Backfill legacy production columns that newer code now depends on.

    Cloud Run deploys currently ship source code without running Alembic, so the
    live database can lag behind the ORM. These idempotent ALTERs close the gap
    for the specific columns that block auth, payments, and profile setup.
    """

    if settings.app_env.lower() == "test":
        return

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        # Create webhook retry tables (lazy import to avoid circular dependency)
        from app import webhook_retry as _wr

        await connection.run_sync(_wr.WebhookRetryQueue.metadata.create_all)

        if connection.dialect.name == "sqlite":
            await _reconcile_sqlite_schema(connection)
            return

        if connection.dialect.name != "postgresql":
            return

        statements = (
            "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100) DEFAULT 'User' NOT NULL",
            "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)",
            "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS square_customer_id VARCHAR(255)",
            "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS date_of_birth DATE",
            "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS adult_verified_at TIMESTAMPTZ",
            "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL",
            "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS bot_shield_verified BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50)",
            "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ",
            f"ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS {ENGAGEMENT_SCORE_COLUMN} FLOAT DEFAULT 0 NOT NULL",
            f"ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS {MEMBER_BADGE_COLUMN} VARCHAR(50)",
            "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE",
            "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS bio TEXT",
            "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS age INTEGER",
            "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(50)",
            "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS looking_for VARCHAR(50)",
            "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS location VARCHAR(200)",
            "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS photos JSON DEFAULT '[]'::json NOT NULL",
            "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS interests JSON DEFAULT '[]'::json NOT NULL",
            "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE NOT NULL",
            "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS location_enabled BOOLEAN DEFAULT TRUE NOT NULL",
            "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL",
            "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL",
            "ALTER TABLE IF EXISTS verification_events ADD COLUMN IF NOT EXISTS square_payment_id VARCHAR(255)",
            "ALTER TABLE IF EXISTS verification_events ADD COLUMN IF NOT EXISTS trust_score FLOAT",
            "ALTER TABLE IF EXISTS verification_events ADD COLUMN IF NOT EXISTS amount_cents INTEGER",
            "ALTER TABLE IF EXISTS webhook_events ADD COLUMN IF NOT EXISTS event_source_id VARCHAR(255)",
            "ALTER TABLE IF EXISTS webhook_events ADD COLUMN IF NOT EXISTS event_source VARCHAR(50) DEFAULT 'square' NOT NULL",
            "ALTER TABLE IF EXISTS swipes ADD COLUMN IF NOT EXISTS user_id UUID",
            "ALTER TABLE IF EXISTS swipes ADD COLUMN IF NOT EXISTS target_id UUID",
            "ALTER TABLE IF EXISTS swipes ADD COLUMN IF NOT EXISTS direction VARCHAR(10)",
            "ALTER TABLE IF EXISTS swipes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL",
            "ALTER TABLE IF EXISTS matches ADD COLUMN IF NOT EXISTS user_a UUID",
            "ALTER TABLE IF EXISTS matches ADD COLUMN IF NOT EXISTS user_b UUID",
            "ALTER TABLE IF EXISTS matches ADD COLUMN IF NOT EXISTS compatibility_score FLOAT",
            "ALTER TABLE IF EXISTS matches ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' NOT NULL",
            "ALTER TABLE IF EXISTS matches ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ DEFAULT NOW() NOT NULL",
            "ALTER TABLE IF EXISTS matches ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ",
            "ALTER TABLE IF EXISTS matches ADD COLUMN IF NOT EXISTS breeze_bypass_enabled BOOLEAN DEFAULT FALSE NOT NULL",
            "CREATE INDEX IF NOT EXISTS ix_swipes_user_id ON swipes(user_id)",
            "CREATE INDEX IF NOT EXISTS ix_swipes_target_id ON swipes(target_id)",
            "CREATE INDEX IF NOT EXISTS ix_matches_user_a ON matches(user_a)",
            "CREATE INDEX IF NOT EXISTS ix_matches_user_b ON matches(user_b)",
            "CREATE INDEX IF NOT EXISTS ix_users_square_customer_id ON users(square_customer_id)",
        )

        for statement in statements:
            await connection.execute(text(statement))

        await connection.execute(text("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'users'
                          AND column_name = 'hashed_password'
                    ) THEN
                        UPDATE users
                        SET password_hash = COALESCE(password_hash, hashed_password)
                        WHERE password_hash IS NULL;

                        ALTER TABLE users
                        ALTER COLUMN hashed_password DROP NOT NULL;
                    END IF;
                END
                $$;
                """))

        await connection.execute(text("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'webhook_events'
                          AND column_name = 'alternate processor_event_id'
                    ) THEN
                        UPDATE webhook_events
                        SET event_source_id = "alternate processor_event_id"
                        WHERE event_source_id IS NULL;
                    END IF;
                END
                $$;
                """))


async def _reconcile_sqlite_schema(connection) -> None:
    """Add account columns to older local SQLite databases.

    SQLite does not support the PostgreSQL `ADD COLUMN IF NOT EXISTS` syntax,
    so we inspect first. This is only for local/dev databases; production
    PostgreSQL keeps using the canonical reconciliation above.
    """

    user_columns = {
        row[1] for row in (await connection.execute(text("PRAGMA table_info(users)")))
    }
    profile_columns = {
        row[1]
        for row in (await connection.execute(text("PRAGMA table_info(profiles)")))
    }
    verification_columns = {
        row[1]
        for row in (
            await connection.execute(text("PRAGMA table_info(verification_events)"))
        )
    }
    webhook_columns = {
        row[1]
        for row in (await connection.execute(text("PRAGMA table_info(webhook_events)")))
    }

    async def add_column(
        table: str, known_columns: set[str], name: str, ddl: str
    ) -> None:
        if name not in known_columns:
            await connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {ddl}"))
            known_columns.add(name)

    await add_column("users", user_columns, "email", "email VARCHAR(255)")
    await add_column(
        "users",
        user_columns,
        "display_name",
        "display_name VARCHAR(100) DEFAULT 'User'",
    )
    await add_column(
        "users", user_columns, "password_hash", "password_hash VARCHAR(255)"
    )
    await add_column(
        "users", user_columns, "square_customer_id", "square_customer_id VARCHAR(255)"
    )
    await add_column("users", user_columns, "date_of_birth", "date_of_birth DATE")
    await add_column("users", user_columns, "created_at", "created_at DATETIME")
    await add_column("users", user_columns, "updated_at", "updated_at DATETIME")
    await add_column(
        "users", user_columns, "adult_verified_at", "adult_verified_at DATETIME"
    )
    await add_column(
        "users", user_columns, "is_active", "is_active BOOLEAN DEFAULT 1 NOT NULL"
    )
    await add_column(
        "users",
        user_columns,
        "bot_shield_verified",
        "bot_shield_verified BOOLEAN DEFAULT 0 NOT NULL",
    )
    await add_column(
        "users", user_columns, "subscription_tier", "subscription_tier VARCHAR(50)"
    )
    await add_column(
        "users",
        user_columns,
        "subscription_active",
        "subscription_active BOOLEAN DEFAULT 0 NOT NULL",
    )
    await add_column(
        "users",
        user_columns,
        "subscription_expires_at",
        "subscription_expires_at DATETIME",
    )
    await add_column(
        "users",
        user_columns,
        ENGAGEMENT_SCORE_COLUMN,
        f"{ENGAGEMENT_SCORE_COLUMN} FLOAT DEFAULT 0 NOT NULL",
    )
    await add_column(
        "users",
        user_columns,
        MEMBER_BADGE_COLUMN,
        f"{MEMBER_BADGE_COLUMN} VARCHAR(50)",
    )
    await add_column("users", user_columns, "google_id", "google_id VARCHAR(255)")

    await add_column("profiles", profile_columns, "bio", "bio TEXT")
    await add_column("profiles", profile_columns, "age", "age INTEGER")
    await add_column("profiles", profile_columns, "gender", "gender VARCHAR(50)")
    await add_column(
        "profiles", profile_columns, "looking_for", "looking_for VARCHAR(50)"
    )
    await add_column("profiles", profile_columns, "location", "location VARCHAR(200)")
    await add_column(
        "profiles", profile_columns, "photos", "photos JSON DEFAULT '[]' NOT NULL"
    )
    await add_column(
        "profiles",
        profile_columns,
        "interests",
        "interests JSON DEFAULT '[]' NOT NULL",
    )
    await add_column(
        "profiles", profile_columns, "verified", "verified BOOLEAN DEFAULT 0 NOT NULL"
    )
    await add_column(
        "profiles",
        profile_columns,
        "location_enabled",
        "location_enabled BOOLEAN DEFAULT 1 NOT NULL",
    )
    await add_column("profiles", profile_columns, "created_at", "created_at DATETIME")
    await add_column("profiles", profile_columns, "updated_at", "updated_at DATETIME")

    await add_column(
        "verification_events",
        verification_columns,
        "square_payment_id",
        "square_payment_id VARCHAR(255)",
    )
    await add_column(
        "verification_events", verification_columns, "trust_score", "trust_score FLOAT"
    )
    await add_column(
        "verification_events",
        verification_columns,
        "amount_cents",
        "amount_cents INTEGER",
    )
    await add_column(
        "webhook_events",
        webhook_columns,
        "event_source_id",
        "event_source_id VARCHAR(255)",
    )
    await add_column(
        "webhook_events",
        webhook_columns,
        "event_source",
        "event_source VARCHAR(50) DEFAULT 'square' NOT NULL",
    )

    await connection.execute(
        text("CREATE INDEX IF NOT EXISTS ix_users_email ON users(email)")
    )
    await connection.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_users_square_customer_id "
            "ON users(square_customer_id)"
        )
    )
