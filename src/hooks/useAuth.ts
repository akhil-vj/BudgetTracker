import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth as useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const { toast } = useToast();
  const { signOut: contextSignOut, deleteAccount: contextDeleteAccount } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const changePassword = useCallback(async (newPassword: string) => {
    setIsLoading(true);
    try {
      await api.put('/auth/password', { password: newPassword });
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      return true;
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to update password. This endpoint may not be implemented.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await contextSignOut();
      return true;
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contextSignOut, toast]);

  const deleteAccount = useCallback(async () => {
    setIsLoading(true);
    try {
      await contextDeleteAccount();
      return true;
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to delete account.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contextDeleteAccount, toast]);

  return {
    changePassword,
    signOut,
    deleteAccount,
    isLoading,
  };
}
