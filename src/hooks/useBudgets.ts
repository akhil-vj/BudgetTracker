import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Budget, Transaction } from '@/types/finance';
import { useToast } from './use-toast';

export function useBudgets(transactions: Transaction[] = []) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch budgets
  const { data: budgetsRaw = [], isLoading, error } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        return [];
      }

      return (data || []).map((budget: any) => ({
        id: budget.id,
        category: budget.category,
        limit: budget.limit,
        period: budget.period || 'monthly',
      })) as Omit<Budget, 'spent'>[];
    },
  });

  // Calculate spent amounts from transactions for current month
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

  // Add budget
  const addBudgetMutation = useMutation({
    mutationFn: async (budgetData: Omit<Budget, 'id' | 'spent'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .insert([
          {
            user_id: user.id,
            category: budgetData.category,
            'limit': budgetData.limit,
            period: budgetData.period || 'monthly',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Success',
        description: 'Budget created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create budget',
        variant: 'destructive',
      });
    },
  });

  // Update budget
  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, ...budgetData }: Budget) => {
      const { error } = await supabase
        .from('budgets')
        .update({
          category: budgetData.category,
          'limit': budgetData.limit,
          period: budgetData.period || 'monthly',
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Success',
        description: 'Budget updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update budget',
        variant: 'destructive',
      });
    },
  });

  // Delete budget
  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Success',
        description: 'Budget deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete budget',
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
