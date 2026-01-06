import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant: 'income' | 'expense' | 'savings' | 'default';
  delay?: number;
}

const variantStyles = {
  income: {
    iconBg: 'bg-income/10',
    iconColor: 'text-income',
    gradient: 'from-income/20 to-transparent',
  },
  expense: {
    iconBg: 'bg-expense/10',
    iconColor: 'text-expense',
    gradient: 'from-expense/20 to-transparent',
  },
  savings: {
    iconBg: 'bg-savings/10',
    iconColor: 'text-savings',
    gradient: 'from-savings/20 to-transparent',
  },
  default: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    gradient: 'from-primary/20 to-transparent',
  },
};

export function StatCard({ title, value, change, changeLabel, icon: Icon, variant, delay = 0 }: StatCardProps) {
  const styles = variantStyles[variant];
  const isPositive = change && change > 0;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card p-6 relative overflow-hidden group hover:border-primary/30 transition-colors"
    >
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none",
        styles.gradient
      )} />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-2.5 rounded-xl", styles.iconBg)}>
            <Icon className={cn("w-5 h-5", styles.iconColor)} />
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              isPositive ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
            )}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {changeLabel && (
            <p className="text-xs text-muted-foreground mt-1">{changeLabel}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
