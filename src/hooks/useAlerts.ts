import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Alert {
  id: string;
  user_id: string;
  type: 'warning' | 'success' | 'info' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export function useAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'warning')
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return (data || []) as Alert[];
    },
    refetchOnWindowFocus: true,
  });

  const markAsRead = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to mark alert as read',
        variant: 'destructive',
      });
    },
  });

  const deleteAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete alert',
        variant: 'destructive',
      });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('alerts')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({
        title: 'Success',
        description: 'All alerts marked as read',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to mark alerts as read',
        variant: 'destructive',
      });
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({
        title: 'Success',
        description: 'All alerts cleared',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to clear alerts',
        variant: 'destructive',
      });
    },
  });

  const unreadCount = alerts.filter(a => !a.read).length;

  return {
    alerts,
    isLoading,
    unreadCount,
    markAsRead: markAsRead.mutate,
    deleteAlert: deleteAlert.mutate,
    markAllAsRead: markAllAsRead.mutate,
    clearAll: clearAll.mutate,
    isMarkingAsRead: markAsRead.isPending,
    isDeletingAlert: deleteAlert.isPending,
    isMarkingAllAsRead: markAllAsRead.isPending,
  };
}
