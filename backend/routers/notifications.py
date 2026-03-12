from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import schemas
import models
import database
from routers.auth import get_current_user
from services.notifications import send_notification_email, NotificationPayload

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.post("/email")
async def trigger_email_notification(payload: NotificationPayload, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if payload.userId != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to send email for this user")
    
    # Send email using Resend
    result = await send_notification_email(payload)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return {"message": "Email sent successfully"}
