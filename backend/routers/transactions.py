from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models, database
from .auth import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/", response_model=List[schemas.TransactionResponse])
def get_transactions(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    transactions = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).order_by(models.Transaction.date.desc()).all()
    return transactions

@router.post("/", response_model=schemas.TransactionResponse)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    new_transaction = models.Transaction(**transaction.model_dump(), user_id=current_user.id)
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction

@router.put("/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(transaction_id: str, transaction: schemas.TransactionUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    for key, value in transaction.model_dump().items():
        setattr(db_transaction, key, value)
        
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    db.delete(db_transaction)
    db.commit()
    return {"message": "Transaction deleted successfully"}
