"""add vehicle detail fields

Revision ID: 0ac7127ea41c
Revises: 8f6a1461a1df
Create Date: 2026-05-24 14:00:01.355423

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0ac7127ea41c'
down_revision: Union[str, None] = '8f6a1461a1df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.add_column(
        "vehicles",
        sa.Column(
            "stock_number",
            sa.String(length=50),
            nullable=True
        )
    )

    op.add_column(
        "vehicles",
        sa.Column(
            "engine",
            sa.String(length=100),
            nullable=True
        )
    )

    op.add_column(
        "vehicles",
        sa.Column(
            "drive",
            sa.String(length=50),
            nullable=True
        )
    )

    op.add_column(
        "vehicles",
        sa.Column(
            "fuel_economy",
            sa.String(length=50),
            nullable=True
        )
    )

    op.add_column(
        "vehicles",
        sa.Column(
            "exterior_color",
            sa.String(length=50),
            nullable=True
        )
    )


def downgrade() -> None:

    op.drop_column(
        "vehicles",
        "exterior_color"
    )

    op.drop_column(
        "vehicles",
        "fuel_economy"
    )

    op.drop_column(
        "vehicles",
        "drive"
    )

    op.drop_column(
        "vehicles",
        "engine"
    )

    op.drop_column(
        "vehicles",
        "stock_number"
    )