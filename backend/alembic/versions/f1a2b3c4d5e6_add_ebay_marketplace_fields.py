"""add eBay marketplace fields to vehicles

Adds four columns needed for eBay Motors listing integration:
  - ebay_listing_id    : external eBay listing / offer ID (nullable)
  - ebay_status        : publishing state, defaults to 'draft'
  - ebay_last_sync_at  : timestamp of last successful sync with eBay
  - ebay_error_message : last error returned by eBay (nullable text)

Revision ID: f1a2b3c4d5e6
Revises: 89490ae50b43
Create Date: 2026-05-26
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "89490ae50b43"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "vehicles",
        sa.Column("ebay_listing_id", sa.String(100), nullable=True),
    )
    op.add_column(
        "vehicles",
        sa.Column(
            "ebay_status",
            sa.String(50),
            nullable=False,
            server_default="draft",
        ),
    )
    op.add_column(
        "vehicles",
        sa.Column("ebay_last_sync_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "vehicles",
        sa.Column("ebay_error_message", sa.Text, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("vehicles", "ebay_error_message")
    op.drop_column("vehicles", "ebay_last_sync_at")
    op.drop_column("vehicles", "ebay_status")
    op.drop_column("vehicles", "ebay_listing_id")
