"""make review customer optional

Revision ID: 89490ae50b43
Revises: b2c3d4e5f6a7
Create Date: 2026-05-25 19:48:10.484429
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = "89490ae50b43"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.alter_column(
        "reviews",
        "customer_id",
        existing_type=sa.UUID(),
        nullable=True,
    )


def downgrade() -> None:

    op.alter_column(
        "reviews",
        "customer_id",
        existing_type=sa.UUID(),
        nullable=False,
    )