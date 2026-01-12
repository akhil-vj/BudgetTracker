import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationSheet } from './NotificationSheet';
import { SearchPages, type PageItem } from './SearchPages';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAddTransaction?: () => void;
  onNavigateToAlerts?: () => void;
  onNavigatePage?: (pageId: string, tabId?: string) => void;
  availablePages?: PageItem[];
}

export function Header({ 
  title, 
  subtitle, 
  onAddTransaction, 
  onNavigateToAlerts,
  onNavigatePage,
  availablePages = []
}: HeaderProps) {
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
        {availablePages.length > 0 && onNavigatePage && (
          <div className="hidden md:block">
            <SearchPages
              pages={availablePages}
              onSelectPage={onNavigatePage}
              placeholder="Search pages..."
            />
          </div>
        )}

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