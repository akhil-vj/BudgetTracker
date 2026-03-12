import { api } from '@/lib/api';
import { Transaction, Budget } from '@/types/finance';
import {
  queueNotification,
  notifyBudgetAlert,
  sendPushNotification
} from './notificationService';

export type AlertType = 'warning' | 'success' | 'info' | 'reminder';

export interface AlertData {
  type: AlertType;
  title: string;
  message: string;
}

export async function generateBudgetAlerts(
  userId: string,
  budgets: Budget[],
  transactions: Transaction[]
): Promise<Array<{ title: string; message: string }>> {
  if (!budgets.length || !transactions.length) return [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const alertsToCreate: AlertData[] = [];
  const createdAlerts: Array<{ title: string; message: string }> = [];

  for (const budget of budgets) {
    let currentMonthSpent = 0;

    transactions
      .filter((t) => {
        if (t.type !== 'expense' || t.category !== budget.category) return false;
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .forEach((t) => {
        currentMonthSpent += t.amount;
      });

    const percentage = (currentMonthSpent / budget.limit) * 100;

    if (percentage >= 100) {
      const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const exceedTitle = `${budget.category} Budget Exceeded - ${monthName}`;

      const message = `You exceeded your ${budget.category} budget in ${monthName} by ₹${(currentMonthSpent - budget.limit).toFixed(2)}. Spent: ₹${currentMonthSpent.toFixed(2)}, Limit: ₹${budget.limit.toFixed(2)}.`;
      alertsToCreate.push({
        type: 'warning',
        title: exceedTitle,
        message: message,
      });
      createdAlerts.push({ title: exceedTitle, message });
    }
  }

  const totalIncome = transactions
    .filter((t) => {
      const date = new Date(t.date);
      return t.type === 'income' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => {
      const date = new Date(t.date);
      return t.type === 'expense' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((acc, t) => acc + t.amount, 0);

  if (totalIncome > 0 && totalExpenses < totalIncome * 0.7) {
    const savingsRate = Math.round((1 - totalExpenses / totalIncome) * 100);
    const message = `You're saving ${savingsRate}% of your income. Keep up the good work!`;
    alertsToCreate.push({
      type: 'success',
      title: 'Great Savings This Month!',
      message: message,
    });
    createdAlerts.push({
      title: 'Great Savings This Month!',
      message: message,
    });
  }

  if (alertsToCreate.length > 0) {
    try {
      for (const alert of alertsToCreate) {
        await api.post('/alerts', alert);
      }
    } catch (error) {
      console.error('Failed to create alerts via API:', error);
      return [];
    }

    // Usually we would send notifications here, but user context requires fetching
    // Skipping fetching email/preferences for now to keep it simple, it's better handled entirely backend side
  }

  return createdAlerts;
}

export async function generateReminderAlerts(
  userId: string,
  transactions: Transaction[]
): Promise<void> {
  // Simplified for Python Migration
}

export async function createAlert(
  userId: string,
  type: AlertType,
  title: string,
  message: string
): Promise<void> {
  try {
    await api.post('/alerts', { type, title, message });
  } catch (error) {
    console.error(error);
  }
}
