from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import json

from database import get_db
from models import User, Book, Tag
from schemas import UserPublic, BookPublic, LibraryStats

router = APIRouter(prefix="/api/public", tags=["public"])

@router.get("/library/{username}", response_model=UserPublic)
def get_public_library_info(username: str, db: Session = Depends(get_db)):
    """Get public library information for a user"""
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.is_library_public:
        raise HTTPException(status_code=404, detail="Library is private")
    
    return UserPublic(
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        bio=user.bio
    )

@router.get("/library/{username}/books", response_model=List[BookPublic])
def get_public_library_books(
    username: str,
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    author: str = None,
    tag: str = None,
    db: Session = Depends(get_db)
):
    """Get books from a public library"""
    user = db.query(User).filter(User.username == username).first()
    
    if not user or not user.is_library_public:
        raise HTTPException(status_code=404, detail="Library not found or is private")
    
    # Query books
    query = db.query(Book).filter(
        Book.user_id == user.id,
        Book.show_in_public == True
    )
    
    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Book.title.ilike(search_pattern)) |
            (Book.authors.ilike(search_pattern))
        )
    
    if author:
        query = query.filter(Book.authors.ilike(f"%{author}%"))
    
    if tag:
        query = query.join(Book.tags).filter(Tag.name == tag)
    
    # Order by pinned first
    query = query.order_by(Book.is_pinned.desc(), Book.created_at.desc())
    
    books = query.offset(skip).limit(limit).all()
    
    # Format response based on user's public settings
    public_books = []
    for book in books:
        book_data = {
            "id": book.id,
            "isbn": book.isbn,
            "title": book.title,
            "authors": book.authors,
            "cover_url": book.cover_url,
            "publisher": book.publisher,
            "published_year": book.published_year,
            "description": book.description,
            "is_pinned": book.is_pinned,
            "tags": book.tags if user.show_tags_public else [],
            "condition": book.condition if user.show_condition_public else None,
            "notes": book.notes if user.show_notes_public else None
        }
        public_books.append(BookPublic(**book_data))
    
    return public_books

@router.get("/library/{username}/stats", response_model=LibraryStats)
def get_public_library_stats(username: str, db: Session = Depends(get_db)):
    """Get statistics for a public library"""
    user = db.query(User).filter(User.username == username).first()
    
    if not user or not user.is_library_public:
        raise HTTPException(status_code=404, detail="Library not found or is private")
    
    # Total books
    total_books = db.query(func.count(Book.id)).filter(
        Book.user_id == user.id,
        Book.show_in_public == True
    ).scalar()
    
    # Books by author (top 10)
    books_by_author = []
    books = db.query(Book).filter(
        Book.user_id == user.id,
        Book.show_in_public == True,
        Book.authors.isnot(None)
    ).all()
    
    author_counts = {}
    for book in books:
        try:
            authors = json.loads(book.authors) if book.authors else []
            for author in authors:
                author_counts[author] = author_counts.get(author, 0) + 1
        except:
            pass
    
    books_by_author = [
        {"author": author, "count": count}
        for author, count in sorted(author_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    # Books by tag
    tag_query = db.query(
        Tag.name,
        func.count(Book.id).label('count')
    ).join(Book.tags).filter(
        Book.user_id == user.id,
        Book.show_in_public == True
    ).group_by(Tag.name).order_by(func.count(Book.id).desc()).limit(10)
    
    books_by_tag = [
        {"tag": row.name, "count": row.count}
        for row in tag_query.all()
    ]
    
    # Recent additions (5)
    recent = db.query(Book).filter(
        Book.user_id == user.id,
        Book.show_in_public == True
    ).order_by(Book.created_at.desc()).limit(5).all()
    
    # Pinned books
    pinned = db.query(Book).filter(
        Book.user_id == user.id,
        Book.show_in_public == True,
        Book.is_pinned == True
    ).order_by(Book.created_at.desc()).limit(5).all()
    
    return LibraryStats(
        total_books=total_books,
        books_by_author=books_by_author,
        books_by_location=[],  # Don't show locations in public view
        books_by_tag=books_by_tag,
        recent_additions=recent,
        pinned_books=pinned
    )
