import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Budget, Transaction } from '@/types/finance';
import { useToast } from './use-toast';

export function useBudgets(transactions: Transaction[] = []) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: budgetsRaw = [], isLoading, error } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await api.get('/budgets');
      return data.map((budget: any) => ({
        id: budget.id,
        category: budget.category,
        limit: budget.limit,
        period: budget.period || 'monthly',
      })) as Omit<Budget, 'spent'>[];
    },
    enabled: !!user?.id,
  });

  const budgets = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const categorySpending: Record<string, number> = {};

    transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      });

    return budgetsRaw.map(budget => ({
      ...budget,
      spent: categorySpending[budget.category] || 0,
    })) as Budget[];
  }, [budgetsRaw, transactions]);

  const addBudgetMutation = useMutation({
    mutationFn: async (budgetData: Omit<Budget, 'id' | 'spent'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const payload = {
        category: budgetData.category,
        limit: budgetData.limit,
        period: budgetData.period || 'monthly',
      };

      const { data } = await api.post('/budgets', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Success',
        description: 'Budget created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to create budget',
        variant: 'destructive',
      });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, ...budgetData }: Budget) => {
      const payload = {
        category: budgetData.category,
        limit: budgetData.limit,
        period: budgetData.period || 'monthly',
      };

      const { data } = await api.put(`/budgets/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Success',
        description: 'Budget updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to update budget',
        variant: 'destructive',
      });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Success',
        description: 'Budget deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to delete budget',
        variant: 'destructive',
      });
    },
  });

  return {
    budgets,
    isLoading,
    error,
    addBudget: addBudgetMutation.mutate,
    updateBudget: updateBudgetMutation.mutate,
    deleteBudget: deleteBudgetMutation.mutate,
    isAdding: addBudgetMutation.isPending,
    isUpdating: updateBudgetMutation.isPending,
    isDeleting: deleteBudgetMutation.isPending,
  };
}
