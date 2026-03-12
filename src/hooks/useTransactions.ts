import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Transaction, Budget } from '@/types/finance';
import { generateBudgetAlerts } from '@/lib/alertService';
import { useToast } from './use-toast';

export function useTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await api.get('/transactions');
      return response.data;
    },
    enabled: !!user?.id,
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (transactionData: Omit<Transaction, 'id'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const payload = {
        type: transactionData.type,
        amount: transactionData.amount,
        category: transactionData.category,
        description: transactionData.description,
        date: transactionData.date,
        payment_method: transactionData.paymentMethod,
      };

      const response = await api.post('/transactions', payload);
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      await queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });

      if (user?.id) {
        try {
          await queryClient.refetchQueries({ queryKey: ['transactions', user?.id] });
          const response = await api.get('/budgets');
          const budgets = response.data.map((b: any) => ({
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
            }
          }
        } catch (error) {
          // Silent fail
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || error.message || 'Failed to add transaction.',
        variant: 'destructive',
      });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async (data: Transaction) => {
      if (!user?.id) throw new Error('Not authenticated');

      const payload = {
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date,
        payment_method: data.paymentMethod,
      };

      const response = await api.put(`/transactions/${data.id}`, payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || error.message || 'Failed to update transaction.',
        variant: 'destructive',
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || error.message || 'Failed to delete transaction.',
        variant: 'destructive',
      });
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
