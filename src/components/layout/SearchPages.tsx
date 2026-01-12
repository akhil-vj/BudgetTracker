import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PageItem {
  id: string;
  name: string;
  icon: string;
  category?: string;
  tabId?: string;
}

interface SearchPagesProps {
  pages: PageItem[];
  onSelectPage: (pageId: string, tabId?: string) => void;
  placeholder?: string;
}

export function SearchPages({ pages, onSelectPage, placeholder = "Search pages..." }: SearchPagesProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredPages = useMemo(() => {
    if (!searchValue.trim()) return [];
    
    const query = searchValue.toLowerCase();
    return pages.filter(page =>
      page.name.toLowerCase().startsWith(query) ||
      page.name.toLowerCase().includes(query)
    ).slice(0, 8); // Limit to 8 suggestions
  }, [searchValue, pages]);

  const handleSelect = (page: PageItem) => {
    onSelectPage(page.id, page.tabId);
    setSearchValue('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchValue('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-64">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 pr-9 bg-secondary/50 border-border/50 focus:bg-secondary"
        />
        {searchValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && filteredPages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50"
          >
            <div className="py-2">
              {filteredPages.map((page, index) => (
                <button
                  key={`${page.id}-${page.tabId || ''}`}
                  onClick={() => handleSelect(page)}
                  className={cn(
                    "w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-3",
                    "hover:bg-accent hover:text-accent-foreground",
                    index === 0 && "bg-accent/50"
                  )}
                >
                  <span className="text-base">{page.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">{page.name}</p>
                    {page.category && (
                      <p className="text-xs text-muted-foreground truncate">{page.category}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && searchValue && filteredPages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50 p-4 text-center"
        >
          <p className="text-sm text-muted-foreground">No pages found</p>
        </motion.div>
      )}
    </div>
  );
}
