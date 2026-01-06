import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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

  // Fetch recurring transactions
  const { data: recurringTransactions = [], isLoading, error } = useQuery({
    queryKey: ['recurring_transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('next_due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as RecurringTransaction[];
    },
    enabled: !!user?.id,
  });

  // Add recurring transaction
  const addRecurringMutation = useMutation({
    mutationFn: async (data: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: result, error } = await supabase
        .from('recurring_transactions')
        .insert([
          {
            user_id: user.id,
            ...data,
          },
        ])
        .select()
        .single();

      if (error) throw error;
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

  // Update recurring transaction
  const updateRecurringMutation = useMutation({
    mutationFn: async (data: RecurringTransaction) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: result, error } = await supabase
        .from('recurring_transactions')
        .update({
          category: data.category,
          amount: data.amount,
          description: data.description,
          frequency: data.frequency,
          day_of_month: data.day_of_month,
          day_of_week: data.day_of_week,
          next_due_date: data.next_due_date,
        })
        .eq('id', data.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
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

  // Delete recurring transaction
  const deleteRecurringMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions', user?.id] });
      toast({
        title: "Deleted",
        description: "Bill reminder has been deleted.",
      });
    },
  });

  // Get upcoming bills (next 30 days)
  const upcomingBills = recurringTransactions
    .filter(rt => {
      const dueDate = new Date(rt.next_due_date);
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      return dueDate >= today && dueDate <= thirtyDaysFromNow;
    })
    .sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime());

  // Get overdue bills
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
