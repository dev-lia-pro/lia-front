import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  related_message?: number;
  related_task?: number;
  related_event?: number;
  action_url?: string;
  icon?: string;
  priority?: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { unreadCount, markAsRead, markAllAsRead, isConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications from API
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await axios.get('/api/notifications/', {
        params: { is_read: false, limit: 20 }
      });
      return response.data.results as NotificationItem[];
    },
    enabled: isOpen,
    refetchInterval: isOpen ? 30000 : false, // Refresh every 30s when open
  });

  // Mark notification as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await axios.post(`/api/notifications/${notificationId}/mark-read/`);
      markAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      // Call all notifications mark-read endpoints
      if (notifications) {
        await Promise.all(
          notifications.filter(n => !n.is_read).map(n =>
            axios.post(`/api/notifications/${n.id}/mark-read/`)
          )
        );
      }
      markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (notification: NotificationItem) => {
    // Mark as read
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }

    // Navigate based on action URL or related items
    if (notification.action_url) {
      navigate(notification.action_url);
    } else if (notification.related_message) {
      navigate(`/messages/${notification.related_message}`);
    } else if (notification.related_task) {
      navigate(`/tasks/${notification.related_task}`);
    } else if (notification.related_event) {
      navigate(`/calendar/events/${notification.related_event}`);
    }

    setIsOpen(false);
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
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} non lues)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {isConnected && (
            <span className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications && notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              className="text-xs"
            >
              Tout marquer comme lu
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex items-start gap-3 p-4 cursor-pointer hover:bg-accent",
                  !notification.is_read && "bg-accent/50"
                )}
              >
                <span className="text-2xl mt-0.5">
                  {getNotificationIcon(notification.icon)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold text-sm", getPriorityColor(notification.priority))}>
                    {notification.title}
                  </p>
                  {notification.message && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: fr
                    })}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="h-2 w-2 bg-blue-500 rounded-full mt-2" />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Aucune notification</p>
              <p className="text-xs text-muted-foreground mt-1">
                Vous êtes à jour !
              </p>
            </div>
          )}
        </ScrollArea>
        {notifications && notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                navigate('/notifications');
                setIsOpen(false);
              }}
              className="text-center justify-center text-sm font-medium"
            >
              Voir toutes les notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};