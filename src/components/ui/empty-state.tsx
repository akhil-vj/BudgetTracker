import { motion } from 'framer-motion';
import { LucideIcon, Plus } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2">
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}

interface EmptyChartStateProps {
  title: string;
  description?: string;
  className?: string;
}

export function EmptyChartState({ title, description, className }: EmptyChartStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center h-full text-center py-12",
      className
    )}>
      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
        <div className="w-6 h-6 border-2 border-dashed border-muted-foreground/40 rounded" />
      </div>
      <p className="text-muted-foreground font-medium mb-1">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground/70">{description}</p>
      )}
    </div>
  );
}

interface EmptyPredictionStateProps {
  daysOfData: number;
  minDaysRequired?: number;
  className?: string;
}

export function EmptyPredictionState({ 
  daysOfData, 
  minDaysRequired = 30,
  className 
}: EmptyPredictionStateProps) {
  const percentage = Math.min((daysOfData / minDaysRequired) * 100, 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
        <svg className="w-16 h-16 absolute" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeDasharray={`${percentage * 2.83} 283`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <span className="text-sm font-bold text-primary">{Math.round(percentage)}%</span>
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {daysOfData === 0 
          ? "No data yet" 
          : `${daysOfData} days of data collected`}
      </h3>
      <p className="text-muted-foreground max-w-sm mb-4">
        {daysOfData === 0 
          ? "Start adding expenses to unlock AI-powered predictions"
          : daysOfData < minDaysRequired 
            ? `Need at least ${minDaysRequired} days of expense data for accurate predictions. Keep tracking!`
            : "Your predictions are ready!"}
      </p>
      
      {daysOfData > 0 && daysOfData < minDaysRequired && (
        <div className="w-full max-w-xs bg-muted/30 rounded-full h-2">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}
