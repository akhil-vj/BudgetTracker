import { Bell, AlertTriangle, CheckCircle2, Clock, Trash2, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDateShort } from '@/lib/date';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'warning':
      return AlertTriangle;
    case 'success':
      return CheckCircle2;
    case 'reminder':
      return Clock;
    default:
      return Bell;
  }
};

const getAlertColors = (type: string) => {
  switch (type) {
    case 'warning':
      return 'bg-expense/10 text-expense border-expense/20';
    case 'success':
      return 'bg-income/10 text-income border-income/20';
    case 'reminder':
      return 'bg-primary/10 text-primary border-primary/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

interface NotificationSheetProps {
  onNavigateToAlerts?: () => void;
}

export function NotificationSheet({ onNavigateToAlerts }: NotificationSheetProps) {
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    isMarkingAsRead,
    isDeletingNotification,
  } = useNotifications();

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center text-xs font-bold rounded-full shadow-md"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:w-96 flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                disabled={isMarkingAsRead}
                className="text-xs"
              >
                {isMarkingAsRead ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Marking...
                  </>
                ) : (
                  'Mark all read'
                )}
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                No notifications yet. Stay tuned for updates!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = getAlertIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-muted/50 transition-colors relative',
                      !notification.read && 'bg-primary/5'
                    )}
                  >
                    {!notification.read && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border',
                          getAlertColors(notification.type)
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            !notification.read ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {formatDateShort(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => markAsRead(notification.id)}
                            disabled={isMarkingAsRead}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-expense"
                          onClick={() => deleteNotification(notification.id)}
                          disabled={isDeletingNotification}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if (onNavigateToAlerts) {
                onNavigateToAlerts();
              }
            }}
          >
            View All Notifications
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
