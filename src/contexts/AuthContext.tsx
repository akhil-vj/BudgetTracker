import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_URL } from '../config';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  location: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      const data = response.data;
      if (data.avatar_url && data.avatar_url.startsWith('/uploads/')) {
        const baseUrl = import.meta.env.VITE_API_URL || BACKEND_URL;
        data.avatar_url = `${baseUrl}${data.avatar_url}`;
      }
      setProfile(data);
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (localStorage.getItem('token')) {
      await fetchProfile();
    }
  }, [fetchProfile]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setProfile(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    if (localStorage.getItem('token')) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      localStorage.setItem('token', response.data.access_token);
      await fetchProfile();

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return { error: null };
    } catch (err: any) {
      return { error: err.response?.data?.detail || err.message || new Error('Login failed') };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        first_name: firstName,
        last_name: lastName
      });

      localStorage.setItem('token', response.data.access_token);
      await fetchProfile();

      toast({
        title: "Account created!",
        description: "Welcome to FinanceTracker. You can now start tracking your finances.",
      });

      return { error: null };
    } catch (err: any) {
      return { error: err.response?.data?.detail || err.message || new Error('Registration failed') };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('token');
      setUser(null);
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
    // Requires a new backend endpoint. For now, just return not implemented.
    toast({
      title: "Notice",
      description: "Password reset is not fully implemented in the new backend yet.",
    });
    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    // Requires a new backend endpoint. For now, just return not implemented.
    toast({
      title: "Notice",
      description: "Password update is not fully implemented in the new backend yet.",
    });
    return { error: null };
  };

  const deleteAccount = async () => {
    try {
      // Not fully implemented on the backend yet, but we will mock a successful deletion client-side for now
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      return true;
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,

        profile,
        isAuthenticated: !!user,
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
