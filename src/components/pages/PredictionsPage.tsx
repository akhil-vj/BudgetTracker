import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Lightbulb,
  Brain,
  Target,
  Zap,
  Clock,
  Loader2,
  Lock
} from 'lucide-react';
import { Transaction, Prediction, ExpenseCategory } from '@/types/finance';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { EmptyPredictionState } from '@/components/ui/empty-state';
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { calculateMonthlyData } from '@/data/mockData';
import { trainMLModel, predictExpenses, disposeModel } from '@/lib/mlPrediction';
import { usePreferences } from '@/contexts/PreferencesContext';
import type { MLModel } from '@/lib/mlPrediction';

interface PredictionsPageProps {
  transactions: Transaction[];
}

const MIN_DAYS_FOR_PREDICTION = 30;
const MIN_TRANSACTIONS_FOR_ML = 15;

interface MLState {
  model: MLModel | null;
  isTraining: boolean;
  hasError: boolean;
  modelAccuracy: number;
}


export function PredictionsPage({ transactions }: PredictionsPageProps) {
  const { preferences, updatePreferences } = usePreferences();
  const [mlState, setMlState] = useState<MLState>({
    model: null,
    isTraining: false,
    hasError: false,
    modelAccuracy: 0,
  });
  const [mlPredictions, setMlPredictions] = useState<Prediction[]>([]);

  // Calculate days of data
  const daysOfData = useMemo(() => {
    if (transactions.length === 0) return 0;
    
    const dates = transactions.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    return Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
  }, [transactions]);

  const expenseCount = useMemo(
    () => transactions.filter(t => t.type === 'expense').length,
    [transactions]
  );

  // Train ML model when transactions change (debounced)
  useEffect(() => {
    const trainModel = async () => {
      if (daysOfData < MIN_DAYS_FOR_PREDICTION || expenseCount < MIN_TRANSACTIONS_FOR_ML) {
        return;
      }

      try {
        setMlState(prev => ({ ...prev, isTraining: true, hasError: false }));
        
        // Train the model
        const model = await trainMLModel(transactions);
        
        if (model) {
          setMlState(prev => ({
            ...prev,
            model,
            isTraining: false,
            modelAccuracy: Math.round(model.accuracy * 100),
          }));

          // Generate predictions
          const predictions = await predictExpenses(model, transactions);
          setMlPredictions(predictions);
        } else {
          setMlState(prev => ({ ...prev, isTraining: false }));
        }
      } catch (error) {
        console.error('ML training error:', error);
        setMlState(prev => ({
          ...prev,
          isTraining: false,
          hasError: true,
          model: null,
        }));
      }
    };

    // Debounce training to avoid too frequent retraining
    const timeoutId = setTimeout(trainModel, 1000);
    return () => clearTimeout(timeoutId);
  }, [transactions, daysOfData, expenseCount]);

  // Cleanup model on unmount
  useEffect(() => {
    return () => {
      if (mlState.model) {
        disposeModel(mlState.model);
      }
    };
  }, [mlState.model]);

  // Use ML predictions if available, otherwise fall back to rule-based
  const predictions = useMemo((): Prediction[] => {
    if (mlPredictions.length > 0) {
      return mlPredictions;
    }

    // Fallback to rule-based prediction
    if (daysOfData < MIN_DAYS_FOR_PREDICTION) return [];
    
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) return [];
    
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    
    expenses.forEach(t => {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = { total: 0, count: 0 };
      }
      categoryTotals[t.category].total += t.amount;
      categoryTotals[t.category].count += 1;
    });
    
    const monthsOfData = Math.max(1, daysOfData / 30);
    
    return Object.entries(categoryTotals)
      .map(([category, data]) => {
        const monthlyAvg = data.total / monthsOfData;
        const confidence = Math.min(90, 50 + (daysOfData / 3));
        
        const trend: 'up' | 'down' | 'stable' = 
          data.count > 5 ? 'up' : data.count > 2 ? 'stable' : 'down';
        const percentageChange = trend === 'up' ? 8 : trend === 'down' ? -5 : 0;
        
        return {
          category: category as ExpenseCategory,
          predictedAmount: Math.round(monthlyAvg),
          confidence: Math.round(confidence),
          trend,
          percentageChange,
        };
      })
      .sort((a, b) => b.predictedAmount - a.predictedAmount)
      .slice(0, 6);
  }, [mlPredictions, transactions, daysOfData]);

  const totalPredicted = predictions.reduce((acc, p) => acc + p.predictedAmount, 0);
  const avgConfidence = predictions.length > 0 
    ? Math.round(predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length)
    : 0;

  // Generate chart data
  const monthlyData = useMemo(() => calculateMonthlyData(transactions), [transactions]);
  
  const predictionData = useMemo(() => {
    if (monthlyData.length === 0) return [];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const lastMonth = monthlyData[monthlyData.length - 1]?.month || 'Dec';
    const lastMonthIndex = months.indexOf(lastMonth);
    const nextMonth = months[(lastMonthIndex + 1) % 12];
    const monthAfter = months[(lastMonthIndex + 2) % 12];
    
    return [
      ...monthlyData,
      { month: nextMonth, income: 0, expenses: totalPredicted, savings: -totalPredicted },
      { month: monthAfter, income: 0, expenses: Math.round(totalPredicted * 1.05), savings: -Math.round(totalPredicted * 1.05) },
    ];
  }, [monthlyData, totalPredicted]);

  // Show disabled state if predictions are not enabled
  if (!preferences.predictionsEnabled) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-card-elevated p-6 relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">AI-Powered Predictions</h2>
                <p className="text-muted-foreground">Neural network-based expense forecasting</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-1">Predictions Disabled</h3>
              <p className="text-muted-foreground">You've opted out of AI-powered spending predictions. Enable it in Settings to get personalized insights.</p>
            </div>
          </div>
          <button
            onClick={() => updatePreferences({ predictionsEnabled: true })}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Enable Personalized Insights
          </button>
        </motion.div>
      </div>
    );
  }

  // Show empty state if not enough data
  if (daysOfData < MIN_DAYS_FOR_PREDICTION) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-card-elevated p-6 relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">AI-Powered Predictions</h2>
                <p className="text-muted-foreground">Neural network-based expense forecasting</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card"
        >
          <EmptyPredictionState daysOfData={daysOfData} minDaysRequired={MIN_DAYS_FOR_PREDICTION} />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">How ML Predictions Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-secondary/20">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium text-foreground mb-1">Build History</h4>
              <p className="text-sm text-muted-foreground">Add expenses for at least 30 days. More data = better predictions!</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/20">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium text-foreground mb-1">Neural Network</h4>
              <p className="text-sm text-muted-foreground">TensorFlow.js trains a deep learning model on your spending patterns</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/20">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium text-foreground mb-1">Accurate Forecasts</h4>
              <p className="text-sm text-muted-foreground">Get personalized predictions with confidence scores</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-card-elevated p-6 relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-savings/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">AI-Powered Predictions</h2>
              <p className="text-muted-foreground">
                {mlState.isTraining ? 'Training neural network...' : 
                mlState.hasError ? 'Using standard prediction mode' :
                mlState.model ? 'ML model ready' : 'Based on spending patterns'}
              </p>
            </div>
            {mlState.isTraining && (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-secondary/30">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Next Month</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPredicted)}</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">ML Confidence</span>
              </div>
              <p className="text-2xl font-bold text-primary">{avgConfidence}%</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-income" />
                <span className="text-sm text-muted-foreground">Data Points</span>
              </div>
              <p className="text-2xl font-bold text-income">{expenseCount}</p>
            </div>
            {mlState.model && (
              <div className="p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-income" />
                  <span className="text-sm text-muted-foreground">Model R²</span>
                </div>
                <p className="text-2xl font-bold text-income">{mlState.modelAccuracy}%</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Prediction Chart */}
      {predictionData.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Expense Forecast</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(0, 72%, 60%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(0, 72%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(222, 30%, 18%)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 8%)',
                    border: '1px solid hsl(222, 30%, 18%)',
                    borderRadius: '12px',
                  }}
                  labelStyle={{ color: 'hsl(210, 40%, 98%)', fontWeight: 600 }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(0, 72%, 60%)"
                  strokeWidth={2}
                  fill="url(#expenseGrad)"
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Category Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-foreground">Category Predictions</h3>
            {mlState.model && (
              <span className="px-2 py-1 text-xs rounded-full bg-income/20 text-income font-medium">
                ML Model
              </span>
            )}
          </div>
          <div className="space-y-4">
            {predictions.length > 0 ? (
              predictions.map((prediction, index) => (
                <motion.div
                  key={prediction.category}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      prediction.trend === 'up' ? 'bg-expense/10' : 
                      prediction.trend === 'down' ? 'bg-income/10' : 'bg-muted'
                    )}>
                      {prediction.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-expense" />
                      ) : prediction.trend === 'down' ? (
                        <TrendingDown className="w-4 h-4 text-income" />
                      ) : (
                        <Minus className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{prediction.category}</p>
                      <p className="text-xs text-muted-foreground">{prediction.confidence}% confidence</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(prediction.predictedAmount)}</p>
                    <p className={cn(
                      "text-xs",
                      prediction.trend === 'up' ? 'text-expense' : 
                      prediction.trend === 'down' ? 'text-income' : 'text-muted-foreground'
                    )}>
                      {prediction.percentageChange > 0 ? '+' : ''}{prediction.percentageChange}%
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No predictions available</p>
            )}
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Smart Insights</h3>
          <div className="space-y-4">
            {predictions.length > 0 && predictions[0].trend === 'up' && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-warning mb-1">Spending Alert</p>
                    <p className="text-sm text-warning/80">
                      Your {predictions[0].category} expenses are trending higher ({predictions[0].percentageChange}% increase). Consider budgeting more.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-income/10 border border-income/20">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-income mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-income mb-1">Data Quality</p>
                  <p className="text-sm text-income/80">
                    {daysOfData >= 90 
                      ? "Excellent! Your data is ideal for highly accurate ML predictions."
                      : `Add ${90 - daysOfData} more days of data for optimal ML accuracy.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-primary mb-1">Monthly Forecast</p>
                  <p className="text-sm text-primary/80">
                    {mlState.model ? 
                      `Neural network predicts ~${formatCurrency(totalPredicted)} next month based on ${daysOfData} days of data.` :
                      `Based on your patterns, expect to spend around ${formatCurrency(totalPredicted)} next month.`
                    }
                  </p>
                </div>
              </div>
            </div>

            {mlState.hasError && (
              <div className="p-4 rounded-xl bg-muted/20 border border-muted/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">ML Training Failed</p>
                    <p className="text-sm text-muted-foreground/80">
                      Using standard predictions. Try adding more diverse transaction data.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}