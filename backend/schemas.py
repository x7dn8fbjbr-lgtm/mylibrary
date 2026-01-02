from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")
    display_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_library_public: Optional[bool] = None
    show_tags_public: Optional[bool] = None
    show_notes_public: Optional[bool] = None
    show_condition_public: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    display_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    is_library_public: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserPublic(BaseModel):
    username: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

# Location Schemas
class LocationBase(BaseModel):
    name: str
    description: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class LocationResponse(LocationBase):
    id: int
    user_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Tag Schemas
class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class TagResponse(TagBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Book Schemas
class BookBase(BaseModel):
    isbn: Optional[str] = None
    title: str
    authors: Optional[str] = None
    cover_url: Optional[str] = None
    publisher: Optional[str] = None
    published_year: Optional[int] = None
    page_count: Optional[int] = None
    description: Optional[str] = None
    location_id: Optional[int] = None
    condition: Optional[str] = None
    notes: Optional[str] = None
    is_pinned: bool = False
    show_in_public: bool = True

class BookCreate(BookBase):
    tag_names: List[str] = []

class BookUpdate(BaseModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    cover_url: Optional[str] = None
    publisher: Optional[str] = None
    published_year: Optional[int] = None
    page_count: Optional[int] = None
    description: Optional[str] = None
    location_id: Optional[int] = None
    condition: Optional[str] = None
    notes: Optional[str] = None
    is_pinned: Optional[bool] = None
    show_in_public: Optional[bool] = None
    tag_names: Optional[List[str]] = None

class BookResponse(BookBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    tags: List[TagResponse] = []
    location: Optional[LocationResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class BookPublic(BaseModel):
    id: int
    isbn: Optional[str]
    title: str
    authors: Optional[str]
    cover_url: Optional[str]
    publisher: Optional[str]
    published_year: Optional[int]
    description: Optional[str]
    is_pinned: bool
    tags: List[TagResponse] = []
    condition: Optional[str] = None
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# ISBN Lookup Response
class ISBNLookupResponse(BaseModel):
    isbn: str
    title: Optional[str]
    authors: Optional[List[str]]
    cover_url: Optional[str]
    publisher: Optional[str]
    published_year: Optional[int]
    page_count: Optional[int]
    description: Optional[str]

# CSV Import
class CSVImportProgress(BaseModel):
    total: int
    processed: int
    successful: int
    failed: int
    errors: List[str] = []

# Statistics
class LibraryStats(BaseModel):
    total_books: int
    books_by_author: List[dict]  # [{"author": "Name", "count": 5}]
    books_by_location: List[dict]  # Only for private view
    books_by_tag: List[dict]
    recent_additions: List[BookResponse]
    pinned_books: List[BookResponse]
