"""add card_fingerprint to verification_events

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-11-20 11:50:00.000000

Adds the nullable, indexed ``card_fingerprint`` (VARCHAR(255)) column to
``verification_events`` so completed Bot-Shield payment events record the
card fingerprint sent by Square.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEX_NAME = "ix_verification_events_card_fingerprint"
COLUMN_NAME = "card_fingerprint"
TABLE = "verification_events"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    columns = {c["name"] for c in inspector.get_columns(TABLE)}
    if COLUMN_NAME not in columns:
        op.add_column(TABLE, sa.Column(COLUMN_NAME, sa.String(255), nullable=True))

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
