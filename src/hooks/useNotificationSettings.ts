/**
 * Hook for managing notification settings and push notification permissions
 */

import { useEffect, useState, useCallback } from 'react';
import { useToast } from './use-toast';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  hasNotificationPermission,
  getNotificationPermissionStatus,
} from '@/lib/notificationService';

export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
}

export interface PushNotificationStatus {
  isSupported: boolean;
  hasPermission: boolean;
  permissionStatus: NotificationPermission | null;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useNotificationSettings() {
  const { toast } = useToast();
  const [pushStatus, setPushStatus] = useState<PushNotificationStatus>({
    isSupported: 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window,
    hasPermission: false,
    permissionStatus: null,
    isSubscribed: false,
    isLoading: false,
    error: null,
  });

  // Check initial push notification status
  useEffect(() => {
    if (!pushStatus.isSupported) {
      return;
    }

    const checkStatus = async () => {
      const hasPermission = hasNotificationPermission();
      const permissionStatus = getNotificationPermissionStatus();

      setPushStatus((prev) => ({
        ...prev,
        hasPermission,
        permissionStatus,
        isSubscribed: hasPermission,
      }));
    };

    checkStatus();
  }, []);

  // Request push notification permission
  const requestPushPermission = useCallback(async () => {
    if (!pushStatus.isSupported) {
      const errorMsg = 'Push notifications are not supported in your browser';
      setPushStatus((prev) => ({
        ...prev,
        error: errorMsg,
      }));
      toast({
        title: 'Not Supported',
        description: errorMsg,
        variant: 'destructive',
      });
      return false;
    }

    setPushStatus((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const subscription = await subscribeToPushNotifications();

      if (subscription) {
        setPushStatus((prev) => ({
          ...prev,
          isLoading: false,
          hasPermission: true,
          isSubscribed: true,
          permissionStatus: 'granted',
        }));

        toast({
          title: 'Success',
          description: 'Push notifications enabled successfully',
        });

        return true;
      } else {
        setPushStatus((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Failed to subscribe to push notifications',
        }));

        toast({
          title: 'Error',
          description: 'Failed to enable push notifications',
          variant: 'destructive',
        });

        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setPushStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      toast({
        title: 'Error',
        description: 'Failed to enable push notifications',
        variant: 'destructive',
      });

      return false;
    }
  }, [pushStatus.isSupported, toast]);

  // Disable push notifications
  const disablePushNotifications = useCallback(async () => {
    setPushStatus((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await unsubscribeFromPushNotifications();

      if (success) {
        setPushStatus((prev) => ({
          ...prev,
          isLoading: false,
          hasPermission: false,
          isSubscribed: false,
        }));

        toast({
          title: 'Success',
          description: 'Push notifications disabled',
        });

        return true;
      } else {
        setPushStatus((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Failed to disable push notifications',
        }));

        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setPushStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      toast({
        title: 'Error',
        description: 'Failed to disable push notifications',
        variant: 'destructive',
      });

      return false;
    }
  }, [toast]);

  return {
    pushStatus,
    requestPushPermission,
    disablePushNotifications,
  };
}
