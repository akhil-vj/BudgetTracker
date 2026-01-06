import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Sparkles, Brain } from 'lucide-react';
import { Prediction, Transaction } from '@/types/finance';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { usePreferences } from '@/contexts/PreferencesContext';

interface PredictionInsightsProps {
  predictions: Prediction[];
  transactions?: Transaction[];
}

const MIN_DAYS_FOR_PREDICTION = 30;

export function PredictionInsights({ predictions, transactions = [] }: PredictionInsightsProps) {
  const { preferences } = usePreferences();
  // Calculate days of data
  const daysOfData = useMemo(() => {
    if (transactions.length === 0) return 0;
    
    const dates = transactions.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    return Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
  }, [transactions]);

  const hasEnoughData = daysOfData >= MIN_DAYS_FOR_PREDICTION;

  // Generate predictions from real data if we have enough
  const realPredictions = useMemo((): Prediction[] => {
    if (!hasEnoughData) return [];
    
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) return [];
    
    const categoryTotals: Record<string, number> = {};
    
    expenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
    const monthsOfData = Math.max(1, daysOfData / 30);
    
    return Object.entries(categoryTotals)
      .map(([category, total]) => ({
        category: category as Prediction['category'],
        predictedAmount: Math.round(total / monthsOfData),
        confidence: Math.min(90, 50 + (daysOfData / 3)),
        trend: 'stable' as const,
        percentageChange: 0,
      }))
      .sort((a, b) => b.predictedAmount - a.predictedAmount)
      .slice(0, 4);
  }, [transactions, daysOfData, hasEnoughData]);

  const displayPredictions = hasEnoughData ? realPredictions : predictions;
  const totalPredicted = displayPredictions.reduce((acc, p) => acc + p.predictedAmount, 0);
  const avgConfidence = displayPredictions.length > 0 
    ? Math.round(displayPredictions.reduce((acc, p) => acc + p.confidence, 0) / displayPredictions.length)
    : 0;

  if (!hasEnoughData) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">AI Predictions</h3>
        </div>
        
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
            <svg className="w-16 h-16 absolute" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                strokeDasharray={`${Math.min((daysOfData / MIN_DAYS_FOR_PREDICTION) * 100, 100) * 2.83} 283`}
                strokeLinecap="round" transform="rotate(-90 50 50)"
              />
            </svg>
            <span className="text-xs font-bold text-primary">{Math.round((daysOfData / MIN_DAYS_FOR_PREDICTION) * 100)}%</span>
          </div>
          <p className="text-muted-foreground text-sm mb-1">
            {daysOfData === 0 ? "No data yet" : `${daysOfData} days of data`}
          </p>
          <p className="text-xs text-muted-foreground/70">
            Need {MIN_DAYS_FOR_PREDICTION} days for predictions
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">AI Predictions</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-secondary/30">
          <p className="text-xs text-muted-foreground mb-1">Next Month</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(totalPredicted, preferences.currency)}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/30">
          <p className="text-xs text-muted-foreground mb-1">Confidence</p>
          <p className="text-lg font-bold text-primary">{avgConfidence}%</p>
        </div>
      </div>

      <div className="space-y-3">
        {displayPredictions.slice(0, 4).map((prediction, index) => (
          <motion.div
            key={prediction.category}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.45 + index * 0.05 }}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1 rounded",
                prediction.trend === 'up' ? 'bg-expense/10' : 
                prediction.trend === 'down' ? 'bg-income/10' : 'bg-muted'
              )}>
                {prediction.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-expense" />
                ) : prediction.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3 text-income" />
                ) : (
                  <Minus className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              <span className="text-muted-foreground truncate max-w-[100px]">{prediction.category}</span>
            </div>
            <span className="font-medium text-foreground">{formatCurrency(prediction.predictedAmount, preferences.currency)}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}