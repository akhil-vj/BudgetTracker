import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useToast } from './use-toast';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  day_of_month?: number;
  day_of_week?: number;
  next_due_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useRecurringTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: recurringTransactions = [], isLoading, error } = useQuery({
    queryKey: ['recurring_transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await api.get('/recurring_transactions');
      return data as RecurringTransaction[];
    },
    enabled: !!user?.id,
  });

  const addRecurringMutation = useMutation({
    mutationFn: async (data: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data: result } = await api.post('/recurring_transactions', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions', user?.id] });
      toast({
        title: "Bill reminder created",
        description: "Your recurring bill has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create bill reminder. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateRecurringMutation = useMutation({
    mutationFn: async (data: RecurringTransaction) => {
      if (!user?.id) throw new Error('Not authenticated');
      const payload = {
        category: data.category,
        amount: data.amount,
        description: data.description,
        frequency: data.frequency,
        day_of_month: data.day_of_month,
        day_of_week: data.day_of_week,
        next_due_date: data.next_due_date,
        is_active: data.is_active,
      };
      const { data: result } = await api.put(`/recurring_transactions/${data.id}`, payload);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions', user?.id] });
      toast({
        title: "Updated",
        description: "Bill reminder has been updated.",
      });
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/recurring_transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions', user?.id] });
      toast({
        title: "Deleted",
        description: "Bill reminder has been deleted.",
      });
    },
  });

  const upcomingBills = recurringTransactions
    .filter(rt => {
      const dueDate = new Date(rt.next_due_date);
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      return dueDate >= today && dueDate <= thirtyDaysFromNow;
    })
    .sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime());

  const overdueBills = recurringTransactions
    .filter(rt => {
      const dueDate = new Date(rt.next_due_date);
      const today = new Date();
      return dueDate < today;
    })
    .sort((a, b) => new Date(b.next_due_date).getTime() - new Date(a.next_due_date).getTime());

  return {
    recurringTransactions,
    upcomingBills,
    overdueBills,
    isLoading,
    error,
    addRecurring: addRecurringMutation.mutate,
    updateRecurring: updateRecurringMutation.mutate,
    deleteRecurring: deleteRecurringMutation.mutate,
    isAdding: addRecurringMutation.isPending,
    isUpdating: updateRecurringMutation.isPending,
    isDeleting: deleteRecurringMutation.isPending,
  };
}
