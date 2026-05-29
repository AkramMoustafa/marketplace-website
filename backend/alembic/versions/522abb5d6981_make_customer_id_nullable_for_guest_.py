"""make customer_id nullable for guest bookings

Revision ID: 522abb5d6981
Revises: f1a2b3c4d5e6
Create Date: 2026-05-29 04:45:48.006903

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '522abb5d6981'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('service_appointments', 'customer_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.drop_constraint('service_appointments_customer_id_fkey', 'service_appointments', type_='foreignkey')
    op.create_foreign_key(None, 'service_appointments', 'users', ['customer_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint(None, 'service_appointments', type_='foreignkey')
    op.create_foreign_key('service_appointments_customer_id_fkey', 'service_appointments', 'users', ['customer_id'], ['id'], ondelete='CASCADE')
    op.alter_column('service_appointments', 'customer_id',
               existing_type=sa.UUID(),
               nullable=False)
