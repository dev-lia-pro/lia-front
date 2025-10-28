import React, { useState } from 'react';
import { Bell, Loader2, X } from 'lucide-react';
import { useNotifications as useNotificationContext } from '@/contexts/NotificationContext';
import { useNotifications } from '@/hooks/useNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import type { NotificationItem } from '@/hooks/useNotifications';

const ITEMS_PER_PAGE = 20;

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { unreadCount, isConnected } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('unread');
  const [page, setPage] = useState(0);
  const [deletingNotificationId, setDeletingNotificationId] = useState<number | null>(null);

  const {
    notifications,
    totalCount,
    hasNext,
    isLoading,
    isFetching,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAllAsRead,
    isDeletingNotification,
  } = useNotifications({
    is_read: readFilter === 'unread' ? false : undefined,
    limit: ITEMS_PER_PAGE,
    offset: page * ITEMS_PER_PAGE,
  });

  const handleNotificationClick = (notification: NotificationItem) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on related items (priority) or fallback to action URL
    // Frontend controls routing - backend only provides data

    // Handle grouped notifications (multiple messages/tasks/events)
    if (notification.grouped_items && notification.grouped_items.length > 0) {
      const ids = notification.grouped_items.join(',');
      // Determine the type based on notification type or action_url
      if (notification.action_url?.includes('/tasks')) {
        navigate(`/tasks?ids=${ids}`);
      } else if (notification.action_url?.includes('/events')) {
        navigate(`/events?ids=${ids}`);
      } else {
        // Default to messages for NEW_MESSAGE, NEW_SMS, URGENT_MESSAGE types
        navigate(`/messages?ids=${ids}`);
      }
    }
    // Single related items
    else if (notification.related_message) {
      navigate(`/messages?message=${notification.related_message}`);
    } else if (notification.related_task) {
      navigate(`/tasks?task=${notification.related_task}`);
    } else if (notification.related_event) {
      navigate(`/events?event=${notification.related_event}`);
    } else if (notification.action_url) {
      // Fallback for special cases (external links, custom pages)
      navigate(notification.action_url);
    }

    setIsOpen(false);
  };

  const handleLoadMore = () => {
    setPage(page + 1);
  };

  const handleFilterChange = (filter: 'all' | 'unread') => {
    setReadFilter(filter);
    setPage(0); // Reset pagination
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation(); // Prevent notification click
    setDeletingNotificationId(notificationId);
    deleteNotification(notificationId);
  };

  const getNotificationIcon = (icon?: string): string => {
    const iconMap: Record<string, string> = {
      'bell': '🔔',
      'mail': '📧',
      'message-square': '💬',
      'calendar': '📅',
      'check-square': '✅',
      'alert': '⚠️'
    };
    return iconMap[icon || 'bell'] || '🔔';
  };

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'normal':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` - ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 dark:bg-red-600 text-white text-[10px] font-semibold tabular-nums ring-2 ring-background shadow-sm transition-transform hover:scale-110"
              aria-hidden="true"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {isConnected && (
            <span
              className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full animate-pulse"
              aria-label="Connecté en temps réel"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[420px] max-w-[95vw] p-0">
        <DropdownMenuLabel className="flex items-start justify-between pb-2 px-4 pt-3">
          <span className="pt-1">Notifications</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead}
              className="text-xs h-7 -mt-1"
            >
              {isMarkingAllAsRead ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Marquage...
                </>
              ) : (
                'Tout marquer comme lu'
              )}
            </Button>
          )}
        </DropdownMenuLabel>

        {/* Filter Toggle */}
        <div className="px-4 pb-2">
          <div className="flex gap-1 p-0.5 bg-muted rounded-md">
            <Button
              variant={readFilter === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('unread')}
              className="flex-1 h-7 text-xs"
            >
              Non lues
            </Button>
            <Button
              variant={readFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('all')}
              className="flex-1 h-7 text-xs"
            >
              Toutes
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        <ScrollArea className="h-96 w-full">
          {isLoading && page === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : notifications.length > 0 ? (
            <>
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "grid grid-cols-[auto_1fr_auto] items-start gap-3 py-3 px-4 cursor-pointer transition-colors group rounded-none",
                    !notification.is_read
                      ? "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 border-l-4 border-blue-500 pl-[14px]"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <span className="text-xl mt-0.5">
                    {getNotificationIcon(notification.icon)}
                  </span>
                  <div className="min-w-0 overflow-hidden">
                    <p className={cn(
                      "font-semibold text-sm truncate",
                      !notification.is_read && "text-blue-900 dark:text-blue-100",
                      getPriorityColor(notification.priority)
                    )}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 truncate">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-start gap-1">
                    {!notification.is_read && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse shadow-sm shadow-blue-500 mt-1" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletingNotificationId === notification.id && isDeletingNotification}
                      className={cn(
                        "h-7 w-7 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400",
                        notification.is_read
                          ? "opacity-70 group-hover:opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      )}
                      onClick={(e) => handleDeleteNotification(e, notification.id)}
                      aria-label="Supprimer la notification"
                    >
                      {deletingNotificationId === notification.id && isDeletingNotification ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}

              {/* Load More Button */}
              {hasNext && (
                <div className="p-4 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={isFetching}
                    className="w-full text-xs"
                  >
                    {isFetching ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      `Charger plus (${totalCount - notifications.length} restantes)`
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Aucune notification</p>
              <p className="text-xs text-muted-foreground mt-1">
                {readFilter === 'unread' ? 'Vous êtes à jour !' : 'Aucune notification pour le moment'}
              </p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
