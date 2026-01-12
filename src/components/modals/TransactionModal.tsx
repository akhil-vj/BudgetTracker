import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Calendar, CreditCard, Tag, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TransactionType, IncomeCategory, ExpenseCategory, Transaction } from '@/types/finance';
import { incomeCategories, expenseCategories, paymentMethods } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: TransactionType;
    amount: number;
    category: IncomeCategory | ExpenseCategory;
    description: string;
    date: string;
    paymentMethod?: string;
  }) => void;
  editingTransaction?: Transaction | null;
  isLoading?: boolean;
}

export function TransactionModal({ isOpen, onClose, onSubmit, editingTransaction, isLoading = false }: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!editingTransaction;

  // Populate form when editing
  useEffect(() => {
    if (editingTransaction && isOpen) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod || '');
    } else if (!isOpen) {
      // Reset form when modal closes
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('');
    }
  }, [editingTransaction, isOpen]);

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!category) {
      newErrors.category = 'Category is required';
    }
    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      type,
      amount: parseFloat(amount),
      category: category as IncomeCategory | ExpenseCategory,
      description,
      date,
      paymentMethod: type === 'expense' ? paymentMethod : undefined,
    });

    // Reset form
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md mx-4 glass-card-elevated p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {isEditing ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Type Toggle */}
            <div className="flex gap-2 mb-6 p-1 bg-secondary/50 rounded-lg">
              <button
                type="button"
                onClick={() => setType('income')}
                disabled={isEditing}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all",
                  isEditing ? "opacity-50 cursor-not-allowed" : "",
                  type === 'income'
                    ? "bg-income text-income-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Plus className="w-4 h-4" />
                Income
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                disabled={isEditing}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all",
                  isEditing ? "opacity-50 cursor-not-allowed" : "",
                  type === 'expense'
                    ? "bg-expense text-expense-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Minus className="w-4 h-4" />
                Expense
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errors.amount) setErrors({ ...errors, amount: '' });
                    }}
                    className={cn("pl-8 text-lg font-semibold", errors.amount && "border-red-500")}
                    step="0.01"
                    min="0"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Category
                </Label>
                {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                <Select value={category} onValueChange={(val) => {
                  setCategory(val);
                  if (errors.category) setErrors({ ...errors, category: '' });
                }} disabled={isLoading}>
                  <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </Label>
                {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (errors.date) setErrors({ ...errors, date: '' });
                  }}
                  disabled={isLoading}
                  className={errors.date ? "border-red-500" : ""}
                />
              </div>

              {/* Payment Method (Expense only) */}
              {type === 'expense' && (
                <div className="space-y-2">
                  <Label htmlFor="payment" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Method
                  </Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="What was this for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant={type === 'income' ? 'income' : 'expense'} 
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : (isEditing ? 'Update' : 'Add')} {type === 'income' ? 'Income' : 'Expense'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
