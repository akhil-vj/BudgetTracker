import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Transaction } from '@/types/finance';
import { formatCurrency, formatCurrencyCompact } from '@/lib/currency';
import { usePreferences } from '@/contexts/PreferencesContext';
import { calculateMonthlyData } from '@/data/mockData';
import { EmptyChartState } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { useState } from 'react';
import { calculateCategoryBreakdown } from '@/data/mockData';

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(280, 87%, 65%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 60%)',
  'hsl(174, 72%, 56%)',
];

interface AnalyticsPageProps {
  transactions: Transaction[];
}

export function AnalyticsPage({ transactions }: AnalyticsPageProps) {
  const { preferences } = usePreferences();
  const { toast } = useToast();
  const [period, setPeriod] = useState('6months');

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let startDate: Date;

    switch (period) {
      case '1month':
        startDate = new Date(currentYear, currentMonth, 1);
        break;
      case '3months':
        startDate = new Date(currentYear, currentMonth - 2, 1);
        break;
      case '6months':
        startDate = new Date(currentYear, currentMonth - 5, 1);
        break;
      case '1year':
        startDate = new Date(currentYear - 1, currentMonth, 1);
        break;
      default:
        startDate = new Date(currentYear, currentMonth - 5, 1);
    }

    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate;
    });
  }, [transactions, period]);

  const handleExportReport = () => {
    const monthlyData = calculateMonthlyData(filteredTransactions);
    const categoryData = calculateCategoryBreakdown(filteredTransactions);
    
    const totalIncome = monthlyData.reduce((acc, m) => acc + m.income, 0);
    const totalExpenses = monthlyData.reduce((acc, m) => acc + m.expenses, 0);
    const totalSavings = monthlyData.reduce((acc, m) => acc + m.savings, 0);

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 20px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9fafb; }
            .card-value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .card-label { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f3f4f6; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>📊 Analytics Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <h2>Financial Summary</h2>
          <div class="summary">
            <div class="card">
              <div class="card-value">₹${totalIncome.toFixed(2)}</div>
              <div class="card-label">Total Income</div>
            </div>
            <div class="card">
              <div class="card-value">₹${totalExpenses.toFixed(2)}</div>
              <div class="card-label">Total Expenses</div>
            </div>
            <div class="card">
              <div class="card-value">₹${totalSavings.toFixed(2)}</div>
              <div class="card-label">Net Savings</div>
            </div>
          </div>

          <h2>Monthly Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Savings</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyData.map(m => `
                <tr>
                  <td>${m.month}</td>
                  <td>₹${m.income.toFixed(2)}</td>
                  <td>₹${m.expenses.toFixed(2)}</td>
                  <td>₹${m.savings.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Category Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${categoryData.map(c => `
                <tr>
                  <td>${c.category}</td>
                  <td>₹${c.amount.toFixed(2)}</td>
                  <td>${c.percentage.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>This report was generated by Finance Tracker</p>
          </div>
        </body>
      </html>
    `;

    // Open in new window and print as PDF
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }

    toast({
      title: "Report ready",
      description: "Print dialog opened. Choose 'Save as PDF' to download.",
    });
  };

  const monthlyData = useMemo(() => calculateMonthlyData(filteredTransactions), [filteredTransactions]);
  const categoryData = useMemo(() => calculateCategoryBreakdown(filteredTransactions), [filteredTransactions]);

  const totalIncome = monthlyData.reduce((acc, m) => acc + m.income, 0);
  const totalExpenses = monthlyData.reduce((acc, m) => acc + m.expenses, 0);
  const totalSavings = monthlyData.reduce((acc, m) => acc + m.savings, 0);
  const avgSavingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  const hasData = filteredTransactions.length > 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Actions */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col gap-3 md:flex-row md:justify-between"
      >
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Analytics & Reports</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Deep insights into your financial health</p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 md:w-40 h-8 md:h-9 text-xs md:text-sm">
              <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last month</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 md:gap-2 h-8 md:h-9 text-xs md:text-sm px-2 md:px-4" 
            onClick={handleExportReport}
          >
            <Download className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-3 md:p-5"
        >
          <div className="flex flex-col gap-2">
            <div className="p-1.5 md:p-2 rounded-lg bg-income/10 w-fit">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-income" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Income</p>
              <p className="text-base md:text-2xl font-bold text-foreground">{formatCurrency(totalIncome, preferences.currency)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-3 md:p-5"
        >
          <div className="flex flex-col gap-2">
            <div className="p-1.5 md:p-2 rounded-lg bg-expense/10 w-fit">
              <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-expense" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
              <p className="text-base md:text-2xl font-bold text-foreground">{formatCurrency(totalExpenses, preferences.currency)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-3 md:p-5"
        >
          <div className="flex flex-col gap-2">
            <div className="p-1.5 md:p-2 rounded-lg bg-savings/10 w-fit">
              <Wallet className="w-4 h-4 md:w-5 md:h-5 text-savings" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Savings</p>
              <p className="text-base md:text-2xl font-bold text-foreground">{formatCurrency(totalSavings, preferences.currency)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-3 md:p-5"
        >
          <div className="flex flex-col gap-2">
            <div className="p-1.5 md:p-2 rounded-lg bg-primary/10 w-fit">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg Savings Rate</p>
              <p className="text-base md:text-2xl font-bold text-primary">{avgSavingsRate.toFixed(1)}%</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Enhanced Bar Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4 md:p-6 relative overflow-hidden"
        >
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-red-500/5 opacity-30" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm md:text-lg font-semibold text-foreground">Income vs Expenses</h3>
                  <p className="text-xs text-muted-foreground hidden sm:block">Monthly comparison</p>
                </div>
              </div>
              {hasData && monthlyData.length > 0 && (
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-[hsl(142,71%,45%)]" />
                    <span className="text-xs text-muted-foreground">Income</span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-[hsl(0,72%,60%)]" />
                    <span className="text-xs text-muted-foreground">Expenses</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-[250px] md:h-[320px]">
              {hasData && monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={monthlyData} 
                    barGap={4}
                    margin={{ top: 10, right: 5, left: -10, bottom: 5 }}
                  >
                    <defs>
                      {/* Gradient for Income bars */}
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="hsl(142, 71%, 35%)" stopOpacity={0.8} />
                      </linearGradient>
                      {/* Gradient for Expense bars */}
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(0, 72%, 60%)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="hsl(0, 72%, 50%)" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      vertical={false} 
                      stroke="hsl(222, 30%, 18%)" 
                      strokeOpacity={0.3}
                    />
                    
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
                      dy={10}
                    />
                    
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
                      tickFormatter={(value) => formatCurrencyCompact(value, preferences.currency)}
                      dx={-5}
                    />
                    
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      }}
                      labelStyle={{
                        display: 'inline',
                        color: '#1f2937',
                        fontSize: '11px',
                        fontWeight: '600',
                        margin: 0,
                        padding: 0,
                      }}
                      itemStyle={{
                        display: 'none',
                      }}
                      formatter={() => null}
                      cursor={{ fill: 'hsl(222, 30%, 18%)', opacity: 0.1 }}
                      wrapperStyle={{ outline: 'none' }}
                      labelFormatter={(label) => label}
                    />
                    
                    <Bar 
                      dataKey="income" 
                      fill="url(#incomeGradient)"
                      radius={[4, 4, 0, 0]} 
                      name="Income"
                      maxBarSize={40}
                      animationDuration={800}
                      animationBegin={0}
                    />
                    
                    <Bar 
                      dataKey="expenses" 
                      fill="url(#expenseGradient)"
                      radius={[4, 4, 0, 0]} 
                      name="Expenses"
                      maxBarSize={40}
                      animationDuration={800}
                      animationBegin={100}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState title="No data yet" description="Add transactions to see charts" />
              )}
            </div>

            {/* Summary Stats */}
            {hasData && monthlyData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border/50"
              >
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Avg Income</p>
                    <p className="text-xs md:text-sm font-semibold text-foreground">
                      {formatCurrencyCompact(
                        monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length,
                        preferences.currency
                      )}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Avg Expenses</p>
                    <p className="text-xs md:text-sm font-semibold text-foreground">
                      {formatCurrencyCompact(
                        monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length,
                        preferences.currency
                      )}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Net Average</p>
                    <p className={`text-xs md:text-sm font-semibold ${
                      (monthlyData.reduce((sum, m) => sum + (m.income - m.expenses), 0) / monthlyData.length) >= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}>
                      {formatCurrencyCompact(
                        monthlyData.reduce((sum, m) => sum + (m.income - m.expenses), 0) / monthlyData.length,
                        preferences.currency
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-4 md:p-6"
        >
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <h3 className="text-sm md:text-lg font-semibold text-foreground">Expense Categories</h3>
            </div>
          </div>

          {hasData && categoryData.length > 0 ? (
            <div className="flex flex-col items-center gap-4 md:gap-8">
              {/* Professional Pie Chart */}
              <div className="w-48 h-48 md:w-64 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="amount"
                      animationBegin={0}
                      animationDuration={800}
                      activeIndex={undefined}
                      activeShape={{
                        outerRadius: 80,
                        strokeWidth: 0,
                      }}
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="transparent"
                          className="transition-all duration-200 cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      }}
                      itemStyle={{
                        color: '#1f2937',
                        fontSize: '12px',
                        fontWeight: '500',
                        padding: '2px 0',
                      }}
                      labelStyle={{
                        color: '#6b7280',
                        fontSize: '11px',
                        fontWeight: '400',
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        formatCurrency(value, preferences.currency),
                        props.payload.category
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              {/* Clean Legend */}
              <div className="w-full space-y-1.5 md:space-y-2">
                {categoryData.slice(0, 6).map((cat, i) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs md:text-sm group cursor-pointer p-1.5 md:p-2 rounded hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                      <div
                        className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-muted-foreground truncate">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {formatCurrencyCompact(cat.amount, preferences.currency)}
                      </span>
                      <span className="font-medium text-foreground min-w-[40px] text-right">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {categoryData.length > 6 && (
                  <button className="text-xs text-primary hover:underline mt-2">
                    +{categoryData.length - 6} more
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-48 md:h-64">
              <EmptyChartState title="No expenses yet" description="Add expenses to see breakdown" />
            </div>
          )}
        </motion.div>

        {/* Line Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4 md:p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <LineChart className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <h3 className="text-sm md:text-lg font-semibold text-foreground">Savings Trend</h3>
          </div>
          <div className="h-[200px] md:h-[250px]">
            {hasData && monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={monthlyData} margin={{ top: 10, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(222, 30%, 18%)" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }} 
                    tickFormatter={(value) => formatCurrencyCompact(value, preferences.currency)} 
                    dx={-5}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(222, 47%, 8%)', 
                      border: '1px solid hsl(222, 30%, 18%)', 
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [formatCurrency(value, preferences.currency), 'Savings']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="hsl(217, 91%, 60%)" 
                    strokeWidth={2} 
                    dot={{ fill: 'hsl(217, 91%, 60%)', strokeWidth: 0, r: 3 }} 
                    activeDot={{ r: 5, strokeWidth: 0 }} 
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState title="No savings data yet" description="Add income and expenses to track savings" />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}