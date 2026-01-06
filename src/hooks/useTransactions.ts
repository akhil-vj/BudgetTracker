import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Budget } from '@/types/finance';
import { generateBudgetAlerts } from '@/lib/alertService';
import { useToast } from './use-toast';

export function useTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch transactions
  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Transform database rows to Transaction type
      return (data || []).map(row => ({
        id: row.id,
        type: row.type as 'income' | 'expense',
        amount: row.amount,
        category: row.category,
        description: row.description,
        date: row.date,
        paymentMethod: row.payment_method,
      }));
    },
    enabled: !!user?.id,
  });

  // Add transaction
  const addTransactionMutation = useMutation({
    mutationFn: async (transactionData: Omit<Transaction, 'id'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            type: transactionData.type,
            amount: transactionData.amount,
            category: transactionData.category,
            description: transactionData.description,
            date: transactionData.date,
            payment_method: transactionData.paymentMethod,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      // Invalidate and refetch transactions query
      await queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      
      // Generate alerts after transaction is added
      if (user?.id) {
        try {
          // Ensure we have fresh data by refetching
          await queryClient.refetchQueries({ queryKey: ['transactions', user?.id] });
          
          // Fetch budgets directly (don't rely on cache)
          const { data: budgetsData, error: budgetsError } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', user.id);
          
          const budgets = budgetsData?.map((b: any) => ({
            id: b.id,
            category: b.category,
            limit: b.limit,
            spent: 0,
            period: b.period || 'monthly',
          })) as Budget[] || [];
          
          const transactions = queryClient.getQueryData(['transactions', user?.id]) as Transaction[];
          
          if (transactions && budgets.length > 0) {
            const createdAlerts = await generateBudgetAlerts(user.id, budgets, transactions);
            
            // Show toast for each created alert
            createdAlerts.forEach(({ title, message }) => {
              toast({
                title: title,
                description: message,
                variant: 'destructive',
              });
            });
            
            // Refetch alerts to update UI
            if (createdAlerts.length > 0) {
              // Add small delay to ensure database writes complete
              await new Promise(resolve => setTimeout(resolve, 500));
              queryClient.invalidateQueries({ queryKey: ['alerts'] });
              await queryClient.refetchQueries({ queryKey: ['alerts'] });
            }
          }
        } catch (error) {
          // Silently fail - alerts are not critical
        }
      }
    },
  });

  // Update transaction
  const updateTransactionMutation = useMutation({
    mutationFn: async (data: Transaction) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: updated, error } = await supabase
        .from('transactions')
        .update({
          type: data.type,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date,
          payment_method: data.paymentMethod,
        })
        .eq('id', data.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      
      // Generate alerts after transaction is updated
      if (user?.id) {
        try {
          await queryClient.refetchQueries({ queryKey: ['transactions', user?.id] });
          
          const { data: budgetsData, error: budgetsError } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', user.id);
          
          const budgets = budgetsData?.map((b: any) => ({
            id: b.id,
            category: b.category,
            limit: b.limit,
            spent: 0,
            period: b.period || 'monthly',
          })) as Budget[] || [];
          
          const transactions = queryClient.getQueryData(['transactions', user?.id]) as Transaction[];
          
          if (transactions && budgets.length > 0) {
            const createdAlerts = await generateBudgetAlerts(user.id, budgets, transactions);
            
            createdAlerts.forEach(({ title, message }) => {
              toast({
                title: title,
                description: message,
                variant: 'destructive',
              });
            });
            
            if (createdAlerts.length > 0) {
              await new Promise(resolve => setTimeout(resolve, 500));
              queryClient.invalidateQueries({ queryKey: ['alerts'] });
              await queryClient.refetchQueries({ queryKey: ['alerts'] });
            }
          }
        } catch (error) {
          // Silently fail
        }
      }
    },
  });

  // Delete transaction
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
  });

  return {
    transactions,
    isLoading,
    error,
    addTransaction: addTransactionMutation.mutate,
    updateTransaction: updateTransactionMutation.mutate,
    deleteTransaction: deleteTransactionMutation.mutate,
    isAdding: addTransactionMutation.isPending,
    isUpdating: updateTransactionMutation.isPending,
    isDeleting: deleteTransactionMutation.isPending,
  };
}
