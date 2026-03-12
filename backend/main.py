from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine
import models
from config import FRONTEND_URL

import logging
import os

# Create uploads directory if it doesn't exist
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
AVATARS_DIR = os.path.join(UPLOADS_DIR, "avatars")
os.makedirs(AVATARS_DIR, exist_ok=True)

# Initialize DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BudgetTracker API")

# Mount uploads directory
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    FRONTEND_URL,
    "http://localhost:5173", # Vite default
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the BudgetTracker API"}

from routers import auth, transactions, budgets, preferences, alerts, recurring_transactions, notifications

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(preferences.router)
app.include_router(alerts.router)
app.include_router(recurring_transactions.router)
app.include_router(notifications.router)
