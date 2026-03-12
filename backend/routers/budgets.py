from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import schemas
import models
import database
from routers.auth import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("/", response_model=List[schemas.BudgetResponse])
def get_budgets(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    budgets = db.query(models.Budget).filter(models.Budget.user_id == current_user.id).all()
    return budgets

@router.post("/", response_model=schemas.BudgetResponse)
def create_budget(budget: schemas.BudgetCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    new_budget = models.Budget(**budget.model_dump(), user_id=current_user.id)
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget

@router.put("/{budget_id}", response_model=schemas.BudgetResponse)
def update_budget(budget_id: str, budget: schemas.BudgetUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id
    ).first()
    
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")
        
    for key, value in budget.model_dump(exclude_unset=True).items():
        setattr(db_budget, key, value)
        
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.delete("/{budget_id}")
def delete_budget(budget_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id
    ).first()
    
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")
        
    db.delete(db_budget)
    db.commit()
    return {"message": "Budget deleted successfully"}
