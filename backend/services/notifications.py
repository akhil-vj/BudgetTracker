import os
import httpx
from pydantic import BaseModel
from typing import Optional, Dict, Any

RESEND_API_KEY = os.getenv("RESEND_API_KEY")

class NotificationPayload(BaseModel):
    userId: str
    email: str
    type: str # 'budget_alert' | 'goal_milestone' | 'bill_reminder' | 'spending_summary' | 'savings_milestone'
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None

async def send_notification_email(payload: NotificationPayload) -> dict:
    if not RESEND_API_KEY:
        print("RESEND_API_KEY is not set. Email not sent.")
        return {"error": "RESEND_API_KEY not set"}

    email_html = f"""
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
          <h1 style="font-size: 24px; color: #1f2937;">{payload.title}</h1>
          <p style="color: #4b5563;">{payload.message}</p>
        </div>
      </body>
    </html>
    """

    async with httpx.AsyncClient() as client:
        response = await client.post(
            'https://api.resend.com/emails',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {RESEND_API_KEY}',
            },
            json={
                'from': 'BudgetTracker <noreply@budgettracker.app>',
                'to': payload.email,
                'subject': payload.title,
                'html': email_html,
            }
        )

        if response.status_code >= 400:
            return {"error": response.text}

        return {"success": True, "data": response.json()}
