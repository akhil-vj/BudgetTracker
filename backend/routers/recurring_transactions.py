from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models, database
from .auth import get_current_user

router = APIRouter(prefix="/recurring_transactions", tags=["Recurring Transactions"])

@router.get("/", response_model=List[schemas.RecurringTransactionResponse])
def get_recurring(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    items = db.query(models.RecurringTransaction).filter(
        models.RecurringTransaction.user_id == current_user.id,
        models.RecurringTransaction.is_active == True
    ).order_by(models.RecurringTransaction.next_due_date.asc()).all()
    return items

@router.post("/", response_model=schemas.RecurringTransactionResponse)
def create_recurring(item: schemas.RecurringTransactionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    new_item = models.RecurringTransaction(**item.model_dump(), user_id=current_user.id)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/{item_id}", response_model=schemas.RecurringTransactionResponse)
def update_recurring(item_id: str, item: schemas.RecurringTransactionUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_item = db.query(models.RecurringTransaction).filter(
        models.RecurringTransaction.id == item_id,
        models.RecurringTransaction.user_id == current_user.id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    for key, value in item.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_recurring(item_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_item = db.query(models.RecurringTransaction).filter(
        models.RecurringTransaction.id == item_id,
        models.RecurringTransaction.user_id == current_user.id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    db_item.is_active = False
    db.commit()
    return {"message": "Item deactivated successfully"}
