"""add privacy video doubledate tables and user active flag

Revision ID: 5c0bb0d6_migration_2026_03_18
Revises: d4f4ee2dc4dd
Create Date: 2026-03-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5c0bb0d6_migration_2026_03_18"
down_revision: Union[str, None] = "d4f4ee2dc4dd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns to existing users table
    op.add_column("users", sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False))
    
    # Add column to existing profiles table
    op.add_column("profiles", sa.Column("location_enabled", sa.Boolean(), server_default="true", nullable=False))
    
    # Create data_privacy_logs table
    op.create_table(
        "data_privacy_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    
    # Create video_calls table
    op.create_table(
        "video_calls",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("match_id", sa.UUID(), nullable=False),
        sa.Column("initiator_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="ringing", nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["match_id"], ["matches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["initiator_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    
    # Create double_date_sessions table
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
    
    # Create double_date_acceptances table
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
    
    # Update verification_events to support square_payment_id instead of stripe_checkout_id
    op.add_column("verification_events", sa.Column("square_payment_id", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("verification_events", "square_payment_id")
    op.drop_table("double_date_acceptances")
    op.drop_table("double_date_sessions")
    op.drop_table("video_calls")
    op.drop_table("data_privacy_logs")
    op.drop_column("profiles", "location_enabled")
    op.drop_column("users", "is_active")
