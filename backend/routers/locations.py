from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Location
from schemas import LocationCreate, LocationResponse
from auth import get_current_user

router = APIRouter(prefix="/api/locations", tags=["locations"])

@router.get("/", response_model=List[LocationResponse])
def get_locations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all locations for current user"""
    return db.query(Location).filter(Location.user_id == current_user.id).all()

@router.post("/", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    location_data: LocationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new location"""
    db_location = Location(**location_data.model_dump(), user_id=current_user.id)
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a location"""
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.user_id == current_user.id
    ).first()
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    db.delete(location)
    db.commit()
