from alembic import op
import sqlalchemy as sa

revision = '20240607_02'
down_revision = '20240607_01'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('specialistsource', sa.Column('name', sa.String(), nullable=True))

def downgrade():
    op.drop_column('specialistsource', 'name')
