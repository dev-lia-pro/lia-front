import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  related_message?: number;
  related_task?: number;
  related_event?: number;
  payload?: any;
  action_url?: string;
  icon?: string;
  priority?: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  connect: () => void;
  disconnect: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const { accessToken: token, isAuthenticated } = useAuthStore();

  const connect = useCallback(() => {
    if (!isAuthenticated || !token) {
      console.log('Not authenticated, skipping WebSocket connection');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsHost = import.meta.env.VITE_WS_URL || window.location.host;
      const wsUrl = `${wsProtocol}://${wsHost}/ws/notifications/?token=${token}`;

      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          switch (data.type) {
            case 'initial':
              setUnreadCount(data.unread_count || 0);
              break;

            case 'notification':
              const notification = data.notification;
              setNotifications(prev => [notification, ...prev]);
              setUnreadCount(prev => prev + 1);

              // Show toast notification
              showToastNotification(notification);
              break;

            case 'marked_read':
              setNotifications(prev =>
                prev.map(n =>
                  n.id === data.notification_id ? { ...n, is_read: true } : n
                )
              );
              setUnreadCount(prev => Math.max(0, prev - 1));
              break;

            case 'all_marked_read':
              setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
              setUnreadCount(0);
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Reconnect with exponential backoff
        if (isAuthenticated) {
          const attempts = reconnectAttemptsRef.current;
          const delay = Math.min(1000 * Math.pow(2, attempts), 30000);

          console.log(`Reconnecting in ${delay}ms (attempt ${attempts + 1})`);

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsConnected(false);
    }
  }, [token, isAuthenticated]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  const markAsRead = useCallback((notificationId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mark_read',
        notification_id: notificationId
      }));
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mark_all_read'
      }));
    }
  }, []);

  const showToastNotification = (notification: Notification) => {
    const iconMap: Record<string, string> = {
      'bell': '🔔',
      'mail': '📧',
      'message-square': '💬',
      'calendar': '📅',
      'check-square': '✅',
      'alert': '⚠️'
    };

    const icon = iconMap[notification.icon || 'bell'] || '🔔';

    // Determine toast type based on priority
    const toastType = notification.priority === 'urgent' ? 'error' :
                     notification.priority === 'high' ? 'warning' :
                     'info';

    const toastMessage = (
      <div className="flex items-start gap-2">
        <span className="text-lg">{icon}</span>
        <div className="flex-1">
          <p className="font-semibold">{notification.title}</p>
          {notification.message && (
            <p className="text-sm opacity-90 mt-1 line-clamp-2">
              {notification.message}
            </p>
          )}
        </div>
      </div>
    );

    if (toastType === 'error') {
      toast.error(toastMessage, {
        duration: 8000,
        action: notification.action_url ? {
          label: 'Voir',
          onClick: () => window.location.href = notification.action_url!
        } : undefined
      });
    } else if (toastType === 'warning') {
      toast.warning(toastMessage, {
        duration: 6000,
        action: notification.action_url ? {
          label: 'Voir',
          onClick: () => window.location.href = notification.action_url!
        } : undefined
      });
    } else {
      toast.info(toastMessage, {
        duration: 5000,
        action: notification.action_url ? {
          label: 'Voir',
          onClick: () => window.location.href = notification.action_url!
        } : undefined
      });
    }
  };

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        connect,
        disconnect
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};