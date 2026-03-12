#!/usr/bin/env bash

# Quick Start Script for Notification System Setup
# Run this after getting your API keys

set -e

echo "🔔 BudgetTracker Notification System Setup"
echo "========================================"
echo ""

# Check for .env.local (Frontend)
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found!"
    echo "Please create .env.local in the project root with:"
    echo ""
    echo "VITE_VAPID_PUBLIC_KEY=your_public_key"
    echo ""
    exit 1
fi

# Check for backend/.env (Backend)
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env not found!"
    echo "Please create .env in the backend folder with:"
    echo ""
    echo "SECRET_KEY=your_secret_key"
    echo "RESEND_API_KEY=re_your_resend_key"
    echo "VAPID_PRIVATE_KEY=your_private_key"
    echo ""
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js 18+"
    exit 1
fi

# Check Python
if ! command -v python &> /dev/null; then
    echo "❌ Python not found! Please install Python 3.10+"
    exit 1
fi

echo "✅ Prerequisites checked"
echo ""

# Check npm packages
echo "📦 Checking npm packages..."
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo "✅ Frontend dependencies installed"
fi

echo ""
echo "🔐 Setup Steps:"
1. Configure backend/
   - Ensure venv is activated
   - pip install -r requirements.txt
   - Verify .env contains RESEND_API_KEY and VAPID_PRIVATE_KEY

2. Start the servers
   - Backend: uvicorn main:app --reload (in backend/)
   - Frontend: npm run dev (in root)

3. Test notifications
   - Create budget: ₹1000
   - Create expense: ₹1500
   - Check Alerts tab and email

✅ Setup complete! Happy budgeting! 🎉
