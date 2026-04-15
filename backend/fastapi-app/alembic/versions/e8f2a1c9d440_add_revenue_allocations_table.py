"""add revenue allocations table

Revision ID: e8f2a1c9d440
Revises: 9c1d2e3f4a56
Create Date: 2026-04-10 16:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e8f2a1c9d440"
down_revision: Union[str, None] = "9c1d2e3f4a56"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "revenue_allocations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("source", sa.String(length=50), server_default="square", nullable=False),
        sa.Column("source_event_id", sa.String(length=255), nullable=False),
        sa.Column("square_payment_id", sa.String(length=255), nullable=False),
        sa.Column("payment_tier", sa.String(length=50), server_default="unknown", nullable=False),
        sa.Column("gross_amount_cents", sa.Integer(), nullable=False),
        sa.Column("charitable_amount_cents", sa.Integer(), nullable=False),
        sa.Column("operating_amount_cents", sa.Integer(), nullable=False),
        sa.Column("charitable_percent", sa.Integer(), server_default="10", nullable=False),
        sa.Column("beneficiary_lane", sa.String(length=100), server_default="kids_support", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="reserved", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("disbursed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_event_id", name="uq_revenue_allocations_source_event_id"),
        sa.UniqueConstraint("square_payment_id", name="uq_revenue_allocations_square_payment_id"),
    )
    op.create_index(
        "ix_revenue_allocations_source_event_id",
        "revenue_allocations",
        ["source_event_id"],
    )
    op.create_index(
        "ix_revenue_allocations_square_payment_id",
        "revenue_allocations",
        ["square_payment_id"],
    )
    op.create_index("ix_revenue_allocations_user_id", "revenue_allocations", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_revenue_allocations_user_id", table_name="revenue_allocations")
    op.drop_index("ix_revenue_allocations_square_payment_id", table_name="revenue_allocations")
    op.drop_index("ix_revenue_allocations_source_event_id", table_name="revenue_allocations")
    op.drop_table("revenue_allocations")
