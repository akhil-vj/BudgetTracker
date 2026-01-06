import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Budget } from '@/types/finance';
import { useToast } from './use-toast';

export function useBudgets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch budgets
  const { data: budgets = [], isLoading, error } = useQuery({
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
        spent: 0, // Will be calculated from transactions
        period: budget.period || 'monthly',
      })) as Budget[];
    },
  });

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
