# 💰 Budget Tracker - Personal Finance Management

> A comprehensive full-stack application for tracking income, expenses, budgets, and financial analytics with AI-powered expense predictions and smart notifications.

**Project Type:** Full-Stack Web Application  
**Technologies:** React 18 + TypeScript + Vite + Supabase PostgreSQL + TensorFlow.js

---

## 📋 Quick Navigation

- [What This Project Does](#what-this-project-does)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup & Run (5 Steps)](#setup--run-5-steps)
- [Project Structure](#project-structure)
- [Features Overview](#features-overview)
- [Troubleshooting](#troubleshooting)

---

## ✅ What This Project Does

This is a **Personal Finance Tracker** application that helps users:
- **Track Income & Expenses** - Record all financial transactions with categories and dates
- **Create & Monitor Budgets** - Set spending limits per category and get alerts
- **View Analytics** - Interactive dashboards with charts and spending insights
- **Get AI Predictions** - Machine learning predicts future spending based on history
- **Multi-Currency Support** - Track finances in INR, USD, EUR, GBP, JPY
- **Receive Notifications** - Get alerted when approaching budget limits
- **Responsive Design** - Works on desktop, tablet, and mobile devices

---

## ✨ Features

### Core Functionality
- **💰 Income & Expense Tracking** - Categorize and record all financial transactions with timestamps and notes
- **💳 Budget Management** - Create category-specific budgets, track spending progress, and get real-time alerts
- **📊 Advanced Analytics** - Interactive dashboards with spending charts, category breakdowns, and trend analysis
- **🔔 Smart Notifications** - Multi-channel alerts (push notifications, email, in-app) when approaching budget limits
- **🌍 Multi-Currency Support** - Track finances in INR, USD, EUR, GBP, JPY with automatic conversion rates

### Advanced Features
- **🤖 AI-Powered Predictions** - TensorFlow.js neural network analyzes spending patterns to predict future expenses
- **📱 Responsive Design** - Seamless experience on desktop, tablet, and mobile devices
- **🎨 Dark Mode** - Eye-friendly interface with smooth animations and modern design
- **🔐 Secure Authentication** - Email/password authentication with Supabase PostgreSQL backend
- **📄 PDF Export** - Generate financial reports and export transactions as PDF
- **🔄 Recurring Transactions** - Automate recurring income and expense entries
- **🚀 Offline Support** - Service Worker enables offline functionality with sync on reconnect

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - Modern UI library with hooks
- **TypeScript 5.8** - Type-safe JavaScript
- **Vite 5.4** - Lightning-fast build tool and dev server
- **React Router 6** - Client-side routing
- **TanStack Query (React Query)** - Server state management
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Shadcn/UI** - 45+ high-quality React components
- **Recharts 2.15** - Charting library for analytics

### Backend & Database
- **Supabase** - PostgreSQL database with authentication
- **Row Level Security (RLS)** - Database-level access control
- **Edge Functions** - Serverless functions for notifications

### Machine Learning
- **TensorFlow.js 4.17** - Neural network for expense predictions
- **3-Layer Neural Network** - 64→32→16 neurons with dropout regularization

---

## 📋 Prerequisites

Make sure you have these installed:
- **Node.js 18+** ([download](https://nodejs.org))
- **npm** (comes with Node.js) or **bun** package manager
- **Supabase account** (free at [supabase.com](https://supabase.com))

Verify installation:
```bash
node --version    # Should be v18 or higher
npm --version     # Should be v9 or higher
```

---

## 🚀 Setup & Run (5 Steps)

### Step 1: Install Dependencies

```bash
# Install all npm packages
npm install
```

This reads `package.json` and installs React, TypeScript, Tailwind CSS, Supabase client, and all other dependencies.

**What happens:**
- Creates `node_modules/` folder with all libraries
- Creates `package-lock.json` (lock file for exact versions)
- Takes 1-2 minutes

### Step 2: Create Supabase Project

1. Visit [supabase.com](https://supabase.com) and sign up (free)
2. Click **"New Project"**
3. Fill in project details:
   - **Project name:** `BudgetTracker` (or any name)
   - **Database password:** Use a strong password
   - **Region:** Choose closest to you (e.g., Singapore if in India)
   - Click **"Create new project"**
4. **Wait 2-3 minutes** for Supabase to set up your database

### Step 3: Get Your Supabase Credentials

1. Open your Supabase project dashboard
2. Click **Settings** (bottom left)
3. Go to **API** tab
4. Copy these two values:
   - **Project URL** (starts with `https://...`)
   - **Anon (public)** key (long alphanumeric string)

**Keep these safe!** You'll need them next.

### Step 4: Configure Environment Variables

1. Create a file named `.env.local` in the **project root** (same level as `package.json`)

2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your_project_id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

**Replace the values** with what you copied from Supabase.

**Example:**
```env
VITE_SUPABASE_URL=https://nxqmypesjsbitkpatuvk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Important:** 
- Never commit `.env.local` to git
- It's already in `.gitignore`
- Keep your keys private

### Step 5: Run the Application

```bash
# Start the development server
npm run dev
```

**What you'll see:**
```
➜  Local:   http://localhost:8080/
```

**Open your browser** and go to: **http://localhost:8080**

The app will load and show the **Sign Up / Login page**.

---

## 🎯 Using the Application

### First Time Setup

1. **Create Account:**
   - Click "Sign Up"
   - Enter email and password
   - Click "Create Account"
   - Verify your email (check inbox + spam folder)

2. **Login:**
   - Click "Login"
   - Enter your email and password
   - You're in!

### What You Can Do

**Dashboard (Home Page):**
- See overview of all your budgets
- View recent transactions
- Check spending trends
- See AI predictions for next month

**Add Transactions:**
1. Click "Expenses" or "Income"
2. Click "Add Transaction"
3. Fill in: Amount, Category, Date, Notes
4. Click "Save"
5. Transaction appears immediately

**Create Budgets:**
1. Click "Budgets"
2. Click "Create Budget"
3. Select category and set monthly limit
4. Click "Create"
5. Track spending vs. limit in real-time

**View Analytics:**
1. Click "Analytics"
2. See charts of your spending
3. Filter by time period or category
4. Export as PDF

**Check AI Predictions:**
1. Click "Predictions"
2. See predicted spending for next month
3. View accuracy metrics (R² score, confidence)

**Manage Settings:**
1. Click "Settings"
2. Change currency, theme, notifications
3. Enable push notifications
4. Update profile

---

## 📁 Project Structure Explained

```
BudgetTracker/
├── src/
│   ├── App.tsx                           # Main app component + routing
│   ├── main.tsx                          # Entry point
│   │
│   ├── pages/                            # Full page components
│   │   ├── Auth.tsx                      # Login & signup page
│   │   ├── Index.tsx                     # Dashboard
│   │   ├── ResetPassword.tsx             # Password reset
│   │   └── NotFound.tsx                  # 404 page
│   │
│   ├── components/
│   │   ├── layout/                       # Header, Sidebar, Navigation
│   │   ├── pages/                        # Page-specific components
│   │   │   ├── ExpensesPage.tsx          # Expenses tracker
│   │   │   ├── IncomePage.tsx            # Income tracker
│   │   │   ├── BudgetsPage.tsx           # Budget management
│   │   │   ├── AnalyticsPage.tsx         # Charts & insights
│   │   │   ├── PredictionsPage.tsx       # AI predictions
│   │   │   ├── SettingsPage.tsx          # User settings
│   │   │   └── AlertsPage.tsx            # Alert management
│   │   ├── dashboard/                    # Dashboard widgets
│   │   ├── ui/                           # 45+ UI components
│   │   └── modals/                       # Add/edit modals
│   │
│   ├── hooks/                            # Custom React hooks
│   │   ├── useAuth.ts                    # Authentication logic
│   │   ├── useTransactions.ts            # Transaction data fetching
│   │   ├── useBudgets.ts                 # Budget management
│   │   ├── useNotifications.ts           # Push notifications
│   │   └── ... (more hooks)
│   │
│   ├── lib/                              # Utility functions
│   │   ├── env.ts                        # Environment variable validation
│   │   ├── utils.ts                      # General utilities
│   │   ├── currency.ts                   # Currency formatting
│   │   ├── mlPrediction.ts               # TensorFlow predictions
│   │   ├── notificationService.ts        # Notifications
│   │   └── alertService.ts               # Budget alerts
│   │
│   ├── contexts/                         # React Context for global state
│   │   ├── AuthContext.tsx               # User authentication state
│   │   └── PreferencesContext.tsx        # User preferences
│   │
│   └── types/
│       └── finance.ts                    # TypeScript type definitions
│
├── supabase/
│   ├── config.toml                       # Supabase project config
│   └── migrations/                       # Database schema files
│       ├── initial_schema.sql            # Tables: profiles, transactions, etc.
│       ├── transactions_budgets_alerts.sql
│       └── ... (more migrations)
│
├── public/
│   ├── manifest.json                     # PWA configuration
│   ├── sw.js                             # Service worker
│   └── robots.txt
│
└── Configuration Files
    ├── package.json                      # Project dependencies
    ├── vite.config.ts                    # Vite build config
    ├── tsconfig.json                     # TypeScript config
    ├── tailwind.config.ts                # Tailwind CSS config
    └── eslint.config.js                  # Code quality rules
```

---

## 🗄️ Database Structure

The application uses **Supabase PostgreSQL** with these main tables:

### Tables & What They Store

| Table | Purpose | Contains |
|-------|---------|----------|
| `profiles` | User info | Name, email, profile picture, currency preference |
| `transactions` | Income/Expense records | Amount, category, date, description, user |
| `budgets` | Spending limits | Category, limit, month, user |
| `alerts` | Budget notifications | Alert type, budget, triggered status |
| `auth.users` | Authentication | Email, password (hashed), login info |

### How It Works

1. **User Signs Up** → Supabase creates entry in `auth.users` table
2. **User Adds Transaction** → Record saved to `transactions` table
3. **User Creates Budget** → Record saved to `budgets` table
4. **Check Budget Limit** → App queries transactions vs budget limit
5. **Trigger Alert** → If spending ≥ 80% of limit, create alert

All data is **encrypted in transit** (HTTPS) and **Row Level Security** ensures users only see their own data.

---

## 🤖 AI Predictions (Machine Learning)

### How It Works

The app uses **TensorFlow.js** - a machine learning library that runs in your browser:

1. **Collects Data:** Analyzes your last 30+ transactions
2. **Trains Neural Network:** 3-layer network with 64→32→16 neurons
3. **Learns Pattern:** Understands your spending habits
4. **Predicts Future:** Forecasts next month's spending per category

### Neural Network Architecture

```
Input (historical transactions)
    ↓
Dense Layer: 64 neurons + Dropout
    ↓
Dense Layer: 32 neurons + Dropout
    ↓
Dense Layer: 16 neurons
    ↓
Output: Predicted spending per category
```

### Accuracy Metrics

- **R² Score** - How well model fits (0-100%, >80% = good)
- **MAE** - Average error amount
- **Confidence** - Overall reliability score (0-100%)

### Requirements

- Minimum **15 transactions** needed
- **30+ days** of history for best accuracy

---

## 🧰 Available Commands

```bash
# Start development server (with live reload)
npm run dev

# Build for production
npm run build

# Build with source maps (for debugging)
npm run build:dev

# Check code quality
npm run lint

# Preview production build locally
npm run preview
```

---

## ❌ Troubleshooting

### Issue: "Cannot find module @/components..."

**Solution:**
- Check `tsconfig.json` has `"@": "./src"`
- Restart VS Code
- Run `npm install` again

### Issue: "Missing required environment variables"

**Solution:**
1. Check if `.env.local` file exists
2. Verify it has both variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Restart dev server: `npm run dev`

### Issue: "Port 8080 already in use"

**Solution:**
```bash
# Option 1: Use different port
npm run dev -- --port 3000

# Option 2: Kill process using port 8080
# On Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Issue: "ML Predictions showing error"

**Reasons & Solutions:**
1. Need at least **15 transactions** in your account
2. Need **30+ days** of transaction history
3. Refresh the page after adding more data

### Issue: "Sign up/login not working"

**Check:**
1. Is Supabase project active? (Check Supabase dashboard)
2. Are `.env.local` credentials correct?
3. Does email format look valid?
4. Check browser console (F12) for error messages

### Issue: "Notifications not appearing"

**Solutions:**
1. Allow browser notification permission when prompted
2. Go to Settings and enable notifications
3. Check browser console for errors
4. Note: Push notifications only work on HTTPS (works in production)

---

## 📚 Key Files to Understand

### Authentication Flow
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) - Manages login/signup state
- [src/pages/Auth.tsx](src/pages/Auth.tsx) - Login/signup UI
- [src/components/auth/ProtectedRoute.tsx](src/components/auth/ProtectedRoute.tsx) - Prevents unauthorized access

### Transaction Management
- [src/hooks/useTransactions.ts](src/hooks/useTransactions.ts) - Fetch & manage transactions
- [src/components/pages/ExpensesPage.tsx](src/components/pages/ExpensesPage.tsx) - Expense UI
- [src/components/modals/TransactionModal.tsx](src/components/modals/TransactionModal.tsx) - Add/edit modal

### Budget & Alerts
- [src/hooks/useBudgets.ts](src/hooks/useBudgets.ts) - Budget operations
- [src/lib/alertService.ts](src/lib/alertService.ts) - Alert logic
- [src/components/pages/BudgetsPage.tsx](src/components/pages/BudgetsPage.tsx) - Budget UI

### AI Predictions
- [src/lib/mlPrediction.ts](src/lib/mlPrediction.ts) - TensorFlow neural network
- [src/components/pages/PredictionsPage.tsx](src/components/pages/PredictionsPage.tsx) - Predictions UI

### Analytics
- [src/components/pages/AnalyticsPage.tsx](src/components/pages/AnalyticsPage.tsx) - Charts & analytics
- [src/components/dashboard/](src/components/dashboard/) - Dashboard widgets

---

## 📖 More Documentation

For detailed technical documentation, see:
- [COMPLETE_DOCUMENTATION.md](COMPLETE_DOCUMENTATION.md) - In-depth architecture
- [DOCUMENTATION.md](DOCUMENTATION.md) - Database & configuration details

---

## ❤️ Project Summary

This is a **full-stack web application** built with modern technologies:

✅ **Frontend:** React + TypeScript + Tailwind CSS  
✅ **Backend:** Supabase PostgreSQL with RLS  
✅ **Machine Learning:** TensorFlow.js neural networks  
✅ **Features:** Transactions, budgets, analytics, predictions, notifications  
✅ **Security:** Authentication, encrypted data, row-level security  
✅ **Responsive:** Works on all devices  

The project demonstrates:
- Advanced React patterns (Context API, custom hooks, React Router)
- TypeScript for type safety
- Database design with Supabase
- Machine learning in the browser
- Responsive UI design
- State management (TanStack Query)
- Real-world application architecture
