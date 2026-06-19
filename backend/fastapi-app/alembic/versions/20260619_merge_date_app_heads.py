"""merge date app migration heads

Revision ID: 20260619_merge_heads
Revises: 12983f2b61f2, 6dce8b1fc7ac, f9e7b3a52c01
Create Date: 2026-06-19 07:55:00.000000

"""

from typing import Sequence, Union

revision: str = "20260619_merge_heads"
down_revision: Union[str, tuple[str, ...], None] = (
    "12983f2b61f2",
    "6dce8b1fc7ac",
    "f9e7b3a52c01",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
