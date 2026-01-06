import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Settings,
  Trash2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { formatDateShort } from '@/lib/date';
import { EmptyState } from '@/components/ui/empty-state';
import { useAlerts } from '@/hooks/useAlerts';
import { usePreferences } from '@/contexts/PreferencesContext';

interface AlertsPageProps {
  onNavigateToAlerts?: () => void;
}

export function AlertsPage({}: AlertsPageProps) {
  const { preferences } = usePreferences();
  const { alerts, isLoading, unreadCount, markAsRead, deleteAlert, markAllAsRead, clearAll } = useAlerts();
  const [showRead, setShowRead] = useState(true);

  const filteredAlerts = showRead ? alerts : alerts.filter((a) => !a.read);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-warning" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-income" />;
      case 'reminder':
        return <Bell className="w-4 h-4 md:w-5 md:h-5 text-primary" />;
      default:
        return <Info className="w-4 h-4 md:w-5 md:h-5 text-primary" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-card"
        >
          <EmptyState
            icon={Bell}
            title="No alerts yet"
            description="Alerts will appear here when you have budget warnings, reminders, or other important notifications"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col gap-3 md:gap-0"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Alerts & Notifications</h2>
          <label className="flex md:hidden items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={showRead} onCheckedChange={setShowRead} />
            <span className="whitespace-nowrap">Show read</span>
          </label>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground">{unreadCount} unread notifications</p>
        <div className="hidden md:flex items-center gap-2 md:gap-3 mt-3">
          <label className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <Switch checked={showRead} onCheckedChange={setShowRead} />
            <span className="whitespace-nowrap">Show read</span>
          </label>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => markAllAsRead()}
              className="h-8 md:h-9 text-xs md:text-sm whitespace-nowrap"
            >
              Mark all read
            </Button>
          )}
        </div>
      </motion.div>

      {/* Alerts List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-3 md:p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-base md:text-lg font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => markAllAsRead()}
              className="h-8 md:h-9 text-xs md:text-sm whitespace-nowrap"
            >
              Mark all read
            </Button>
          )}
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-6 md:p-8 text-center text-sm md:text-base text-muted-foreground">
            {showRead ? 'No alerts yet' : 'No unread alerts'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ delay: 0.05 }}
                className={cn(
                  'p-3 md:p-4 hover:bg-secondary/30 transition-colors relative',
                  !alert.read && 'bg-primary/5'
                )}
              >
                {!alert.read && (
                  <div className="absolute left-0.5 md:left-1 top-1/2 -translate-y-1/2 w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-primary" />
                )}

                <div className="flex items-start gap-2 md:gap-4">
                  <div className="mt-0.5 md:mt-1 shrink-0">{getAlertIcon(alert.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm md:text-base font-semibold',
                            !alert.read ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {alert.title}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground/70 mt-1.5 md:mt-2">
                      {formatDateShort(alert.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 shrink-0">
                    {!alert.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                        className="text-xs h-7 px-2 md:h-8 md:px-3 whitespace-nowrap"
                      >
                        <span className="hidden sm:inline">Mark read</span>
                        <span className="sm:hidden">Read</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAlert(alert.id)}
                      className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-expense"
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {alerts.length > 0 && (
        <div className="flex justify-center">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => clearAll()}
            className="h-8 md:h-9 text-xs md:text-sm"
          >
            Clear All Alerts
          </Button>
        </div>
      )}
    </div>
  );
}