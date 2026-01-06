import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotificationSheet } from './NotificationSheet';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAddTransaction?: () => void;
  onNavigateToAlerts?: () => void;
}

export function Header({ title, subtitle, onAddTransaction, onNavigateToAlerts }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40"
    >
      <div className="min-w-0 flex-shrink">
        <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Search - Desktop only */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search transactions..." 
            className="w-64 pl-9 bg-secondary/50 border-border/50 focus:bg-secondary"
          />
        </div>

        {/* Search - Mobile icon button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="md:hidden w-8 h-8 sm:w-9 sm:h-9 p-0"
        >
          <Search className="w-4 h-4" />
        </Button>

        {/* Add Transaction */}
        {onAddTransaction && (
          <Button 
            onClick={onAddTransaction} 
            variant="gradient" 
            size="sm" 
            className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden text-xs">Add</span>
          </Button>
        )}

        {/* Notifications */}
        <NotificationSheet onNavigateToAlerts={onNavigateToAlerts} />
      </div>
    </motion.header>
  );
}