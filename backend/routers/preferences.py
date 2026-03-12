from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import schemas
import models
import database
from routers.auth import get_current_user

router = APIRouter(prefix="/preferences", tags=["Preferences"])

@router.get("/", response_model=schemas.UserPreferenceResponse)
def get_preferences(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    prefs = db.query(models.UserPreference).filter(models.UserPreference.user_id == current_user.id).first()
    if not prefs:
        raise HTTPException(status_code=404, detail="Preferences not found")
    return prefs

@router.put("/", response_model=schemas.UserPreferenceResponse)
def update_preferences(prefs_update: schemas.UserPreferenceBase, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_prefs = db.query(models.UserPreference).filter(models.UserPreference.user_id == current_user.id).first()
    
    if not db_prefs:
        raise HTTPException(status_code=404, detail="Preferences not found")
        
    for key, value in prefs_update.model_dump(exclude_unset=True).items():
        setattr(db_prefs, key, value)
        
    db.commit()
    db.refresh(db_prefs)
    return db_prefs
