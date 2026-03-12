# 💰 BudgetTracker — Personal Finance Management

> Track income, expenses, budgets, and get AI-powered spending predictions — all in your browser.

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Python (FastAPI) · SQLite · TensorFlow.js

---

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Setup from Scratch](#-setup-from-scratch-step-by-step)
- [Running the App](#-running-the-app)
- [Project Structure](#-project-structure)
- [Available Commands](#-available-commands)
- [How to Use the App](#-how-to-use-the-app)
- [AI Predictions](#-ai-predictions)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

- **💰 Income & Expense Tracking** — Categorize transactions with dates, notes, and payment methods
- **💳 Budget Management** — Set category-specific spending limits with real-time progress tracking
- **📊 Analytics Dashboard** — Interactive charts, category breakdowns, and trend analysis
- **🤖 AI Predictions** — TensorFlow.js neural network predicts future spending from your history
- **🔔 Smart Notifications** — Alerts when approaching budget limits (push, email, in-app)
- **🌍 Multi-Currency** — INR, USD, EUR, GBP, JPY with automatic formatting
- **🎨 Dark Mode** — Beautiful dark theme with smooth animations
- **📄 PDF Export** — Generate and download financial reports
- **🔄 Recurring Transactions** — Automate repeating income/expenses
- **🔐 Authentication** — Secure JWT authentication via Python FastAPI
- **📱 Responsive** — Works on desktop, tablet, and mobile

---

## 📋 Prerequisites

You need the following installed on your computer before starting:

### 1. Node.js (v18 or higher)
Download from [nodejs.org](https://nodejs.org/) — choose the **LTS** version.

### 2. Python (v3.10 or higher)
Download from [python.org](https://www.python.org/).

### 3. Git
Download from [git-scm.com](https://git-scm.com/downloads).

---

## 🚀 Setup from Scratch (Step by Step)

### Step 1: Clone the Repository
```bash
git clone https://github.com/akhil-vj/BudgetTracker.git
cd BudgetTracker
```

### Step 2: Frontend Setup
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Step 3: Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

### Step 4: Configure Backend Environment
Update `backend/.env` with your secrets:
- `SECRET_KEY`: A long random string for JWT
- `RESEND_API_KEY`: Your Resend API key for email notifications
- `VAPID_PRIVATE_KEY`: Private key for push notifications

### Step 5: (Optional) VAPID Keys
Generate keys if you want push notifications:
```bash
node generate-vapid-keys.js
```
Follow the output instructions to update `.env.local` and `backend/.env`.

> **Note:** `.env.local` is already in `.gitignore` so it won't be pushed to GitHub.

---

## ▶️ Running the App

### 1. Start the Backend
```bash
cd backend
# Activate venv first (see Step 3)
uvicorn main:app --reload --port 8000
```

### 2. Start the Frontend
```bash
# In the project root
npm run dev
```

**Open your browser** and go to: **http://localhost:3000**

---

## 📁 Project Structure

```
BudgetTracker/
├── backend/                          # Python FastAPI Backend
│   ├── main.py                       # App entry point & configuration
│   ├── database.py                   # SQLAlchemy connection & session
│   ├── models.py                     # SQLAlchemy database models
│   ├── schemas.py                    # Pydantic validation schemas
│   ├── utils.py                      # Auth & utility helpers
│   ├── routers/                      # API route handlers
│   └── uploads/                      # User-uploaded files (avatars)
│
├── src/                              # Frontend Source Code
│   ├── pages/                        # Page components
│   ├── components/                   # UI & feature components
│   ├── hooks/                        # Custom data hooks (Axios)
│   ├── contexts/                     # Auth & Preferences state
│   └── lib/                          # ML & utility functions
│
├── public/                           # Static assets & Service Worker
├── package.json                      # Frontend dependencies
├── vite.config.ts                    # Build configuration
└── README.md                         # This file
```

---

## 🧰 Available Commands

| Command | What It Does |
|---------|--------------|
| `npm run dev` | Start frontend (http://localhost:3000) |
| `npm run build` | Build frontend production bundle |
| `uvicorn main:app --reload` | Start backend (in `backend/` folder) |
| `node generate-vapid-keys.js` | Generate VAPID keys for push notifications |

---

## 🎯 How to Use the App

1. **Sign Up**: Create an account with email and password.
2. **Track**: Add transactions in the Expenses or Income pages.
3. **Budget**: Set monthly limits and track progress in real-time.
4. **Predict**: Use the AI Predictions tab after adding enough data.
5. **Manage**: Update your profile and settings in the sidebar.

---

## 🤖 AI Predictions

The app uses **TensorFlow.js** to run a neural network directly in your browser:
- Analyzes your transaction history locally.
- Forecasts spending per category for the next month.
- Requires at least **15 transactions** over **30 days**.

---

## ❌ Troubleshooting

### "Backend: ModuleNotFound or access denied"
1. Ensure your virtual environment is activated.
2. Run `pip install -r requirements.txt` again.
3. For file locks on Windows, close any processes using the `backend/` folder.

### "Frontend: 401 Unauthorized"
1. This is expected if your local database is empty. Register a new account first.
2. If you were logged in, try clearing your browser's local storage or clicking log out.

### "Push Notifications not working"
1. Ensure you have added `VAPID_PRIVATE_KEY` to `backend/.env`.
2. Ensure you have added `VITE_VAPID_PUBLIC_KEY` to `.env.local`.
3. Restart both backend and frontend servers.

---

## 🛠️ Tech Stack Details

|    Layer     |       Technology      | Version |          Purpose      |
|   -------    |      -----------      |---------|        ---------      |
| UI Framework | React                 | 18.3    | Component-based UI |
| Language     | TypeScript            | 5.8     | Type safety |
| Build Tool   | Vite                  | 5.4     | Dev server & bundling |
| Styling      | Tailwind CSS          | 3.4     | Utility-first CSS |
| Components   | shadcn/ui             |    —    | Pre-built UI components |
| Routing      | React Router          | 6.30    | Client-side navigation |
| State        | TanStack Query        | 5.83    | Server state management |
| Charts       | Recharts              | 2.15    | Data visualization |
| Database     | SQLite                |   —     | Local data storage |
| Backend API  | Python (FastAPI)      |  0.109  | Server-side logic & Auth |
| ML           | TensorFlow.js         |  4.17   | Browser-side neural network |
| PDF          | jsPDF                 |  4.0    | Report generation |
| Animations   | Framer Motion         |  12.23  | UI animations |

---

## 📄 License

MIT
