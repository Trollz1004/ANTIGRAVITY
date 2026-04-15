"""add support tickets table

Revision ID: 9c1d2e3f4a56
Revises: 8b4d5e6f7a12
Create Date: 2026-03-19 16:20:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9c1d2e3f4a56"
down_revision: Union[str, None] = "8b4d5e6f7a12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "support_tickets",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="open", nullable=False),
        sa.Column("category", sa.String(length=50), server_default="general", nullable=False),
        sa.Column("subject", sa.String(length=200), nullable=False),
        sa.Column("customer_email", sa.String(length=255), nullable=False),
        sa.Column("customer_message", sa.Text(), nullable=False),
        sa.Column("bot_response", sa.Text(), nullable=True),
        sa.Column("escalation_reason", sa.String(length=100), nullable=True),
        sa.Column("transcript", sa.JSON(), server_default=sa.text("'[]'::json"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_support_tickets_user_id"), "support_tickets", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_support_tickets_user_id"), table_name="support_tickets")
    op.drop_table("support_tickets")
