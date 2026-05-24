"""add vehicle features"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "e43af5f77663"
down_revision = "0ac7127ea41c"

branch_labels = None
depends_on = None


def upgrade():

    op.add_column(
        "vehicles",
        sa.Column(
            "features",
            postgresql.JSONB(),
            nullable=True
        )
    )


def downgrade():

    op.drop_column(
        "vehicles",
        "features"
    )