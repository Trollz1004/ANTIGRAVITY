"""Database engine and session utilities."""

from collections.abc import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

_database_url = settings.database_url
if _database_url.startswith("postgresql://"):
    _database_url = _database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(_database_url, pool_pre_ping=True)
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
            "CREATE INDEX IF NOT EXISTS ix_users_square_customer_id ON users(square_customer_id)",
        )

        for statement in statements:
            await connection.execute(text(statement))

        await connection.execute(
            text(
                """
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
                """
            )
        )

        await connection.execute(
            text(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'webhook_events'
                          AND column_name = 'stripe_event_id'
                    ) THEN
                        UPDATE webhook_events
                        SET event_source_id = stripe_event_id
                        WHERE event_source_id IS NULL;
                    END IF;
                END
                $$;
                """
            )
        )
