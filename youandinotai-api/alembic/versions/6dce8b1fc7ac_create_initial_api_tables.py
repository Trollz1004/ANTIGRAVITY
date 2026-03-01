"""create initial api tables

Revision ID: 6dce8b1fc7ac
Revises:
Create Date: 2026-02-26 01:20:51.824972

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "6dce8b1fc7ac"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=100), nullable=False),
        sa.Column("stripe_customer_id", sa.String(length=255), nullable=True),
        sa.Column(
            "bot_shield_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("subscription_tier", sa.String(length=50), nullable=True),
        sa.Column(
            "subscription_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "webhook_events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("stripe_event_id", sa.String(length=255), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column(
            "processed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        op.f("ix_webhook_events_stripe_event_id"),
        "webhook_events",
        ["stripe_event_id"],
        unique=True,
    )

    op.create_table(
        "matches",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_a", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_b", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("compatibility_score", sa.Float(), nullable=True),
        sa.Column(
            "status",
            sa.String(length=50),
            nullable=False,
            server_default=sa.text("'pending'"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["user_a"], ["users.id"]),
        sa.ForeignKeyConstraint(["user_b"], ["users.id"]),
    )


def downgrade() -> None:
    op.drop_table("matches")
    op.drop_index(op.f("ix_webhook_events_stripe_event_id"), table_name="webhook_events")
    op.drop_table("webhook_events")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
