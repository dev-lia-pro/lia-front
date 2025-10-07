import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import type { Message, Channel, MessageFilters } from './useMessages';

export interface MessageThread {
  thread_id: string;
  thread_subject: string;
  channel: Channel;
  message_count: number;
  last_message_date: string;
  last_message: Message;
}

export interface ThreadsResponse {
  count: number;
  results: MessageThread[];
}

const THREADS_KEY = 'message-threads';

export const useMessageThreads = (filters?: MessageFilters) => {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [THREADS_KEY, filters],
    queryFn: async (): Promise<ThreadsResponse> => {
      const params = new URLSearchParams();
      if (filters?.project) params.append('project', String(filters.project));
      if (filters?.channel) params.append('channel', filters.channel);
      if (filters?.tag) params.append('tag', filters.tag);
      const res = await axios.get(`/messages/threads/?${params.toString()}`);
      return res.data;
    },
  });

  const threads = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  return { threads, totalCount, isLoading, isFetching, error, refetch };
};

// Hook pour récupérer tous les messages d'un thread spécifique
export interface ThreadMessagesResponse {
  count: number;
  thread_id: string;
  messages: Message[];
}

export const useThreadMessages = (threadId: string | null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [THREADS_KEY, 'messages', threadId],
    queryFn: async (): Promise<ThreadMessagesResponse> => {
      if (!threadId) throw new Error('Thread ID is required');
      const res = await axios.get(`/messages/threads/${encodeURIComponent(threadId)}/`);
      return res.data;
    },
    enabled: !!threadId, // Ne lance la requête que si threadId est défini
  });

  const messages = data?.messages ?? [];
  const count = data?.count ?? 0;

  return { messages, count, isLoading, error, refetch };
};
