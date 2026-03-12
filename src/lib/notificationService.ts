import { api } from '@/lib/api';

export interface NotificationPayload {
  userId: string;
  email: string;
  type: 'budget_alert' | 'goal_milestone' | 'bill_reminder' | 'spending_summary' | 'savings_milestone';
  title: string;
  message: string;
  data?: Record<string, string | number>;
}

export async function sendEmailNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    await api.post('/notifications/email', payload);
    return true;
  } catch (error) {
    return false;
  }
}

export async function queueNotification(
  userId: string,
  email: string,
  type: 'budget_alert' | 'goal_milestone' | 'bill_reminder' | 'spending_summary' | 'savings_milestone',
  title: string,
  message: string,
  shouldSendEmail: boolean = true,
  shouldSendPush: boolean = true
): Promise<boolean> {
  try {
    // For now, we simplify to just sending email via the backend
    if (shouldSendEmail) {
      await sendEmailNotification({
        userId,
        email,
        type,
        title,
        message,
      });
    }

    if (shouldSendPush) {
      await sendPushNotification(userId, title, message);
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function sendPushNotification(
  userId: string,
  title: string,
  message: string,
  badge?: string
): Promise<boolean> {
  try {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'denied') return false;

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;
    }

    if ('serviceWorker' in navigator && 'Notification' in window) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        body: message,
        icon: '/app-icon.png',
        badge: badge || '/app-icon-small.png',
        tag: `notification-${userId}-${Date.now()}`,
        requireInteraction: false,
      });
      return true;
    }

    const notification = new Notification(title, {
      body: message,
      icon: '/app-icon.png',
      badge: badge || '/app-icon-small.png',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (error) {
    return false;
  }
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  // Simplified for python migration
  return null;
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  return true;
}

export function hasNotificationPermission(): boolean {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

export function getNotificationPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function notifyBudgetAlert(
  userId: string,
  email: string,
  categoryName: string,
  spent: number,
  budgetLimit: number,
  currency: string = '₹',
  preferences?: { notificationsEmail: boolean; notificationsPush: boolean }
): Promise<boolean> {
  const percentage = Math.round((spent / budgetLimit) * 100);
  const overspent = spent - budgetLimit;

  const title = `${categoryName} Budget Alert`;
  const message = `You've spent ${currency}${spent.toFixed(2)} of your ${currency}${budgetLimit.toFixed(2)} budget (${percentage}%). You're over by ${currency}${overspent.toFixed(2)}.`;

  return queueNotification(
    userId,
    email,
    'budget_alert',
    title,
    message,
    preferences?.notificationsEmail ?? true,
    preferences?.notificationsPush ?? true
  );
}

export async function notifyMilestone(
  userId: string,
  email: string,
  milestoneType: 'savings' | 'spending',
  amount: number,
  currency: string = '₹',
  preferences?: { notificationsEmail: boolean; notificationsPush: boolean }
): Promise<boolean> {
  const type = milestoneType === 'savings' ? 'savings_milestone' : 'spending_summary';
  const title = milestoneType === 'savings' ? 'Savings Goal Reached!' : 'Spending Summary';
  const message =
    milestoneType === 'savings'
      ? `Congratulations! You've reached your ${currency}${amount.toFixed(2)} savings goal!`
      : `This month you've spent ${currency}${amount.toFixed(2)}. Check your analytics for more insights.`;

  return queueNotification(
    userId,
    email,
    type,
    title,
    message,
    preferences?.notificationsEmail ?? true,
    preferences?.notificationsPush ?? true
  );
}

export async function notifyBillReminder(
  userId: string,
  email: string,
  billName: string,
  amount: number,
  daysUntilDue: number,
  currency: string = '₹',
  preferences?: { notificationsEmail: boolean; notificationsPush: boolean }
): Promise<boolean> {
  const title = `Upcoming Bill: ${billName}`;
  const message = `Your ${billName} payment of ${currency}${amount.toFixed(2)} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.`;

  return queueNotification(
    userId,
    email,
    'bill_reminder',
    title,
    message,
    preferences?.notificationsEmail ?? true,
    preferences?.notificationsPush ?? true
  );
}
