"""add password_reset_tokens table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-11-22 07:30:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE_NAME = "password_reset_tokens"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if TABLE_NAME not in inspector.get_table_names():
        op.create_table(
            TABLE_NAME,
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("user_id", sa.UUID(), nullable=False),
            sa.Column("token_hash", sa.String(length=64), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column("ip_address", sa.String(length=45), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )

    existing_indexes = {idx["name"] for idx in inspector.get_indexes(TABLE_NAME)}
    if "ix_password_reset_tokens_user_id" not in existing_indexes:
        op.create_index(
            "ix_password_reset_tokens_user_id",
            TABLE_NAME,
            ["user_id"],
        )
    if "ix_password_reset_tokens_token_hash" not in existing_indexes:
        op.create_index(
            "ix_password_reset_tokens_token_hash",
            TABLE_NAME,
            ["token_hash"],
            unique=True,
        )
    if "ix_password_reset_tokens_user_id_used" not in existing_indexes:
        op.create_index(
            "ix_password_reset_tokens_user_id_used",
            TABLE_NAME,
            ["user_id", "used_at"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if TABLE_NAME in inspector.get_table_names():
        existing_indexes = {idx["name"] for idx in inspector.get_indexes(TABLE_NAME)}
        for index_name in (
            "ix_password_reset_tokens_user_id_used",
            "ix_password_reset_tokens_token_hash",
            "ix_password_reset_tokens_user_id",
        ):
            if index_name in existing_indexes:
                op.drop_index(index_name, table_name=TABLE_NAME)
        op.drop_table(TABLE_NAME)
