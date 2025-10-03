import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/api/axios';

export interface NotificationItem {
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

export interface UseNotificationsFilters {
  is_read?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NotificationItem[];
}

export function useNotifications(filters: UseNotificationsFilters = {}) {
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['notifications', filters],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (filters.is_read !== undefined) params.is_read = filters.is_read;
      if (filters.type) params.type = filters.type;
      if (filters.limit) params.limit = filters.limit;
      if (filters.offset) params.offset = filters.offset;

      const response = await axios.get<NotificationsResponse>('/notifications/', { params });
      return response.data;
    },
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await axios.post(`/notifications/${notificationId}/mark-read/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // Use dedicated endpoint to mark ALL user notifications as read
      await axios.post('/notifications/mark-all-read/');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: data?.results || [],
    totalCount: data?.count || 0,
    hasNext: !!data?.next,
    hasPrevious: !!data?.previous,
    isLoading,
    isFetching,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}
