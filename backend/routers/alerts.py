from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models, database
from .auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("/", response_model=List[schemas.AlertResponse])
def get_alerts(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    alerts = db.query(models.Alert).filter(models.Alert.user_id == current_user.id).order_by(models.Alert.created_at.desc()).all()
    return alerts

@router.post("/", response_model=schemas.AlertResponse)
def create_alert(alert: schemas.AlertCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    new_alert = models.Alert(**alert.model_dump(), user_id=current_user.id)
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert

@router.put("/{alert_id}/read", response_model=schemas.AlertResponse)
def mark_alert_read(alert_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_alert = db.query(models.Alert).filter(
        models.Alert.id == alert_id,
        models.Alert.user_id == current_user.id
    ).first()
    
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    db_alert.read = True
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.delete("/{alert_id}")
def delete_alert(alert_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_alert = db.query(models.Alert).filter(
        models.Alert.id == alert_id,
        models.Alert.user_id == current_user.id
    ).first()
    
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    db.delete(db_alert)
    db.commit()
    return {"message": "Alert deleted successfully"}
