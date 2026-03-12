import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { convertCurrency } from '@/lib/exchange';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';
export type DateFormatType = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY';
export type TimezoneType = 'Asia/Kolkata' | 'America/Los_Angeles' | 'America/New_York' | 'Europe/London' | 'UTC';

export interface UserPreferences {
  currency: CurrencyCode;
  dateFormat: DateFormatType;
  timezone: TimezoneType;
  darkMode: boolean;
  notificationsPush: boolean;
  notificationsEmail: boolean;
  notificationsSound: boolean;
  analyticsEnabled: boolean;
  predictionsEnabled: boolean;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  location: string;
  avatarUrl: string;
}

export interface Subscription {
  planName: string;
  price: number;
  currency: CurrencyCode;
  status: string;
  billingCycle: string;
  nextBillingDate: string | null;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  profile: UserProfile | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  refreshData: () => Promise<void>;
}

const defaultPreferences: UserPreferences = {
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Kolkata',
  darkMode: true,
  notificationsPush: true,
  notificationsEmail: true,
  notificationsSound: false,
  analyticsEnabled: true,
  predictionsEnabled: true,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { user, profile: authProfile, isLoading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const userId = user?.id || null;
  const lastFetchedUid = useRef<string | null>(null);

  const fetchUserData = useCallback(async (uid: string) => {
    try {
      if (authProfile) {
        let avatarUrl = authProfile.avatar_url || '';
        if (avatarUrl.startsWith('/uploads/')) {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          avatarUrl = `${baseUrl}${avatarUrl}`;
        }

        setProfile({
          id: authProfile.id || uid,
          firstName: authProfile.first_name || '',
          lastName: authProfile.last_name || '',
          email: authProfile.email || '',
          phoneNumber: authProfile.phone_number || '',
          location: authProfile.location || '',
          avatarUrl: avatarUrl,
        });
      }

      try {
        const { data: prefsData } = await api.get('/preferences');
        if (prefsData) {
          setPreferences({
            currency: (prefsData.currency as CurrencyCode) || 'INR',
            dateFormat: (prefsData.date_format as DateFormatType) || 'DD/MM/YYYY',
            timezone: (prefsData.timezone as TimezoneType) || 'Asia/Kolkata',
            darkMode: prefsData.dark_mode ?? true,
            notificationsPush: prefsData.notifications_push ?? true,
            notificationsEmail: prefsData.notifications_email ?? true,
            notificationsSound: prefsData.notifications_sound ?? false,
            analyticsEnabled: prefsData.analytics_enabled ?? true,
            predictionsEnabled: prefsData.predictions_enabled ?? true,
          });
        }
      } catch (err) {
        // use defaults if preferences route fails or doesn't exist yet
      }

      // Mock subscription for Python migration since it's not implemented yet
      setSubscription({
        planName: 'free',
        price: 0,
        currency: 'INR',
        status: 'active',
        billingCycle: 'monthly',
        nextBillingDate: null,
      });

    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [authProfile]);

  const refreshData = useCallback(async () => {
    if (userId) {
      await fetchUserData(userId);
    }
  }, [userId, fetchUserData]);

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (preferences.darkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  useEffect(() => {
    if (authLoading) return;

    if (userId && lastFetchedUid.current !== userId) {
      lastFetchedUid.current = userId;
      fetchUserData(userId);
    } else if (!userId) {
      lastFetchedUid.current = null;
      setProfile(null);
      setSubscription(null);
      setPreferences(defaultPreferences);
      setIsLoading(false);
    }
  }, [userId, authLoading, fetchUserData]);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!userId) return;

    if (updates.currency && updates.currency !== preferences.currency) {
      try {
        // Frontend currency conversion mock (real implementation would fetch all transactions and convert or rely on backend)
        // Leaving it to the basic conversion for now
        const { data: transactions } = await api.get('/transactions');

        if (transactions && transactions.length > 0) {
          const convertedTransactions = transactions.map((txn: any) => ({
            ...txn,
            amount: convertCurrency(txn.amount, preferences.currency, updates.currency as CurrencyCode),
          }));

          for (const txn of convertedTransactions) {
            await api.put(`/transactions/${txn.id}`, { amount: txn.amount });
          }
        }
      } catch (error) {
      }
    }

    const payload: Record<string, unknown> = {};
    if (updates.currency !== undefined) payload.currency = updates.currency;
    if (updates.dateFormat !== undefined) payload.date_format = updates.dateFormat;
    if (updates.timezone !== undefined) payload.timezone = updates.timezone;
    if (updates.darkMode !== undefined) payload.dark_mode = updates.darkMode;
    if (updates.notificationsPush !== undefined) payload.notifications_push = updates.notificationsPush;
    if (updates.notificationsEmail !== undefined) payload.notifications_email = updates.notificationsEmail;
    if (updates.notificationsSound !== undefined) payload.notifications_sound = updates.notificationsSound;
    if (updates.analyticsEnabled !== undefined) payload.analytics_enabled = updates.analyticsEnabled;
    if (updates.predictionsEnabled !== undefined) payload.predictions_enabled = updates.predictionsEnabled;

    try {
      await api.put('/preferences', payload);
      setPreferences(prev => ({ ...prev, ...updates }));

      if (updates.currency) {
        toast({
          title: "Currency Updated",
          description: `All amounts have been converted to ${updates.currency}`,
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) return;

    try {
      const response = await api.put('/auth/profile', updates);

      const updatedProfile = {
        ...profile!,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        phoneNumber: response.data.phone_number,
        location: response.data.location,
      };

      setProfile(updatedProfile);

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!userId) return null;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/auth/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      let avatarUrl = response.data.avatar_url;
      if (avatarUrl.startsWith('/uploads/')) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        avatarUrl = `${baseUrl}${avatarUrl}`;
      }

      setProfile(prev => prev ? { ...prev, avatarUrl } : null);

      return avatarUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
      return null;
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        profile,
        subscription,
        isLoading,
        isAuthenticated,
        userId,
        updatePreferences,
        updateProfile,
        uploadAvatar,
        refreshData,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
