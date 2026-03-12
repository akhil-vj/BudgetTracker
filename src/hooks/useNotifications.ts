import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export interface Notification {
  id: string;
  user_id: string;
  type: 'success' | 'info' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await api.get('/alerts');
      return data.filter((n: Notification) => ['success', 'info', 'reminder'].includes(n.type));
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.put(`/alerts/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/alerts/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const unread = notifications.filter((n: Notification) => !n.read);
      await Promise.all(unread.map((n: Notification) => api.put(`/alerts/${n.id}/read`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await Promise.all(notifications.map((n: Notification) => api.delete(`/alerts/${n.id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'Success',
        description: 'All notifications cleared',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to clear notifications',
        variant: 'destructive',
      });
    },
  });

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead: markAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    markAllAsRead: markAllAsRead.mutate,
    clearAll: clearAll.mutate,
    isMarkingAsRead: markAsRead.isPending,
    isDeletingNotification: deleteNotification.isPending,
    isMarkingAllAsRead: markAllAsRead.isPending,
  };
}
