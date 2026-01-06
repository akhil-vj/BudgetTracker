import { 
  Transaction, 
  Budget, 
  FinancialSummary, 
  Prediction, 
  MonthlyData, 
  CategoryData,
  ExpenseCategory,
  IncomeCategory,
  PaymentMethod
} from '@/types/finance';

// Empty arrays for production - no mock data
export const mockTransactions: Transaction[] = [];
export const mockBudgets: Budget[] = [];

export const mockSummary: FinancialSummary = {
  totalIncome: 0,
  totalExpenses: 0,
  savings: 0,
  savingsRate: 0,
};

export const mockPredictions: Prediction[] = [];
export const mockMonthlyData: MonthlyData[] = [];
export const mockCategoryData: CategoryData[] = [];

// Indian-context income categories
export const incomeCategories: IncomeCategory[] = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Rental Income',
  'Interest',
  'Dividend',
  'Gift',
  'Other'
];

// Indian-context expense categories
export const expenseCategories: ExpenseCategory[] = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Healthcare',
  'Entertainment',
  'Education',
  'Travel',
  'EMI & Loans',
  'Investments',
  'Insurance',
  'Rent & Housing',
  'Personal Care',
  'Gifts & Donations',
  'Other',
];

// Indian payment methods
export const paymentMethods: PaymentMethod[] = [
  'Cash',
  'UPI',
  'Debit Card',
  'Credit Card',
  'Net Banking',
  'Wallet',
  'Cheque',
  'Bank Transfer'
];

// Category icons for display
export const categoryIcons: Record<string, string> = {
  // Income categories
  'Salary': '💼',
  'Freelance': '💻',
  'Investment': '📈',
  'Business': '🏢',
  'Rental Income': '🏠',
  'Interest': '🏦',
  'Dividend': '💰',
  'Gift': '🎁',
  // Expense categories
  'Food & Dining': '🍽️',
  'Transportation': '🚗',
  'Shopping': '🛍️',
  'Bills & Utilities': '📄',
  'Healthcare': '🏥',
  'Entertainment': '🎬',
  'Education': '📚',
  'Travel': '✈️',
  'EMI & Loans': '🏦',
  'Investments': '📊',
  'Insurance': '🛡️',
  'Rent & Housing': '🏠',
  'Personal Care': '💇',
  'Gifts & Donations': '🎁',
  'Other': '📦',
};

// Payment method icons
export const paymentMethodIcons: Record<PaymentMethod, string> = {
  'Cash': '💵',
  'UPI': '📱',
  'Debit Card': '💳',
  'Credit Card': '💳',
  'Net Banking': '🏦',
  'Wallet': '👛',
  'Cheque': '📝',
  'Bank Transfer': '🏦',
};

// Helper function to calculate summary from transactions
export function calculateSummary(transactions: Transaction[]): FinancialSummary {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
  
  return {
    totalIncome,
    totalExpenses,
    savings,
    savingsRate: Math.max(0, savingsRate),
  };
}

// Helper function to calculate category breakdown
export function calculateCategoryBreakdown(transactions: Transaction[]): CategoryData[] {
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);
  
  if (totalExpenses === 0) return [];
  
  const categoryTotals: Record<string, number> = {};
  
  expenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });
  
  const colors = [
    'hsl(217, 91%, 60%)',
    'hsl(280, 87%, 65%)',
    'hsl(142, 71%, 45%)',
    'hsl(38, 92%, 50%)',
    'hsl(0, 72%, 60%)',
    'hsl(174, 72%, 56%)',
    'hsl(262, 83%, 58%)',
    'hsl(25, 95%, 53%)',
  ];
  
  return Object.entries(categoryTotals)
    .map(([category, amount], index) => ({
      category,
      amount,
      percentage: (amount / totalExpenses) * 100,
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.amount - a.amount);
}

// Helper function to calculate monthly data from transactions
export function calculateMonthlyData(transactions: Transaction[]): MonthlyData[] {
  if (transactions.length === 0) return [];
  
  const monthlyTotals: Record<string, { income: number; expenses: number }> = {};
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = { income: 0, expenses: 0 };
    }
    
    if (t.type === 'income') {
      monthlyTotals[monthKey].income += t.amount;
    } else {
      monthlyTotals[monthKey].expenses += t.amount;
    }
  });
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([key, data]) => {
      const [, monthNum] = key.split('-');
      return {
        month: monthNames[parseInt(monthNum) - 1],
        income: data.income,
        expenses: data.expenses,
        savings: data.income - data.expenses,
      };
    });
}
