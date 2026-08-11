"""add marketing content table

The marketing API persists real AI-agent content rows instead of returning
mock payloads.

Revision ID: 20260730_marketing_content
Revises: 20260619_webhook_retry
Create Date: 2026-07-30 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260730_marketing_content"
down_revision: Union[str, None] = "20260619_webhook_retry"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "marketing_content",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("campaign_name", sa.String(length=200), nullable=False),
        sa.Column("objective", sa.String(length=500), nullable=False),
        sa.Column("audience", sa.String(length=500), nullable=False),
        sa.Column("platforms", sa.JSON(), nullable=False),
        sa.Column("core_message", sa.Text(), nullable=False),
        sa.Column("post_type", sa.String(length=50), nullable=False),
        sa.Column("primary_caption", sa.Text(), nullable=False),
        sa.Column("call_to_action", sa.String(length=200), nullable=True),
        sa.Column("hashtag_block", sa.JSON(), nullable=False),
        sa.Column("published", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
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
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_marketing_content_created_by",
        "marketing_content",
        ["created_by"],
    )


def downgrade() -> None:
    op.drop_index("ix_marketing_content_created_by", table_name="marketing_content")
    op.drop_table("marketing_content")
