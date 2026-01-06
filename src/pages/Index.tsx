import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target,
  ArrowUpRight,
  Sparkles,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { NotificationSheet } from '@/components/layout/NotificationSheet';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { BudgetOverview } from '@/components/dashboard/BudgetOverview';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { PredictionInsights } from '@/components/dashboard/PredictionInsights';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { TransactionModal } from '@/components/modals/TransactionModal';
import { IncomePage } from '@/components/pages/IncomePage';
import { ExpensesPage } from '@/components/pages/ExpensesPage';
import { BudgetsPage } from '@/components/pages/BudgetsPage';
import { PredictionsPage } from '@/components/pages/PredictionsPage';
import { AnalyticsPage } from '@/components/pages/AnalyticsPage';
import { AlertsPage } from '@/components/pages/AlertsPage';
import { SettingsPage } from '@/components/pages/SettingsPage';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { usePreferences } from '@/contexts/PreferencesContext';
import {
  mockPredictions,
  calculateSummary,
  calculateMonthlyData,
  calculateCategoryBreakdown,
} from '@/data/mockData';
import { Transaction, IncomeCategory, ExpenseCategory, TransactionType } from '@/types/finance';
import { formatCurrency } from '@/lib/currency';

const sectionTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Track your financial health' },
  income: { title: 'Income', subtitle: 'Manage your earnings' },
  expenses: { title: 'Expenses', subtitle: 'Track your spending' },
  budgets: { title: 'Budgets', subtitle: 'Plan your finances' },
  predictions: { title: 'AI Predictions', subtitle: 'Smart spending forecasts' },
  analytics: { title: 'Analytics', subtitle: 'Deep financial insights' },
  alerts: { title: 'Alerts', subtitle: 'Notifications & reminders' },
  settings: { title: 'Settings', subtitle: 'Manage your account' },
};

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { transactions, addTransaction, updateTransaction, deleteTransaction, isAdding } = useTransactions();
  const { budgets } = useBudgets();
  const { preferences } = usePreferences();

  // Calculate derived data from transactions
  const summary = useMemo(() => calculateSummary(transactions), [transactions]);
  const monthlyData = useMemo(() => calculateMonthlyData(transactions), [transactions]);
  const categoryData = useMemo(() => calculateCategoryBreakdown(transactions), [transactions]);

  const handleAddTransaction = (data: {
    type: TransactionType;
    amount: number;
    category: IncomeCategory | ExpenseCategory;
    description: string;
    date: string;
    paymentMethod?: string;
  }) => {
    if (editingTransaction) {
      const updatedTransaction: Transaction = {
        id: editingTransaction.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date,
        paymentMethod: data.paymentMethod as Transaction['paymentMethod'],
      };
      updateTransaction(updatedTransaction);
      setEditingTransaction(null);
    } else {
      const newTransaction: Omit<Transaction, 'id'> = {
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date,
        paymentMethod: data.paymentMethod as Transaction['paymentMethod'],
      };
      addTransaction(newTransaction);
    }
    setIsModalOpen(false);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
  };

  const currentSection = sectionTitles[activeSection] || sectionTitles.dashboard;
  const hasData = transactions.length > 0;

  const renderContent = () => {
    switch (activeSection) {
      case 'income':
        return (
          <IncomePage 
            transactions={transactions} 
            onAddTransaction={() => setIsModalOpen(true)}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'expenses':
        return (
          <ExpensesPage 
            transactions={transactions} 
            onAddTransaction={() => setIsModalOpen(true)}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'budgets':
        return <BudgetsPage budgets={budgets} transactions={transactions} />;
      case 'predictions':
        return <PredictionsPage transactions={transactions} />;
      case 'analytics':
        return <AnalyticsPage transactions={transactions} />;
      case 'alerts':
        return <AlertsPage budgets={budgets} transactions={transactions} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <>
            {/* Welcome Banner */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="mb-4 sm:mb-6 p-4 sm:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, hsl(174, 72%, 56%) 0%, hsl(199, 89%, 48%) 50%, hsl(250, 91%, 65%) 100%)',
              }}
            >
              <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-1/2 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2" />
              
              <div className="relative z-10">
                <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-2">
                  Welcome to Finance Tracker! 👋
                </h2>
                {hasData ? (
                  <>
                    <p className="text-sm sm:text-base text-primary-foreground/80 max-w-lg">
                      You've saved <span className="font-semibold">{formatCurrency(summary.savings, preferences.currency)}</span> this month. 
                      That's <span className="font-semibold">{summary.savingsRate.toFixed(1)}%</span> of your income!
                    </p>
                    {summary.savingsRate > 0 && (
                      <div className="flex gap-2 sm:gap-4 mt-3 sm:mt-4">
                        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/20 rounded-full text-xs sm:text-sm text-primary-foreground">
                          <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Great savings rate!</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm sm:text-base text-primary-foreground/80 max-w-lg">
                      Start tracking your finances today! Add your first transaction to see insights and predictions.
                    </p>
                    <div className="flex gap-2 sm:gap-4 mt-3 sm:mt-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/20 rounded-full text-xs sm:text-sm text-primary-foreground">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>AI-powered insights</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <StatCard 
                title="Total Income" 
                value={formatCurrency(summary.totalIncome, preferences.currency)} 
                change={hasData ? 8.2 : undefined} 
                changeLabel={hasData ? "vs last month" : "No data yet"} 
                icon={TrendingUp} 
                variant="income" 
                delay={0.1} 
              />
              <StatCard 
                title="Total Expenses" 
                value={formatCurrency(summary.totalExpenses, preferences.currency)} 
                change={hasData ? -5.4 : undefined} 
                changeLabel={hasData ? "vs last month" : "No data yet"} 
                icon={TrendingDown} 
                variant="expense" 
                delay={0.15} 
              />
              <StatCard 
                title="Net Savings" 
                value={formatCurrency(summary.savings, preferences.currency)} 
                change={hasData ? 15.3 : undefined} 
                changeLabel={hasData ? "vs last month" : "Start saving!"} 
                icon={Wallet} 
                variant="savings" 
                delay={0.2} 
              />
              <StatCard 
                title="Budget Health" 
                value={hasData ? `${summary.savingsRate.toFixed(0)}%` : '0%'} 
                changeLabel="savings rate" 
                icon={Target} 
                variant="default" 
                delay={0.25} 
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="lg:col-span-2">
                <SpendingChart data={monthlyData} />
              </div>
              <CategoryBreakdown data={categoryData} />
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <RecentTransactions transactions={transactions} onAddTransaction={() => setIsModalOpen(true)} />
              <BudgetOverview budgets={budgets} transactions={transactions} />
              <PredictionInsights predictions={mockPredictions} transactions={transactions} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header with Menu Button */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-8 h-8 p-0"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">
              {currentSection.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="w-8 h-8 p-0"
              title="Add transaction"
            >
              <Plus className="w-5 h-5" />
            </Button>
            <div className="lg:hidden">
              <NotificationSheet />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 z-50 lg:hidden"
            >
              <div className="relative h-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute top-3 right-3 w-8 h-8 p-0 z-10"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Sidebar activeSection={activeSection} onNavigate={handleNavigate} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="hidden lg:block">
          <Header 
            title={currentSection.title} 
            subtitle={currentSection.subtitle}
            onAddTransaction={() => setIsModalOpen(true)}
            onNavigateToAlerts={() => setActiveSection('alerts')}
          />
        </div>
        <div className="p-3 sm:p-6">{renderContent()}</div>
      </main>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSubmit={handleAddTransaction}
        editingTransaction={editingTransaction}
      />
    </div>
  );
};

export default Index;