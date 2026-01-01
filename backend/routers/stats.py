from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

from database import get_db
from models import User, Book, Tag, Location
from schemas import LibraryStats
from auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/", response_model=LibraryStats)
def get_library_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics for current user's library"""
    
    # Total books
    total_books = db.query(func.count(Book.id)).filter(
        Book.user_id == current_user.id
    ).scalar()
    
    # Books by author
    books = db.query(Book).filter(
        Book.user_id == current_user.id,
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
    
    # Books by location
    location_query = db.query(
        Location.name,
        func.count(Book.id).label('count')
    ).join(Book, Book.location_id == Location.id).filter(
        Location.user_id == current_user.id
    ).group_by(Location.name).order_by(func.count(Book.id).desc())
    
    books_by_location = [
        {"location": row.name, "count": row.count}
        for row in location_query.all()
    ]
    
    # Books by tag
    tag_query = db.query(
        Tag.name,
        func.count(Book.id).label('count')
    ).join(Book.tags).filter(
        Book.user_id == current_user.id
    ).group_by(Tag.name).order_by(func.count(Book.id).desc()).limit(10)
    
    books_by_tag = [
        {"tag": row.name, "count": row.count}
        for row in tag_query.all()
    ]
    
    # Recent additions
    recent = db.query(Book).filter(
        Book.user_id == current_user.id
    ).order_by(Book.created_at.desc()).limit(10).all()
    
    # Pinned books
    pinned = db.query(Book).filter(
        Book.user_id == current_user.id,
        Book.is_pinned == True
    ).order_by(Book.created_at.desc()).all()
    
    return LibraryStats(
        total_books=total_books,
        books_by_author=books_by_author,
        books_by_location=books_by_location,
        books_by_tag=books_by_tag,
        recent_additions=recent,
        pinned_books=pinned
    )
