import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, 
  Download, 
  ArrowDownRight,
  Calendar,
  Search,
  ShoppingBag,
  MoreVertical,
  Trash2,
  Pencil,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Transaction } from '@/types/finance';
import { expenseCategories, categoryIcons } from '@/data/mockData';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort } from '@/lib/date';
import { EmptyState } from '@/components/ui/empty-state';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useToast } from '@/hooks/use-toast';
import { isWithinInterval, startOfToday, startOfMonth, startOfYear, parseISO } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface ExpensesPageProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export function ExpensesPage({ transactions, onAddTransaction, onEditTransaction, onDeleteTransaction }: ExpensesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const { preferences } = usePreferences();
  const { toast } = useToast();
  
  const handleExportReport = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Expenses Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px; }
            h2 { color: #b91c1c; margin-top: 20px; }
            .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
            .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fef2f2; }
            .card-value { font-size: 24px; font-weight: bold; color: #dc2626; }
            .card-label { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #fef2f2; font-weight: bold; color: #b91c1c; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
            @media (max-width: 768px) {
              body { margin: 10px; }
              .summary { grid-template-columns: 1fr; }
              table { font-size: 14px; }
              th, td { padding: 8px; }
            }
          </style>
        </head>
        <body>
          <h1>💸 Expenses Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <h2>Expenses Summary</h2>
          <div class="summary">
            <div class="card">
              <div class="card-value">₹${totalExpenses.toFixed(2)}</div>
              <div class="card-label">Total Expenses</div>
            </div>
            <div class="card">
              <div class="card-value">${filteredTransactions.length}</div>
              <div class="card-label">Transactions</div>
            </div>
            <div class="card">
              <div class="card-value">₹${(totalExpenses / Math.max(1, filteredTransactions.length)).toFixed(2)}</div>
              <div class="card-label">Average Transaction</div>
            </div>
          </div>

          <h2>Expense Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(t => `
                <tr>
                  <td>${new Date(t.date).toLocaleDateString('en-IN')}</td>
                  <td>${t.category}</td>
                  <td>${t.description}</td>
                  <td>₹${t.amount.toFixed(2)}</td>
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
  
  const expenseTransactions = useMemo(() => 
    transactions.filter(t => t.type === 'expense'),
    [transactions]
  );
  
  const totalExpenses = useMemo(() => 
    expenseTransactions.reduce((acc, t) => acc + t.amount, 0),
    [expenseTransactions]
  );

  const getDateRange = (filter: string) => {
    const today = startOfToday();
    
    switch (filter) {
      case 'today':
        return { start: today, end: today };
      case 'month':
        return { start: startOfMonth(today), end: today };
      case 'year':
        return { start: startOfYear(today), end: today };
      default:
        return { start: new Date(1970, 0, 1), end: new Date(2100, 11, 31) };
    }
  };

  const filteredByDate = useMemo(() => {
    const { start, end } = getDateRange(dateRangeFilter);
    return expenseTransactions.filter(t => {
      try {
        const transactionDate = parseISO(t.date);
        return isWithinInterval(transactionDate, { start, end });
      } catch {
        return false;
      }
    });
  }, [expenseTransactions, dateRangeFilter]);

  const filteredTransactions = useMemo(() => 
    filteredByDate.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }),
    [filteredByDate, searchQuery, categoryFilter]
  );

  if (expenseTransactions.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-3 md:p-6"
          >
            <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-xl md:text-3xl font-bold text-expense">₹0</p>
            <p className="text-xs text-muted-foreground mt-1">No expenses yet</p>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-3 md:p-6"
          >
            <p className="text-xs md:text-sm text-muted-foreground mb-1">Transactions</p>
            <p className="text-xl md:text-3xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-1">No entries</p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-3 md:p-6"
          >
            <p className="text-xs md:text-sm text-muted-foreground mb-1">Daily Average</p>
            <p className="text-xl md:text-3xl font-bold text-foreground">₹0</p>
            <p className="text-xs text-muted-foreground mt-1">Per day</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
        >
          <EmptyState
            icon={ShoppingBag}
            title="No expenses recorded yet"
            description="Start by adding your first expense. Track your spending across categories like Food, Transportation, Bills, and more."
            actionLabel="Add Expense"
            onAction={onAddTransaction}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-3 md:p-6"
        >
          <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Expenses</p>
          <p className="text-xl md:text-3xl font-bold text-expense">{formatCurrency(totalExpenses, preferences.currency)}</p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-3 md:p-6"
        >
          <p className="text-xs md:text-sm text-muted-foreground mb-1">Transactions</p>
          <p className="text-xl md:text-3xl font-bold text-foreground">{expenseTransactions.length}</p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-3 md:p-6"
        >
          <p className="text-xs md:text-sm text-muted-foreground mb-1">Daily Average</p>
          <p className="text-xl md:text-3xl font-bold text-foreground">
            {formatCurrency(totalExpenses / 30, preferences.currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Per day</p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-3 md:p-4"
      >
        <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search expenses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 md:h-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48 h-9 md:h-10">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {expenseCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10 shrink-0">
                  <Filter className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-96">
                <SheetHeader>
                  <SheetTitle>Advanced Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Date Range</label>
                    <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                        <SelectItem value="year">This year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {expenseCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Search</label>
                    <Input 
                      placeholder="Description or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                        setDateRangeFilter('all');
                        setFilterOpen(false);
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button variant="outline" className="gap-2 h-9 md:h-10 shrink-0" onClick={handleExportReport}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-3 md:p-4 border-b border-border">
          <h3 className="text-base md:text-lg font-semibold text-foreground">Expense History</h3>
        </div>
        
        <div className="divide-y divide-border">
          {filteredTransactions.length === 0 ? (
            <div className="p-6 md:p-8 text-center text-muted-foreground text-sm md:text-base">
              No expense entries match your filters
            </div>
          ) : (
            filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35 + index * 0.03 }}
                className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-expense/10 flex items-center justify-center text-lg md:text-xl shrink-0">
                  {categoryIcons[transaction.category] || '📦'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm md:text-base text-foreground truncate">{transaction.description}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{transaction.category}</p>
                </div>
                
                <div className="text-right shrink-0">
                  <p className="font-semibold text-expense flex items-center gap-1 text-sm md:text-base">
                    <ArrowDownRight className="w-3 h-3 md:w-4 md:h-4" />
                    {formatCurrency(transaction.amount, preferences.currency)}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                    {formatDateShort(transaction.date)}
                  </p>
                </div>

                {/* 3-Dot Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onEditTransaction?.(transaction)}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => {
                        setTransactionToDelete(transaction.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-md">
          <AlertDialogTitle className="text-base md:text-lg">Delete Transaction</AlertDialogTitle>
          <AlertDialogDescription className="text-sm md:text-base">
            Are you sure you want to delete this expense transaction? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 md:gap-3 justify-end pt-4">
            <AlertDialogCancel className="h-9 md:h-10 text-sm md:text-base">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (transactionToDelete) {
                  onDeleteTransaction?.(transactionToDelete);
                  setDeleteDialogOpen(false);
                  setTransactionToDelete(null);
                  toast({
                    title: "Deleted",
                    description: "Expense transaction has been deleted.",
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 md:h-10 text-sm md:text-base"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}