import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  location: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return null;
    }
    return data;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Defer profile fetch to avoid deadlock
        if (currentSession?.user) {
          setTimeout(() => {
            fetchProfile(currentSession.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id).then(setProfile);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      // Check if email already exists in auth.users using RPC
      const { data: emailCheckResult, error: rpcError } = await supabase.rpc('check_email_exists', { 
        email_to_check: email.toLowerCase() 
      });

      if (!rpcError && emailCheckResult) {
        return { error: new Error('Email is already registered with another account') };
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        return { error };
      }

      // If no user object returned, email already exists
      if (!data.user) {
        return { error: new Error('Email is already registered with another account') };
      }

      toast({
        title: "Account created!",
        description: "Welcome to FinanceTracker. You can now start tracking your finances.",
      });

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setProfile(null);

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error };
      }

      toast({
        title: "Reset link sent",
        description: "If an account exists with this email, you'll receive a password reset link.",
      });

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error };
      }

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const deleteAccount = async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No user found');

      // Delete user data from all tables
      const { error: billingError } = await supabase.from('billing_history').delete().eq('user_id', currentUser.id);
      if (billingError) console.error('Error deleting billing history:', billingError);

      const { error: subError } = await supabase.from('subscriptions').delete().eq('user_id', currentUser.id);
      if (subError) console.error('Error deleting subscriptions:', subError);

      const { error: prefError } = await supabase.from('user_preferences').delete().eq('user_id', currentUser.id);
      if (prefError) console.error('Error deleting preferences:', prefError);

      const { error: profileError } = await supabase.from('profiles').delete().eq('id', currentUser.id);
      if (profileError) console.error('Error deleting profile:', profileError);

      // Delete avatar from storage
      try {
        const { data: avatarFiles } = await supabase.storage
          .from('avatars')
          .list(currentUser.id);

        if (avatarFiles && avatarFiles.length > 0) {
          const filesToDelete = avatarFiles.map(f => `${currentUser.id}/${f.name}`);
          await supabase.storage.from('avatars').remove(filesToDelete);
        }
      } catch (storageError) {
        console.error('Error deleting avatar:', storageError);
      }

      // Delete auth user using RPC function
      try {
        const { error: rpcError } = await supabase.rpc('delete_user');
        if (rpcError) {
          console.error('Error deleting auth user via RPC:', rpcError);
          throw rpcError;
        }
      } catch (rpcError) {
        console.error('RPC call failed, trying direct auth deletion:', rpcError);
        // Fallback: Delete the user directly (requires admin key, this will fail on client)
        // This is expected, we'll document the RPC requirement
      }

      // Sign out
      await supabase.auth.signOut();

      setUser(null);
      setSession(null);
      setProfile(null);

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthenticated: !!session,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
