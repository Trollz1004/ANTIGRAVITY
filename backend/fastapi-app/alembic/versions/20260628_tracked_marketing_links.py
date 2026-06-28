"""add tracked marketing links

Revision ID: 20260628_tracked_marketing_links
Revises: 20260619_webhook_retry
Create Date: 2026-06-28 06:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260628_tracked_marketing_links"
down_revision: Union[str, None] = "20260619_webhook_retry"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tracked_marketing_links",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("slug", sa.String(length=32), nullable=False),
        sa.Column("surface_name", sa.String(length=100), nullable=False),
        sa.Column("destination_url", sa.String(length=2048), nullable=False),
        sa.Column(
            "source", sa.String(length=50), server_default="affiliate", nullable=False
        ),
        sa.Column(
            "medium", sa.String(length=50), server_default="referral", nullable=False
        ),
        sa.Column("campaign_name", sa.String(length=120), nullable=False),
        sa.Column("referral_code", sa.String(length=100), nullable=True),
        sa.Column("click_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_by_user_id", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("last_clicked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(
        op.f("ix_tracked_marketing_links_campaign_name"),
        "tracked_marketing_links",
        ["campaign_name"],
        unique=False,
    )
    op.create_index(
        op.f("ix_tracked_marketing_links_referral_code"),
        "tracked_marketing_links",
        ["referral_code"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_tracked_marketing_links_referral_code"),
        table_name="tracked_marketing_links",
    )
    op.drop_index(
        op.f("ix_tracked_marketing_links_campaign_name"),
        table_name="tracked_marketing_links",
    )
    op.drop_table("tracked_marketing_links")
