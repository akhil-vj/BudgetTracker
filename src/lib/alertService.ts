import { supabase } from '@/integrations/supabase/client';
import { Transaction, Budget } from '@/types/finance';
import { 
  queueNotification, 
  notifyBudgetAlert, 
  sendPushNotification 
} from './notificationService';

export type AlertType = 'warning' | 'success' | 'info' | 'reminder';

export interface AlertData {
  user_id: string;
  type: AlertType;
  title: string;
  message: string;
  read: boolean;
}

/**
 * Generate and create alerts based on budget and transaction data
 * Checks spending for each month (including past months) against monthly budgets
 * Returns created alert titles for notification purposes
 */
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

  // Check each budget against current month's spending only
  for (const budget of budgets) {
    // Calculate spending for CURRENT MONTH ONLY
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

    // Check if current month budget is exceeded
    const percentage = (currentMonthSpent / budget.limit) * 100;
    
    if (percentage >= 100) {
      const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const exceedTitle = `${budget.category} Budget Exceeded - ${monthName}`;
      
      // Create a new alert for this transaction
      const message = `You exceeded your ${budget.category} budget in ${monthName} by ₹${(currentMonthSpent - budget.limit).toFixed(2)}. Spent: ₹${currentMonthSpent.toFixed(2)}, Limit: ₹${budget.limit.toFixed(2)}.`;
      alertsToCreate.push({
        user_id: userId,
        type: 'warning',
        title: exceedTitle,
        message: message,
        read: false,
      });
      createdAlerts.push({ title: exceedTitle, message });
    }
  }

  // Add success alert if saving well
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
    // Check if success alert already exists for this month
    const { data: existingSuccessAlert } = await supabase
      .from('alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'success')
      .eq('title', 'Great Savings This Month!')
      .gte('created_at', new Date(currentYear, currentMonth, 1).toISOString())
      .lt('created_at', new Date(currentYear, currentMonth + 1, 1).toISOString());

    // Only create if it doesn't already exist this month
    if (!existingSuccessAlert?.length) {
      const savingsRate = Math.round((1 - totalExpenses / totalIncome) * 100);
      const message = `You're saving ${savingsRate}% of your income. Keep up the good work!`;
      alertsToCreate.push({
        user_id: userId,
        type: 'success',
        title: 'Great Savings This Month!',
        message: message,
        read: false,
      });
      createdAlerts.push({
        title: 'Great Savings This Month!',
        message: message,
      });
    }
  }

  // Create alerts in batch
  if (alertsToCreate.length > 0) {
    const { data, error } = await supabase.from('alerts').insert(alertsToCreate).select();

    if (error) {
      console.error('Failed to create alerts:', error);
      return [];
    }

    // Send notifications for created alerts
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const userEmail = userData.user.email || '';

      // Get user preferences
      const { data: preferencesData } = await supabase
        .from('preferences')
        .select('notifications_email, notifications_push')
        .eq('user_id', userId)
        .single();

      const sendEmail = preferencesData?.notifications_email ?? true;
      const sendPush = preferencesData?.notifications_push ?? true;

      // Send notifications for each created alert
      for (const alert of alertsToCreate) {
        try {
          if (alert.type === 'warning') {
            // Send budget alert notifications
            if (sendPush) {
              await sendPushNotification(userId, alert.title, alert.message);
            }
            if (sendEmail) {
              await queueNotification(
                userId,
                userEmail,
                'budget_alert',
                alert.title,
                alert.message,
                true,
                false
              );
            }
          } else if (alert.type === 'success') {
            // Send milestone/savings notifications
            if (sendPush) {
              await sendPushNotification(userId, alert.title, alert.message);
            }
            if (sendEmail) {
              await queueNotification(
                userId,
                userEmail,
                'savings_milestone',
                alert.title,
                alert.message,
                true,
                false
              );
            }
          }
        } catch (error) {
          console.error(`Failed to send notification for alert ${alert.title}:`, error);
          // Don't fail the entire process if notification sending fails
        }
      }
    }
  }

  return createdAlerts;
}

/**
 * Generate alerts for low balance or other financial events
 */
export async function generateReminderAlerts(
  userId: string,
  transactions: Transaction[]
): Promise<void> {
  // Check for recurring transactions (bills)
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Find transactions that might be recurring
  const lastMonthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return (
      date >= monthAgo &&
      date < today &&
      t.type === 'expense' &&
      !t.description.toLowerCase().includes('grocery')
    );
  });

  // Group by description to find recurring patterns
  const transactionsByDescription: Record<string, Transaction[]> = {};
  lastMonthTransactions.forEach((t) => {
    if (!transactionsByDescription[t.description]) {
      transactionsByDescription[t.description] = [];
    }
    transactionsByDescription[t.description].push(t);
  });

  // Create reminder for recurring transactions
  const remindersToCreate: AlertData[] = [];

  for (const [description, txns] of Object.entries(transactionsByDescription)) {
    if (txns.length >= 2) {
      // Likely a recurring transaction
      const lastTxn = txns[txns.length - 1];
      const lastDate = new Date(lastTxn.date);
      const expectedNextDate = new Date(lastDate);
      expectedNextDate.setMonth(expectedNextDate.getMonth() + 1);

      if (expectedNextDate >= today && expectedNextDate <= nextWeek) {
        // Check if reminder already exists
        const { data: existingReminder } = await supabase
          .from('alerts')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'reminder')
          .contains('message', description)
          .gte('created_at', new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString());

        if (!existingReminder?.length) {
          remindersToCreate.push({
            user_id: userId,
            type: 'reminder',
            title: `Upcoming: ${description}`,
            message: `Your recurring ${description} payment of ₹${lastTxn.amount.toFixed(2)} is due in ${Math.ceil((expectedNextDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))} days.`,
            read: false,
          });
        }
      }
    }
  }

  if (remindersToCreate.length > 0) {
    const { error } = await supabase.from('alerts').insert(remindersToCreate);

    if (error) {
      console.error('Failed to create reminder alerts:', error);
      return;
    }

    // Send notifications for reminders
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const userEmail = userData.user.email || '';

      // Get user preferences
      const { data: preferencesData } = await supabase
        .from('preferences')
        .select('notifications_email, notifications_push')
        .eq('user_id', userId)
        .single();

      const sendEmail = preferencesData?.notifications_email ?? true;
      const sendPush = preferencesData?.notifications_push ?? true;

      // Send notifications for each reminder
      for (const reminder of remindersToCreate) {
        try {
          if (sendPush) {
            await sendPushNotification(userId, reminder.title, reminder.message);
          }
          if (sendEmail) {
            await queueNotification(
              userId,
              userEmail,
              'bill_reminder',
              reminder.title,
              reminder.message,
              true,
              false
            );
          }
        } catch (error) {
          console.error(`Failed to send notification for reminder ${reminder.title}:`, error);
          // Don't fail the entire process if notification sending fails
        }
      }
    }
  }
}

/**
 * Create a custom alert
 */
export async function createAlert(
  userId: string,
  type: AlertType,
  title: string,
  message: string
): Promise<void> {
  const { error } = await supabase.from('alerts').insert({
    user_id: userId,
    type,
    title,
    message,
    read: false,
  });

  if (error) {
    throw error;
  }
}
