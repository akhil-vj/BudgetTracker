# BudgetTracker Documentation

## Project Files & Their Purpose

### 📁 supabase/config.toml
**What it is:** Configuration file for Supabase CLI

**What it does:**
- Stores your Supabase project ID (`nxqmypesjsbitkpatuvk`)
- Connects your local code to your cloud Supabase project
- Tells the CLI which project to deploy migrations to

**When it's used:**
- When you run `supabase db push` → deploys database migrations to your Supabase project
- When you run `supabase db pull` → downloads your production schema locally
- When you run `supabase start` → starts local Supabase emulator for testing
- When you create new migrations with `supabase migrations create`

**Key point:** Without this file, the Supabase CLI won't know which project to work with. Never delete or modify the project_id unless switching to a different Supabase project.

---

### 📁 supabase/migrations/
**Purpose:** Contains all database schema changes

**Files in this folder:**
1. `20260102_01_initial_schema_tables_and_policies.sql`
   - Creates base tables: profiles, user_preferences, billing_history, subscriptions
   - Sets up Row Level Security (RLS) policies
   - Creates storage bucket for user avatars

2. `20260102_02_add_transactions_budgets_alerts.sql`
   - Creates transaction tracking tables
   - Creates budget management tables
   - Creates alerts/notifications tables
   - Sets up database indexes for performance

3. `20260103_01_add_delete_user_rpc_function.sql`
   - Creates a PostgreSQL function to permanently delete user accounts
   - Used when user clicks "Delete Account" in Settings

4. `20260103_02_add_check_email_exists_rpc_function.sql`
   - Creates a PostgreSQL function to check if email already exists
   - Prevents duplicate account registration
   - Runs before signup to validate email availability

**How migrations work:**
- Each file is a database change that gets applied in order
- Run `supabase db push` to deploy all migrations to your Supabase database
- Migrations are tracked so each one is only applied once
- Makes database schema changes trackable and reversible

---

## 📄 Configuration & Setup Files

### package.json
**What it is:** Project dependency and script manager

**Key things in this file:**
- Lists all npm packages your project needs (React, Supabase, Tailwind, etc.)
- Defines build scripts: `npm run dev`, `npm run build`, `npm run lint`
- Version information for your project

**When it's used:**
- When you run `npm install` → installs all dependencies
- When you run `npm run dev` → starts development server on port 8080
- When you run `npm run build` → creates optimized production build

---

### vite.config.ts
**What it is:** Configuration for Vite (your build tool)

**What it does:**
- Sets dev server to run on `0.0.0.0:8080` (accessible from anywhere)
- Enables React plugin with SWC (faster compilation)
- Sets up path alias `@/` to point to `./src/` for clean imports

**Example:** `import Button from '@/components/ui/button'` instead of `import Button from '../../../components/ui/button'`

---

### tsconfig.json & tsconfig.app.json
**What it is:** TypeScript configuration

**What it does:**
- Tells TypeScript how to compile your code
- Enables strict type checking settings
- Maps `@/*` to `src/*` for imports

---

### eslint.config.js
**What it is:** Code quality and style checker

**What it does:**
- Enforces consistent code style across the project
- Warns about unused variables and common mistakes
- Checks React hooks usage is correct
- Enables TypeScript linting

**How to use:**
```bash
npm run lint
```
This checks if your code follows the rules. Fix warnings to keep code clean.

---

### .gitignore
**What it is:** Git configuration file

**What it does:**
- Tells Git which files NOT to commit to the repository
- Prevents sensitive files from being uploaded

**Important files ignored:**
- `.env` / `.env.local` → Environment variables (API keys, secrets)
- `node_modules/` → Installed packages (too large)
- `dist/` / `dist-ssr/` → Build outputs (generated files)
- `.vscode/` → Editor settings (personal preferences)

**Why important:** `.env` contains your Supabase URL and API keys - never commit this!

---

### components.json
**What it is:** Shadcn/UI configuration

**What it does:**
- Tells Shadcn CLI where to put new UI components
- Sets path aliases for components, utils, hooks
- Configures Tailwind CSS usage

**Example aliases defined:**
```
@/components → src/components
@/ui → src/components/ui
@/hooks → src/hooks
@/lib → src/lib
```

---

### tailwind.config.ts
**What it is:** Tailwind CSS configuration

**What it does:**
- Customizes color palette and theme
- Defines custom animations (fade-in, slide-in, pulse-glow)
- Sets up dark mode support
- Configures custom color variables

**Key custom colors:**
- `income`, `expense`, `savings` → Financial tracking colors
- `success`, `warning` → Status colors
- `sidebar` → Navigation bar colors

---

### postcss.config.js
**What it is:** CSS processor configuration

**What it does:**
- Enables Tailwind CSS processing
- Adds vendor prefixes automatically (for browser compatibility)

---

### index.html & vite-env.d.ts
**index.html:**
- Main HTML file that loads your React app
- Entry point for the browser

**vite-env.d.ts:**
- Type definitions for Vite
- Tells TypeScript about Vite-specific features

---

## 🚀 Quick Summary

| File | Purpose |
|------|---------|
| `package.json` | Dependencies & scripts |
| `vite.config.ts` | Build tool configuration |
| `tsconfig.json` | TypeScript settings |
| `eslint.config.js` | Code quality rules |
| `.gitignore` | Files to exclude from Git |
| `components.json` | Shadcn/UI setup |
| `tailwind.config.ts` | Styling customization |
| `postcss.config.js` | CSS processing |
| `supabase/config.toml` | Supabase project connection |
| `supabase/migrations/` | Database schema changes |

**To start development:**
```bash
npm install      # Install all dependencies
npm run dev      # Start dev server on http://localhost:8080
supabase db push # Deploy database migrations
```
