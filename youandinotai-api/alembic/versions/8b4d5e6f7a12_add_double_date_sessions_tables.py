"""add double date session tables

Revision ID: 8b4d5e6f7a12
Revises: 7a9c2f1d8e11
Create Date: 2026-03-18 00:45:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8b4d5e6f7a12"
down_revision: Union[str, None] = "7a9c2f1d8e11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "double_date_sessions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("match_a_id", sa.UUID(), nullable=False),
        sa.Column("match_b_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["match_a_id"], ["matches.id"]),
        sa.ForeignKeyConstraint(["match_b_id"], ["matches.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "double_date_acceptances",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("session_id", sa.UUID(), nullable=False),
        sa.Column("match_id", sa.UUID(), nullable=False),
        sa.Column("accepted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["double_date_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["match_id"], ["matches.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("double_date_acceptances")
    op.drop_table("double_date_sessions")
