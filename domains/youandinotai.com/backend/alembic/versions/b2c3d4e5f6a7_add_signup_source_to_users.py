"""add signup_source to users

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-11-19 13:00:00.000000

Adds the nullable, indexed ``signup_source`` (VARCHAR(128)) column to ``users``
so every new account records how the person reached the site without changing
what ``users.referral_code`` holds.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEX_NAME = "ix_users_signup_source"
COLUMN_NAME = "signup_source"
TABLE = "users"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    columns = {c["name"] for c in inspector.get_columns(TABLE)}
    if COLUMN_NAME not in columns:
        op.add_column(TABLE, sa.Column(COLUMN_NAME, sa.String(128), nullable=True))

    indexes = {i["name"] for i in inspector.get_indexes(TABLE)}
    if INDEX_NAME not in indexes:
        op.create_index(INDEX_NAME, TABLE, [COLUMN_NAME])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    indexes = {i["name"] for i in inspector.get_indexes(TABLE)}
    if INDEX_NAME in indexes:
        op.drop_index(INDEX_NAME, table_name=TABLE)

    columns = {c["name"] for c in inspector.get_columns(TABLE)}
    if COLUMN_NAME in columns:
        op.drop_column(TABLE, COLUMN_NAME)
