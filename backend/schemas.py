from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None

class UserProfileUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phoneNumber: Optional[str] = None
    location: Optional[str] = None

class UserResponse(UserBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserPreferenceBase(BaseModel):
    analytics_enabled: Optional[bool] = True
    currency: Optional[str] = "USD"
    dark_mode: Optional[bool] = False
    date_format: Optional[str] = "MM/DD/YYYY"
    notifications_email: Optional[bool] = True
    notifications_push: Optional[bool] = True
    notifications_sound: Optional[bool] = True
    predictions_enabled: Optional[bool] = True
    timezone: Optional[str] = "UTC"

class UserPreferenceResponse(UserPreferenceBase):
    id: str
    user_id: str

    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    type: str
    amount: float
    category: str
    description: Optional[str] = None
    date: str
    payment_method: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: str
    user_id: str

    class Config:
        from_attributes = True

class BudgetBase(BaseModel):
    category: str
    limit: float
    period: Optional[str] = "monthly"

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    limit: Optional[float] = None
    period: Optional[str] = None

class BudgetResponse(BudgetBase):
    id: str
    user_id: str

    class Config:
        from_attributes = True

class AlertBase(BaseModel):
    type: str
    title: str
    message: str
    read: Optional[bool] = False

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    read: Optional[bool] = None

class AlertResponse(AlertBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RecurringTransactionBase(BaseModel):
    category: str
    amount: float
    description: Optional[str] = None
    frequency: str
    day_of_month: Optional[int] = None
    day_of_week: Optional[int] = None
    next_due_date: str
    is_active: Optional[bool] = True

class RecurringTransactionCreate(RecurringTransactionBase):
    pass

class RecurringTransactionUpdate(RecurringTransactionBase):
    pass

class RecurringTransactionResponse(RecurringTransactionBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
