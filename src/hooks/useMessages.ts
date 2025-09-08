import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';

export interface Attachment {
  id: number;
  filename: string;
  content_type?: string;
  size_bytes: number;
  url?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  google_drive_file_id?: string | null;
  google_drive_backup?: boolean;
}

export type Channel = 'EMAIL' | 'SMS' | 'WHATSAPP';

export interface Message {
  id: number;
  user: number;
  project?: number | null;
  channel: Channel;
  external_id: string;
  subject: string;
  sender: string;
  recipients: string[];
  body_text: string;
  body_html: string;
  received_at: string;
  tags: string[];
  action_expected: 'NONE' | 'REPLY' | 'SIGN' | 'PLAN' | 'INFO' | 'URGENT';
  attachments_count: number;
  attachments?: Attachment[];
  raw_headers?: Record<string, string>;
  ingestion_source?: string;
  created_at: string;
  updated_at: string;
  // Relations avec les contacts
  sender_contact?: {
    id: number;
    display_name: string;
    avatar_url?: string;
  } | null;
  recipient_contacts?: {
    id: number;
    display_name: string;
    avatar_url?: string;
  }[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface MessageFilters {
  project?: number;
  channel?: Channel;
  tag?: string;
  search?: string;
}

const MESSAGES_KEY = 'messages';

export const useMessages = (filters?: MessageFilters) => {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [MESSAGES_KEY, filters],
    queryFn: async (): Promise<PaginatedResponse<Message>> => {
      const params = new URLSearchParams();
      if (filters?.project) params.append('project', String(filters.project));
      if (filters?.channel) params.append('channel', filters.channel);
      if (filters?.tag) params.append('tag', filters.tag);
      if (filters?.search) params.append('search', filters.search);
      const res = await axios.get(`/messages/?${params.toString()}`);
      return res.data;
    },
  });

  const messages = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  return { messages, totalCount, isLoading, isFetching, error, refetch };
};


