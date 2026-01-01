from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# Association table for book tags
book_tags = Table(
    'book_tags',
    Base.metadata,
    Column('book_id', Integer, ForeignKey('books.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(100))
    avatar_url = Column(String(500))
    bio = Column(Text)
    
    # Public sharing settings
    is_library_public = Column(Boolean, default=False)
    show_tags_public = Column(Boolean, default=True)
    show_notes_public = Column(Boolean, default=False)
    show_condition_public = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    books = relationship("Book", back_populates="owner", cascade="all, delete-orphan")
    locations = relationship("Location", back_populates="owner", cascade="all, delete-orphan")

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="locations")
    books = relationship("Book", back_populates="location")

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    books = relationship("Book", secondary=book_tags, back_populates="tags")

class Book(Base):
    __tablename__ = "books"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Book metadata
    isbn = Column(String(13), index=True)
    title = Column(String(500), nullable=False, index=True)
    authors = Column(String(500))  # JSON array as string
    cover_url = Column(String(1000))
    publisher = Column(String(255))
    published_year = Column(Integer)
    page_count = Column(Integer)
    description = Column(Text)
    
    # User data
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"))
    condition = Column(String(20))  # "new", "very_good", "good", "acceptable"
    notes = Column(Text)
    is_pinned = Column(Boolean, default=False)
    show_in_public = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="books")
    location = relationship("Location", back_populates="books")
    tags = relationship("Tag", secondary=book_tags, back_populates="books")
