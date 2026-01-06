# Budget Tracker - Personal Finance Management

A comprehensive web application for intelligent personal finance management. Track your income and expenses, plan budgets, and gain financial insights.

## ✨ Features

- 💰 **Income & Expense Tracking** - Categorize and track all financial transactions
- 💳 **Budget Management** - Set spending limits and monitor budget utilization with real-time alerts
- 📊 **Analytics & Reports** - Financial insights with interactive charts and visualizations
- 🔔 **Smart Alerts** - Get notified when approaching or exceeding budget limits
- 🌍 **Multi-Currency Support** - Supports INR, USD, EUR, GBP, and JPY with conversion
- 🎨 **Dark Mode** - Beautiful dark theme with smooth animations
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🔐 **Secure Authentication** - Email/password authentication with Supabase

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI
- **Styling**: Tailwind CSS with animations
- **State Management**: React Context API, React Query (TanStack Query)
- **Charts**: Recharts
- **Forms**: React Hook Form, Zod validation
- **Backend/Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or bun
- Supabase account (free)

### Setup Instructions

1. **Clone and install**:
```bash
cd BudgetTracker
npm install
```

2. **Configure Supabase**:
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Create `.env.local` file (see [SETUP.md](SETUP.md) for detailed instructions)

3. **Run development server**:
```bash
npm run dev
```

4. **Open in browser**: http://localhost:8080
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080/`

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Run ESLint
npm run lint

# Preview production build locally
npm run preview
```

## Project Structure

See `details.md` for comprehensive project documentation including:
- Complete file structure
- Component descriptions and use cases
- Data flow and state management
- API integrations
- Feature documentation

## Development

### Code Style

- Uses TypeScript for type safety
- ESLint for code linting
- Component-based architecture
- Custom hooks for reusable logic

### Best Practices

- Atomic component structure
- Clear separation of concerns
- Responsive design mobile-first
- Performance optimization with React Query

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Roadmap

- [ ] Backend integration for persistent data storage
- [ ] Real AI prediction algorithm
- [ ] Recurring transactions
- [ ] Bill reminders
- [ ] Financial goals tracking
- [ ] Mobile app (React Native)
- [ ] Bank API integrations
- [ ] Family account sharing

## Support

For issues, questions, or suggestions, please open an issue in the repository.
