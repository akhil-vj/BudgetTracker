import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CategoryData } from '@/types/finance';
import { formatCurrency } from '@/lib/currency';
import { usePreferences } from '@/contexts/PreferencesContext';
import { PieChart as PieChartIcon } from 'lucide-react';

interface CategoryBreakdownProps {
  data: CategoryData[];
}

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(280, 87%, 65%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 60%)',
  'hsl(174, 72%, 56%)',
];

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const { preferences } = usePreferences();
  const hasData = data.length > 0;
  const totalAmount = data.reduce((sum, cat) => sum + cat.amount, 0);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Expense Breakdown</h3>
        {hasData && (
          <span className="text-sm text-muted-foreground">
            Total: {formatCurrency(totalAmount, preferences.currency)}
          </span>
        )}
      </div>

      {hasData ? (
        <div className="space-y-3">
          {data.slice(0, 6).map((category, index) => (
            <motion.div
              key={category.category}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              className="group"
            >
              {/* Category Info Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-foreground truncate">
                    {category.category}
                  </span>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(category.amount, preferences.currency)}
                  </span>
                  <span className="text-sm font-semibold text-foreground min-w-[50px] text-right">
                    {category.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${category.percentage}%` }}
                  transition={{ delay: 0.2 + (0.1 * index), duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full transition-opacity duration-300 group-hover:opacity-80"
                  style={{ 
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
              </div>
            </motion.div>
          ))}

          {/* Show More Indicator */}
          {data.length > 6 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="w-full text-center text-xs text-primary hover:text-primary/80 transition-colors py-2 mt-2"
            >
              +{data.length - 6} more categories
            </motion.button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <PieChartIcon className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground mb-1">No expenses yet</p>
          <p className="text-sm text-muted-foreground/70">Add expenses to see breakdown</p>
        </div>
      )}
    </motion.div>
  );
}