"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('display_name', sa.String(100)),
        sa.Column('avatar_url', sa.String(500)),
        sa.Column('bio', sa.Text()),
        sa.Column('is_library_public', sa.Boolean(), default=False),
        sa.Column('show_tags_public', sa.Boolean(), default=True),
        sa.Column('show_notes_public', sa.Boolean(), default=False),
        sa.Column('show_condition_public', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_username', 'users', ['username'])
    
    # Locations table
    op.create_table(
        'locations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_locations_id', 'locations', ['id'])
    
    # Tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_tags_id', 'tags', ['id'])
    op.create_index('ix_tags_name', 'tags', ['name'])
    
    # Books table
    op.create_table(
        'books',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('isbn', sa.String(13)),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('authors', sa.String(500)),
        sa.Column('cover_url', sa.String(1000)),
        sa.Column('publisher', sa.String(255)),
        sa.Column('published_year', sa.Integer()),
        sa.Column('page_count', sa.Integer()),
        sa.Column('description', sa.Text()),
        sa.Column('location_id', sa.Integer()),
        sa.Column('condition', sa.String(20)),
        sa.Column('notes', sa.Text()),
        sa.Column('is_pinned', sa.Boolean(), default=False),
        sa.Column('show_in_public', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_books_id', 'books', ['id'])
    op.create_index('ix_books_isbn', 'books', ['isbn'])
    op.create_index('ix_books_title', 'books', ['title'])
    
    # Book_tags association table
    op.create_table(
        'book_tags',
        sa.Column('book_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('book_id', 'tag_id')
    )

def downgrade():
    op.drop_table('book_tags')
    op.drop_index('ix_books_title', 'books')
    op.drop_index('ix_books_isbn', 'books')
    op.drop_index('ix_books_id', 'books')
    op.drop_table('books')
    op.drop_index('ix_tags_name', 'tags')
    op.drop_index('ix_tags_id', 'tags')
    op.drop_table('tags')
    op.drop_index('ix_locations_id', 'locations')
    op.drop_table('locations')
    op.drop_index('ix_users_username', 'users')
    op.drop_index('ix_users_email', 'users')
    op.drop_index('ix_users_id', 'users')
    op.drop_table('users')
