#!/usr/bin/env bash

# Quick Start Script for Notification System Setup
# Run this after getting your API keys

set -e

echo "🔔 BudgetTracker Notification System Setup"
echo "========================================"
echo ""

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found!"
    echo "Please create .env.local with your API keys:"
    echo ""
    echo "VITE_SUPABASE_URL=your_url"
    echo "VITE_SUPABASE_ANON_KEY=your_key"
    echo "VITE_RESEND_API_KEY=re_your_resend_key"
    echo "VITE_VAPID_PUBLIC_KEY=your_public_key"
    echo ""
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js 16+"
    exit 1
fi

echo "✅ Prerequisites checked"
echo ""

# Check npm packages
echo "📦 Checking npm packages..."
if ! npm list @tensorflow/tfjs > /dev/null 2>&1; then
    echo "Installing dependencies..."
    npm install
else
    echo "✅ Dependencies installed"
fi

echo ""
echo "🔐 Setup Steps:"
echo "1. Create migration in Supabase console"
echo "   - Copy: supabase/migrations/notification_queue_setup.sql"
echo "   - Paste in Supabase SQL Editor"
echo "   - Execute"
echo ""
echo "2. Add Supabase secret"
echo "   Command:"
echo "   supabase secrets set RESEND_API_KEY=\$VITE_RESEND_API_KEY"
echo ""
echo "3. Create Edge Function"
echo "   - Name: send-notification-email"
echo "   - Copy: supabase/functions/send-notification-email/index.ts"
echo "   - Deploy"
echo ""
echo "4. Start development server"
echo "   npm run dev"
echo ""
echo "5. Test notifications"
echo "   - Create budget: ₹1000"
echo "   - Create expense: ₹1500"
echo "   - Check AlertsPage and email"
echo ""
echo "✅ Setup complete! Happy budgeting! 🎉"
