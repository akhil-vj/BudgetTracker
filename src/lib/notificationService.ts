/**
 * Notification Service
 * Handles email, push, and in-app notifications
 * Integrates with Supabase for email delivery
 */

import { supabase } from '@/integrations/supabase/client';

export interface NotificationPayload {
  userId: string;
  email: string;
  type: 'budget_alert' | 'goal_milestone' | 'bill_reminder' | 'spending_summary' | 'savings_milestone';
  title: string;
  message: string;
  data?: Record<string, string | number>;
}

export interface NotificationQueue {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  email_sent: boolean;
  push_sent: boolean;
  created_at: string;
  sent_at: string | null;
}

/**
 * Send email notification via Supabase Edge Function
 * Uses the email service configured in Supabase
 */
export async function sendEmailNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        userId: payload.userId,
        email: payload.email,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data,
      },
    });

    if (error) return false;
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Queue a notification for later delivery
 * Stores in database for retry logic and rate limiting
 */
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
    // Check if similar notification was sent recently (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentNotifications } = await supabase
      .from('notification_queue')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .gte('created_at', oneHourAgo)
      .limit(1);

    // If similar notification was recently sent, skip
    if (recentNotifications && recentNotifications.length > 0) {
      return false;
    }

    // Insert into notification queue
    const { data, error } = await supabase.from('notification_queue').insert({
      user_id: userId,
      type,
      title,
      message,
      email_sent: false,
      push_sent: false,
    });

    if (error) {
      console.error('Failed to queue notification:', error);
      return false;
    }

    // Send immediately if enabled
    if (shouldSendEmail) {
      await sendEmailNotification({
        userId,
        email,
        type,
        title,
        message,
      });

      // Mark as sent in queue
      if (data && data[0]) {
        await supabase
          .from('notification_queue')
          .update({ email_sent: true, sent_at: new Date().toISOString() })
          .eq('id', data[0].id);
      }
    }

    // Send push notification
    if (shouldSendPush) {
      await sendPushNotification(userId, title, message);

      if (data && data[0]) {
        await supabase
          .from('notification_queue')
          .update({ push_sent: true })
          .eq('id', data[0].id);
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Send push notification via Service Worker
 * Uses browser Push API if available
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  message: string,
  badge?: string
): Promise<boolean> {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    // Check if user has granted permission
    if (Notification.permission === 'denied') {
      console.warn('User has denied notification permission');
      return false;
    }

    // Request permission if not determined
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return false;
      }
    }

    // Show notification
    if ('serviceWorker' in navigator && 'Notification' in window) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        body: message,
        icon: '/app-icon.png',
        badge: badge || '/app-icon-small.png',
        tag: `notification-${userId}-${Date.now()}`,
        requireInteraction: false,
        actions: [
          {
            action: 'open',
            title: 'Open',
          },
          {
            action: 'close',
            title: 'Close',
          },
        ],
      });
      return true;
    }

    // Fallback: Direct notification API
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

/**
 * Subscribe user to push notifications
 * Registers service worker and gets subscription
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    // Register service worker
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (swError) {
      return null;
    }

    // Check if user is already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('✅ User already subscribed to push notifications');
      return subscription;
    }

    console.log('📍 No existing subscription, requesting permission...');
    
    // Request permission if not already granted
    const currentPermission = Notification.permission;
    
    if (currentPermission === 'denied') {
      return null;
    }
    
    if (currentPermission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return null;
      }
    }

    if (Notification.permission !== 'granted') {
    }

    console.log('✅ Notification permission granted');

    // Subscribe to push notifications
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      return null;
    }

    let applicationServerKey;
    try {
      applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    } catch (keyError) {
      return null;
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Save subscription to database
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userData.user.id,
        subscription_json: JSON.stringify(subscription),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return subscription;
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Unsubscribe user from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Remove from database
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userData.user.id);
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Check if user has notification permission
 */
export function hasNotificationPermission(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Get current notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Helper: Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Send budget alert notification
 */
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

/**
 * Send milestone notification
 */
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

/**
 * Send bill reminder notification
 */
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
