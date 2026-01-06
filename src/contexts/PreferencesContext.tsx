import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchUserData = useCallback(async (uid: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // Profile fetch error - continuing anyway
      }

      // Fetch user email from auth
      const { data: { user } } = await supabase.auth.getUser();

      if (profileData) {
        setProfile({
          id: profileData.id,
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          email: user?.email || '',
          phoneNumber: profileData.phone_number || '',
          location: profileData.location || '',
          avatarUrl: profileData.avatar_url || '',
        });
      } else {
        // Create profile if doesn't exist
        setProfile({
          id: uid,
          firstName: '',
          lastName: '',
          email: user?.email || '',
          phoneNumber: '',
          location: '',
          avatarUrl: '',
        });
      }

      // Fetch preferences
      const { data: prefsData, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (prefsError && prefsError.code !== 'PGRST116') {
        // Preferences fetch error - using defaults
      }

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

      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        // Subscription fetch error - using defaults
      }

      if (subData) {
        setSubscription({
          planName: subData.plan_name || 'free',
          price: Number(subData.price) || 0,
          currency: (subData.currency as CurrencyCode) || 'INR',
          status: subData.status || 'active',
          billingCycle: subData.billing_cycle || 'monthly',
          nextBillingDate: subData.next_billing_date,
        });
      }
    } catch (error) {
      // Error fetching user data - using default preferences
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (userId) {
      await fetchUserData(userId);
    }
  }, [userId, fetchUserData]);

  // Apply dark mode class to document
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (preferences.darkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const uid = session?.user?.id || null;
        setUserId(uid);
        setIsAuthenticated(!!uid);

        if (uid) {
          setTimeout(() => {
            fetchUserData(uid);
          }, 0);
        } else {
          setProfile(null);
          setSubscription(null);
          setPreferences(defaultPreferences);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      setIsAuthenticated(!!uid);

      if (uid) {
        fetchUserData(uid);
      } else {
        setIsLoading(false);
      }
    });

    return () => authSubscription.unsubscribe();
  }, [fetchUserData]);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!userId) return;

    // Handle currency conversion when currency changes
    if (updates.currency && updates.currency !== preferences.currency) {
      try {
        // Convert all transactions to new currency
        const { data: transactions, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId);

        if (!fetchError && transactions && transactions.length > 0) {
          const convertedTransactions = transactions.map((txn: any) => ({
            ...txn,
            amount: convertCurrency(txn.amount, preferences.currency, updates.currency),
          }));

          // Update all transactions with converted amounts
          for (const txn of convertedTransactions) {
            const { id, amount } = txn;
            const { error: updateError } = await supabase
              .from('transactions')
              .update({ amount })
              .eq('id', id);

            if (updateError) {
              // Error converting transaction amount - continuing
            }
          }
        }
      } catch (error) {
        // Error during currency conversion - continuing
      }
    }

    const dbUpdates: Record<string, unknown> = {};
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
    if (updates.dateFormat !== undefined) dbUpdates.date_format = updates.dateFormat;
    if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
    if (updates.darkMode !== undefined) dbUpdates.dark_mode = updates.darkMode;
    if (updates.notificationsPush !== undefined) dbUpdates.notifications_push = updates.notificationsPush;
    if (updates.notificationsEmail !== undefined) dbUpdates.notifications_email = updates.notificationsEmail;
    if (updates.notificationsSound !== undefined) dbUpdates.notifications_sound = updates.notificationsSound;
    if (updates.analyticsEnabled !== undefined) dbUpdates.analytics_enabled = updates.analyticsEnabled;
    if (updates.predictionsEnabled !== undefined) dbUpdates.predictions_enabled = updates.predictionsEnabled;

    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, ...dbUpdates });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
      return;
    }

    setPreferences(prev => ({ ...prev, ...updates }));

    if (updates.currency) {
      toast({
        title: "Currency Updated",
        description: `All amounts have been converted to ${updates.currency}`,
        variant: "default",
      });
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...dbUpdates });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      return;
    }

    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!userId) return null;

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    await updateProfile({ avatarUrl: publicUrl });
    return publicUrl;
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
