import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await api.get('/alerts');
      return data.filter((a: Alert) => a.type === 'warning');
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
  });

  const markAsRead = useMutation({
    mutationFn: async (alertId: string) => {
      await api.put(`/alerts/${alertId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark alert as read',
        variant: 'destructive',
      });
    },
  });

  const deleteAlert = useMutation({
    mutationFn: async (alertId: string) => {
      await api.delete(`/alerts/${alertId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete alert',
        variant: 'destructive',
      });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      // In a real app, there would be an endpoint for this, we will iterate for now or just trust the future.
      const unreadAlerts = alerts.filter((a: Alert) => !a.read);
      await Promise.all(unreadAlerts.map((a: Alert) => api.put(`/alerts/${a.id}/read`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({
        title: 'Success',
        description: 'All alerts marked as read',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark alerts as read',
        variant: 'destructive',
      });
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await Promise.all(alerts.map((a: Alert) => api.delete(`/alerts/${a.id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({
        title: 'Success',
        description: 'All alerts cleared',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to clear alerts',
        variant: 'destructive',
      });
    },
  });

  const unreadCount = alerts.filter((a: Alert) => !a.read).length;

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
