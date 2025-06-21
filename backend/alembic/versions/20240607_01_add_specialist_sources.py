from alembic import op
import sqlalchemy as sa

revision = '20240607_01'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('agent', sa.Column('specialist_update_date', sa.DateTime(timezone=True), nullable=True))
    op.create_table(
        'specialistsource',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('agent_id', sa.Integer(), sa.ForeignKey('agent.id'), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('path', sa.String(), nullable=True),
        sa.Column('url', sa.String(), nullable=True),
        sa.Column('added_at', sa.DateTime(timezone=True), nullable=False),
    )

def downgrade():
    op.drop_table('specialistsource')
    op.drop_column('agent', 'specialist_update_date')
