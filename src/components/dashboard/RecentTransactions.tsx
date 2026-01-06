import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Receipt } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { categoryIcons } from '@/data/mockData';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort } from '@/lib/date';
import { EmptyState } from '@/components/ui/empty-state';
import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onAddTransaction?: () => void;
}

export function RecentTransactions({ transactions, onAddTransaction }: RecentTransactionsProps) {
  const { preferences } = usePreferences();
  const recentTransactions = useMemo(() => transactions.slice(0, 6), [transactions]);

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        </div>
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Start by adding your first income or expense"
          actionLabel="Add Transaction"
          onAction={onAddTransaction}
          className="py-12"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="glass-card"
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        <Button variant="ghost" size="sm" className="text-primary text-sm">
          View all
        </Button>
      </div>

      <div className="divide-y divide-border">
        {recentTransactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.35 + index * 0.03 }}
            className="flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors group"
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
              transaction.type === 'income' ? 'bg-income/10' : 'bg-expense/10'
            )}>
              {categoryIcons[transaction.category] || '📦'}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate text-sm">{transaction.description}</p>
              <p className="text-xs text-muted-foreground">{transaction.category}</p>
            </div>
            
            <div className="text-right">
              <p className={cn(
                "font-semibold text-sm flex items-center gap-1",
                transaction.type === 'income' ? 'text-income' : 'text-expense'
              )}>
                {transaction.type === 'income' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {formatCurrency(transaction.amount, preferences.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateShort(transaction.date)}
              </p>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}