"""add webhook retry schema

Revision ID: 20260619_webhook_retry
Revises: 20260619_merge_heads
Create Date: 2026-06-19 08:10:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260619_webhook_retry"
down_revision: Union[str, None] = "20260619_merge_heads"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE IF EXISTS webhook_events "
        "ADD COLUMN IF NOT EXISTS retry_parent_event_id VARCHAR(255)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_webhook_events_retry_parent_event_id "
        "ON webhook_events(retry_parent_event_id)"
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS webhook_retry_queue (
            id UUID PRIMARY KEY,
            event_id VARCHAR(255) NOT NULL,
            event_type VARCHAR(100) NOT NULL,
            event_source VARCHAR(50) DEFAULT 'square' NOT NULL,
            payload TEXT NOT NULL,
            retry_count INTEGER DEFAULT 0 NOT NULL,
            max_retries INTEGER DEFAULT 5 NOT NULL,
            next_retry_at TIMESTAMPTZ NOT NULL,
            last_error TEXT,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            moved_to_dead_letter BOOLEAN DEFAULT false NOT NULL
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_webhook_retry_queue_event_id "
        "ON webhook_retry_queue(event_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_webhook_retry_queue_next_retry "
        "ON webhook_retry_queue(next_retry_at, moved_to_dead_letter)"
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS webhook_dead_letter (
            id UUID PRIMARY KEY,
            event_id VARCHAR(255) NOT NULL,
            event_type VARCHAR(100) NOT NULL,
            event_source VARCHAR(50) DEFAULT 'square' NOT NULL,
            payload TEXT NOT NULL,
            retry_count INTEGER NOT NULL,
            final_error TEXT,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            moved_at TIMESTAMPTZ DEFAULT now() NOT NULL
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_webhook_dead_letter_event_id "
        "ON webhook_dead_letter(event_id)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_webhook_dead_letter_event_id")
    op.execute("DROP TABLE IF EXISTS webhook_dead_letter")
    op.execute("DROP INDEX IF EXISTS ix_webhook_retry_queue_next_retry")
    op.execute("DROP INDEX IF EXISTS ix_webhook_retry_queue_event_id")
    op.execute("DROP TABLE IF EXISTS webhook_retry_queue")
    op.execute("DROP INDEX IF EXISTS ix_webhook_events_retry_parent_event_id")
    op.execute(
        "ALTER TABLE IF EXISTS webhook_events "
        "DROP COLUMN IF EXISTS retry_parent_event_id"
    )
