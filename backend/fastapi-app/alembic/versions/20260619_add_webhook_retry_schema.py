"""add webhook retry schema

Revision ID: 20260619_webhook_retry
Revises: 20260619_merge_heads
Create Date: 2026-06-19 08:10:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260619_webhook_retry"
down_revision: Union[str, None] = "20260619_merge_heads"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "webhook_events",
        sa.Column("retry_parent_event_id", sa.String(length=255), nullable=True),
    )
    op.create_index(
        "ix_webhook_events_retry_parent_event_id",
        "webhook_events",
        ["retry_parent_event_id"],
    )

    op.create_table(
        "webhook_retry_queue",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("event_id", sa.String(length=255), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column(
            "event_source",
            sa.String(length=50),
            server_default="square",
            nullable=False,
        ),
        sa.Column("payload", sa.Text(), nullable=False),
        sa.Column("retry_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("max_retries", sa.Integer(), server_default="5", nullable=False),
        sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "moved_to_dead_letter",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_webhook_retry_queue_event_id", "webhook_retry_queue", ["event_id"]
    )
    op.create_index(
        "ix_webhook_retry_queue_next_retry",
        "webhook_retry_queue",
        ["next_retry_at", "moved_to_dead_letter"],
    )

    op.create_table(
        "webhook_dead_letter",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("event_id", sa.String(length=255), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column(
            "event_source",
            sa.String(length=50),
            server_default="square",
            nullable=False,
        ),
        sa.Column("payload", sa.Text(), nullable=False),
        sa.Column("retry_count", sa.Integer(), nullable=False),
        sa.Column("final_error", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "moved_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_webhook_dead_letter_event_id", "webhook_dead_letter", ["event_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_webhook_dead_letter_event_id", table_name="webhook_dead_letter")
    op.drop_table("webhook_dead_letter")
    op.drop_index("ix_webhook_retry_queue_next_retry", table_name="webhook_retry_queue")
    op.drop_index("ix_webhook_retry_queue_event_id", table_name="webhook_retry_queue")
    op.drop_table("webhook_retry_queue")
    op.drop_index(
        "ix_webhook_events_retry_parent_event_id", table_name="webhook_events"
    )
    op.drop_column("webhook_events", "retry_parent_event_id")
