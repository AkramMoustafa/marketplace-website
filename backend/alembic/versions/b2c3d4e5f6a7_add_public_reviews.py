"""add public_reviews table"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "public_reviews",
        sa.Column("id",          postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name",        sa.String(100),  nullable=False),
        sa.Column("email",       sa.String(255),  nullable=True),
        sa.Column("rating",      sa.Integer(),    nullable=False),
        sa.Column("review_text", sa.Text(),       nullable=False),
        sa.Column("approved",    sa.Boolean(),    nullable=False, server_default="false"),
        sa.Column("created_at",  sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at",  sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_public_reviews_rating"),
    )
    op.create_index("ix_public_reviews_approved",   "public_reviews", ["approved"])
    op.create_index("ix_public_reviews_created_at", "public_reviews", ["created_at"])


def downgrade():
    op.drop_index("ix_public_reviews_created_at", table_name="public_reviews")
    op.drop_index("ix_public_reviews_approved",   table_name="public_reviews")
    op.drop_table("public_reviews")
