"""add user fields"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'c14ef157ee99'
down_revision: Union[str, None] = '9785d782099a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    userrole = postgresql.ENUM(
        'admin',
        'customer',
        name='userrole'
    )

    userrole.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'users',
        sa.Column(
            'hashed_password',
            sa.String(length=255),
            nullable=False
        )
    )

    op.add_column(
        'users',
        sa.Column(
            'role',
            userrole,
            nullable=False,
            server_default='customer'
        )
    )

    op.add_column(
        'users',
        sa.Column(
            'is_active',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true")
        )
    )

    op.add_column(
        'users',
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False
        )
    )

    op.add_column(
        'users',
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False
        )
    )

    op.alter_column(
        'users',
        'name',
        existing_type=sa.VARCHAR(length=255),
        type_=sa.String(length=120),
        nullable=False
    )

    op.alter_column(
        'users',
        'email',
        existing_type=sa.VARCHAR(length=255),
        nullable=False
    )

    op.create_index(
        op.f('ix_users_email'),
        'users',
        ['email'],
        unique=True
    )


def downgrade() -> None:
    op.drop_index(
        op.f('ix_users_email'),
        table_name='users'
    )

    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'role')
    op.drop_column('users', 'hashed_password')

    userrole = postgresql.ENUM(
        'admin',
        'customer',
        name='userrole'
    )

    userrole.drop(op.get_bind(), checkfirst=True)