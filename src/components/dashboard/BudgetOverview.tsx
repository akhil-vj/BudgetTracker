import { motion } from 'framer-motion';
import { Budget } from '@/types/finance';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/currency';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Target } from 'lucide-react';

interface BudgetOverviewProps {
  budgets: Budget[];
}

export function BudgetOverview({ budgets }: BudgetOverviewProps) {
  const { preferences } = usePreferences();
  // Budgets already have spent amounts calculated by useBudgets hook
  const budgetsWithSpent = budgets;

  if (budgets.length === 0) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Budget Overview</h3>
          <span className="text-sm text-muted-foreground">This month</span>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground mb-1">No budgets set</p>
          <p className="text-sm text-muted-foreground/70">Create budgets to track spending</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Budget Overview</h3>
        <span className="text-sm text-muted-foreground">This month</span>
      </div>

      <div className="space-y-4">
        {budgetsWithSpent.slice(0, 5).map((budget, index) => {
          const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
          const isWarning = percentage >= 80 && percentage < 100;
          const isOver = percentage >= 100;

          return (
            <motion.div
              key={budget.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{budget.category}</span>
                <span className={cn(
                  "font-medium",
                  isOver ? "text-expense" : isWarning ? "text-warning" : "text-muted-foreground"
                )}>
                  {formatCurrency(budget.spent, preferences.currency)} / {formatCurrency(budget.limit, preferences.currency)}
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={percentage} 
                  className={cn(
                    "h-2",
                    isOver ? "[&>div]:bg-expense" : isWarning ? "[&>div]:bg-warning" : "[&>div]:bg-primary"
                  )}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}