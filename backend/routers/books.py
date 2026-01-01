from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
import json
import csv
import io

from database import get_db
from models import User, Book, Tag, Location
from schemas import (
    BookCreate, BookUpdate, BookResponse, ISBNLookupResponse,
    CSVImportProgress
)
from auth import get_current_user
from services import openlibrary_service

router = APIRouter(prefix="/api/books", tags=["books"])

@router.get("/", response_model=List[BookResponse])
def get_my_books(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    author: Optional[str] = None,
    tag: Optional[str] = None,
    location_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Book).filter(Book.user_id == current_user.id)
    
    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Book.title.ilike(search_pattern),
                Book.authors.ilike(search_pattern),
                Book.isbn.ilike(search_pattern)
            )
        )
    
    if author:
        query = query.filter(Book.authors.ilike(f"%{author}%"))
    
    if tag:
        query = query.join(Book.tags).filter(Tag.name == tag)
    
    if location_id:
        query = query.filter(Book.location_id == location_id)
    
    # Order by pinned first, then newest
    query = query.order_by(Book.is_pinned.desc(), Book.created_at.desc())
    
    return query.offset(skip).limit(limit).all()

@router.get("/{book_id}", response_model=BookResponse)
def get_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(
        Book.id == book_id,
        Book.user_id == current_user.id
    ).first()
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return book

@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book_data: BookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check for duplicates if ISBN provided
    if book_data.isbn:
        existing = db.query(Book).filter(
            Book.user_id == current_user.id,
            Book.isbn == book_data.isbn
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Book with this ISBN already exists in your library"
            )
    
    # Create book
    book_dict = book_data.model_dump(exclude={"tag_names"})
    db_book = Book(**book_dict, user_id=current_user.id)
    
    # Handle tags
    if book_data.tag_names:
        for tag_name in book_data.tag_names:
            tag = db.query(Tag).filter(Tag.name == tag_name).first()
            if not tag:
                tag = Tag(name=tag_name)
                db.add(tag)
            db_book.tags.append(tag)
    
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    
    return db_book

@router.patch("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: int,
    book_update: BookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(
        Book.id == book_id,
        Book.user_id == current_user.id
    ).first()
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Update fields
    update_data = book_update.model_dump(exclude_unset=True, exclude={"tag_names"})
    for field, value in update_data.items():
        setattr(book, field, value)
    
    # Update tags if provided
    if book_update.tag_names is not None:
        book.tags = []
        for tag_name in book_update.tag_names:
            tag = db.query(Tag).filter(Tag.name == tag_name).first()
            if not tag:
                tag = Tag(name=tag_name)
                db.add(tag)
            book.tags.append(tag)
    
    db.commit()
    db.refresh(book)
    
    return book

@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(
        Book.id == book_id,
        Book.user_id == current_user.id
    ).first()
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    db.delete(book)
    db.commit()

@router.get("/isbn/lookup/{isbn}", response_model=ISBNLookupResponse)
async def lookup_isbn(isbn: str):
    """Lookup book metadata by ISBN from Open Library"""
    result = await openlibrary_service.lookup_isbn(isbn)
    
    if not result:
        raise HTTPException(
            status_code=404,
            detail="Book not found for this ISBN"
        )
    
    return ISBNLookupResponse(**result)

@router.post("/import/csv", response_model=CSVImportProgress)
async def import_books_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import books from CSV file with ISBN column
    Expected format: ISBN (required), Title (optional), Authors (optional)
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    csv_data = io.StringIO(content.decode('utf-8'))
    reader = csv.DictReader(csv_data)
    
    progress = CSVImportProgress(total=0, processed=0, successful=0, failed=0)
    
    # Count total rows
    rows = list(reader)
    progress.total = len(rows)
    
    for row in rows:
        progress.processed += 1
        isbn = row.get('ISBN', '').strip()
        
        if not isbn:
            progress.failed += 1
            progress.errors.append(f"Row {progress.processed}: No ISBN provided")
            continue
        
        # Check for duplicate
        existing = db.query(Book).filter(
            Book.user_id == current_user.id,
            Book.isbn == isbn
        ).first()
        
        if existing:
            progress.failed += 1
            progress.errors.append(f"Row {progress.processed}: Book with ISBN {isbn} already exists")
            continue
        
        try:
            # Try to fetch metadata
            metadata = await openlibrary_service.lookup_isbn(isbn)
            
            if metadata:
                # Use metadata from API
                authors_str = json.dumps(metadata.get('authors', []))
                db_book = Book(
                    user_id=current_user.id,
                    isbn=isbn,
                    title=metadata.get('title') or row.get('Title', 'Unknown'),
                    authors=authors_str,
                    cover_url=metadata.get('cover_url'),
                    publisher=metadata.get('publisher'),
                    published_year=metadata.get('published_year'),
                    page_count=metadata.get('page_count'),
                    description=metadata.get('description')
                )
            else:
                # Use CSV data only
                authors = row.get('Authors', '').strip()
                authors_str = json.dumps([authors]) if authors else None
                db_book = Book(
                    user_id=current_user.id,
                    isbn=isbn,
                    title=row.get('Title', 'Unknown'),
                    authors=authors_str
                )
            
            db.add(db_book)
            progress.successful += 1
            
        except Exception as e:
            progress.failed += 1
            progress.errors.append(f"Row {progress.processed}: {str(e)}")
    
    db.commit()
    return progress

@router.get("/export/csv")
def export_books_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export user's library as CSV"""
    from fastapi.responses import StreamingResponse
    
    books = db.query(Book).filter(Book.user_id == current_user.id).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        'ISBN', 'Title', 'Authors', 'Publisher', 'Published Year',
        'Page Count', 'Location', 'Condition', 'Tags', 'Notes', 'Added'
    ])
    
    # Data
    for book in books:
        location_name = book.location.name if book.location else ''
        tags = ', '.join([tag.name for tag in book.tags])
        
        writer.writerow([
            book.isbn or '',
            book.title,
            book.authors or '',
            book.publisher or '',
            book.published_year or '',
            book.page_count or '',
            location_name,
            book.condition or '',
            tags,
            book.notes or '',
            book.created_at.isoformat()
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=library_{current_user.username}.csv"}
    )
