export type TransactionType = 'income' | 'expense';

export type IncomeCategory = 
  | 'Salary' 
  | 'Freelance' 
  | 'Investment' 
  | 'Business' 
  | 'Rental Income'
  | 'Interest'
  | 'Dividend'
  | 'Gift' 
  | 'Other';

export type ExpenseCategory = 
  | 'Food & Dining' 
  | 'Transportation' 
  | 'Shopping' 
  | 'Bills & Utilities' 
  | 'Healthcare' 
  | 'Entertainment' 
  | 'Education' 
  | 'Travel' 
  | 'EMI & Loans'
  | 'Investments'
  | 'Insurance'
  | 'Rent & Housing'
  | 'Personal Care'
  | 'Gifts & Donations'
  | 'Other';

export type PaymentMethod = 
  | 'Cash'
  | 'UPI'
  | 'Debit Card'
  | 'Credit Card'
  | 'Net Banking'
  | 'Wallet'
  | 'Cheque'
  | 'Bank Transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: IncomeCategory | ExpenseCategory;
  description: string;
  date: string;
  paymentMethod?: PaymentMethod;
}

export interface Budget {
  id: string;
  category: ExpenseCategory;
  limit: number;
  spent: number;
  period: 'monthly' | 'yearly';
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
}

export interface Prediction {
  category: ExpenseCategory;
  predictedAmount: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}
