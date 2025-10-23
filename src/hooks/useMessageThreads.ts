import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import type { Message, Channel, MessageFilters } from './useMessages';

export interface MessageThread {
  thread_id: string;
  thread_subject: string;
  channel: Channel;
  message_count: number;
  hidden_count?: number;
  last_message_date: string;
  last_message: Message;
}

export interface ThreadsResponse {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: MessageThread[];
}

const THREADS_KEY = 'message-threads';

export const useMessageThreads = (filters?: MessageFilters, options?: { enabled?: boolean }) => {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [THREADS_KEY, filters],
    queryFn: async (): Promise<ThreadsResponse> => {
      const params = new URLSearchParams();
      if (filters?.project) params.append('project', String(filters.project));
      if (filters?.channel) params.append('channel', filters.channel);
      if (filters?.tag) params.append('tag', filters.tag);
      if (filters?.ids) params.append('ids', filters.ids);
      if (filters?.showHidden) params.append('show_hidden', 'true');
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.pageSize) params.append('page_size', String(filters.pageSize));
      const res = await axios.get(`/messages/threads/?${params.toString()}`);
      return res.data;
    },
    enabled: options?.enabled ?? true,
  });

  const threads = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const nextPage = data?.next;
  const previousPage = data?.previous;

  return { threads, totalCount, nextPage, previousPage, isLoading, isFetching, error, refetch };
};

// Hook pour récupérer tous les messages d'un thread spécifique
export interface ThreadMessagesResponse {
  count: number;
  thread_id: string;
  messages: Message[];
}

export const useThreadMessages = (threadId: string | null, showHidden: boolean = false) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [THREADS_KEY, 'messages', threadId, showHidden],
    queryFn: async (): Promise<ThreadMessagesResponse> => {
      if (!threadId) throw new Error('Thread ID is required');
      const params = new URLSearchParams();
      params.append('thread_id', threadId);
      if (showHidden) params.append('show_hidden', 'true');
      const res = await axios.get(`/messages/thread-details/?${params.toString()}`);
      return res.data;
    },
    enabled: !!threadId, // Ne lance la requête que si threadId est défini
  });

  const messages = data?.messages ?? [];
  const count = data?.count ?? 0;

  return { messages, count, isLoading, error, refetch };
};
