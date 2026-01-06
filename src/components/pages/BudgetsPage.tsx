import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2,
  Target,
  TrendingDown,
  Wallet,
  PiggyBank
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Budget, Transaction, ExpenseCategory } from '@/types/finance';
import { expenseCategories, categoryIcons } from '@/data/mockData';
import { useBudgets } from '@/hooks/useBudgets';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/currency';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BudgetsPageProps {
  budgets: Budget[];
  transactions: Transaction[];
}

export function BudgetsPage({ budgets: _, transactions }: BudgetsPageProps) {
  const { budgets, addBudget, deleteBudget, updateBudget } = useBudgets();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newBudget, setNewBudget] = useState({
    category: '' as ExpenseCategory,
    limit: '',
  });

  // Calculate spent amounts from transactions
  const budgetsWithSpent = useMemo(() => {
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
    
    return budgets.map(budget => ({
      ...budget,
      spent: categorySpending[budget.category] || 0,
    }));
  }, [budgets, transactions]);

  const totalBudget = budgetsWithSpent.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = budgetsWithSpent.reduce((acc, b) => acc + b.spent, 0);
  const remaining = totalBudget - totalSpent;

  const handleAddBudget = () => {
    if (!newBudget.category || !newBudget.limit) return;
    
    if (editingId) {
      // Update existing budget
      updateBudget({
        id: editingId,
        category: newBudget.category,
        limit: parseFloat(newBudget.limit),
        spent: 0,
        period: 'monthly',
      });
      setEditingId(null);
    } else {
      // Add new budget
      addBudget({
        category: newBudget.category,
        limit: parseFloat(newBudget.limit),
        period: 'monthly',
      });
    }
    setNewBudget({ category: '' as ExpenseCategory, limit: '' });
    setIsAddDialogOpen(false);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingId(budget.id);
    setNewBudget({
      category: budget.category,
      limit: budget.limit.toString(),
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteBudget = (id: string) => {
    deleteBudget(id);
  };

  if (budgets.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-3 md:p-6"
          >
            <div className="flex flex-col gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 w-fit">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
                <p className="text-lg font-bold text-foreground">₹0</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-3 md:p-6"
          >
            <div className="flex flex-col gap-2">
              <div className="p-1.5 rounded-lg bg-expense/10 w-fit">
                <TrendingDown className="w-4 h-4 text-expense" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                <p className="text-lg font-bold text-foreground">₹0</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-3 md:p-6"
          >
            <div className="flex flex-col gap-2">
              <div className="p-1.5 rounded-lg bg-savings/10 w-fit">
                <Wallet className="w-4 h-4 text-savings" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                <p className="text-lg font-bold text-foreground">₹0</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-3 md:p-6"
          >
            <div className="flex flex-col gap-2">
              <div className="p-1.5 rounded-lg bg-income/10 w-fit">
                <PiggyBank className="w-4 h-4 text-income" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Active Budgets</p>
                <p className="text-lg font-bold text-foreground">0</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
        >
          <EmptyState
            icon={Target}
            title="No budgets set yet"
            description="Create your first budget to track spending by category. Set limits for Food, Transportation, Entertainment, and more."
            actionLabel="Create Budget"
            onAction={() => setIsAddDialogOpen(true)}
          />
        </motion.div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={newBudget.category} 
                  onValueChange={(value) => setNewBudget({ ...newBudget, category: value as ExpenseCategory })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {categoryIcons[cat]} {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit (₹)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={newBudget.limit}
                  onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAddBudget}>
                  Create Budget
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-3 md:p-6"
        >
          <div className="flex flex-col gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 w-fit">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
              <p className="text-lg font-bold text-foreground">{formatINR(totalBudget)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-3 md:p-6"
        >
          <div className="flex flex-col gap-2">
            <div className="p-1.5 rounded-lg bg-expense/10 w-fit">
              <TrendingDown className="w-4 h-4 text-expense" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
              <p className="text-lg font-bold text-foreground">{formatINR(totalSpent)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-3 md:p-6"
        >
          <div className="flex flex-col gap-2">
            <div className="p-1.5 rounded-lg bg-savings/10 w-fit">
              <Wallet className="w-4 h-4 text-savings" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Remaining</p>
              <p className={cn(
                "text-lg font-bold",
                remaining >= 0 ? "text-savings" : "text-expense"
              )}>{formatINR(remaining)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-3 md:p-6"
        >
          <div className="flex flex-col gap-2">
            <div className="p-1.5 rounded-lg bg-income/10 w-fit">
              <PiggyBank className="w-4 h-4 text-income" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Active Budgets</p>
              <p className="text-lg font-bold text-foreground">{budgets.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Overall Progress */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-4 md:p-6"
      >
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="text-sm md:text-lg font-semibold text-foreground">Overall Budget Progress</h3>
          <span className="text-xs md:text-sm text-muted-foreground">
            {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% used
          </span>
        </div>
        <Progress 
          value={totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0} 
          className="h-2 md:h-3"
        />
      </motion.div>

      {/* Budget Categories */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm md:text-lg font-semibold text-foreground">Category Budgets</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-8 text-xs md:h-9 md:text-sm">
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={newBudget.category} 
                  onValueChange={(value) => setNewBudget({ ...newBudget, category: value as ExpenseCategory })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {categoryIcons[cat]} {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit (₹)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={newBudget.limit}
                  onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingId(null);
                }}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAddBudget}>
                  {editingId ? 'Update Budget' : 'Create Budget'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {budgetsWithSpent.map((budget, index) => {
          const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
          const isWarning = percentage >= 80 && percentage < 100;
          const isOver = percentage >= 100;

          return (
            <motion.div
              key={budget.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 + index * 0.05 }}
              className="glass-card p-4 md:p-6"
            >
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary/50 flex items-center justify-center text-lg md:text-xl shrink-0">
                    {categoryIcons[budget.category] || '📦'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm md:text-base font-semibold text-foreground truncate">{budget.category}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Monthly budget</p>
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 md:h-8 md:w-8"
                    onClick={() => handleEditBudget(budget)}
                  >
                    <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 md:h-8 md:w-8 text-expense hover:text-expense"
                    onClick={() => handleDeleteBudget(budget.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className={cn(
                    "font-medium",
                    isOver ? "text-expense" : isWarning ? "text-warning" : "text-foreground"
                  )}>
                    {formatINR(budget.spent)} / {formatINR(budget.limit)}
                  </span>
                  <span className={cn(
                    "font-medium",
                    isOver ? "text-expense" : isWarning ? "text-warning" : "text-muted-foreground"
                  )}>
                    {Math.round(percentage)}%
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className={cn(
                    "h-2 md:h-3",
                    isOver ? "[&>div]:bg-expense" : isWarning ? "[&>div]:bg-warning" : "[&>div]:bg-primary"
                  )}
                />
                <p className={cn(
                  "text-xs md:text-sm",
                  isOver ? "text-expense" : "text-muted-foreground"
                )}>
                  {isOver 
                    ? `Over budget by ${formatINR(budget.spent - budget.limit)}`
                    : `${formatINR(budget.limit - budget.spent)} remaining`
                  }
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}