import { useQuery } from '@tanstack/react-query';
import axios from '@/api/axios';

export interface Assistant {
  id: number;
  method: string;
  input: Record<string, any>;
  output: Record<string, any>;
  audio_input?: string;
  audio_output?: string;
  error: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssistantFilters {
  method?: string;
  has_audio_input?: boolean;
  has_audio_output?: boolean;
  page?: number;
  pageSize?: number;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Assistant[];
}

export const useAssistants = (filters: AssistantFilters = {}) => {
  // Construire les paramètres de requête
  const queryParams = new URLSearchParams();
  if (filters.method) queryParams.append('method', filters.method);
  if (filters.has_audio_input !== undefined) queryParams.append('has_audio_input', filters.has_audio_input.toString());
  if (filters.has_audio_output !== undefined) queryParams.append('has_audio_output', filters.has_audio_output.toString());
  if (filters.page) queryParams.append('page', String(filters.page));
  if (filters.pageSize) queryParams.append('page_size', String(filters.pageSize));

  const queryString = queryParams.toString();
  const url = `/assistant-run/${queryString ? `?${queryString}` : ''}`;

  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ['assistants', filters],
    queryFn: async () => {
      const response = await axios.get(url);
      return response.data;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const assistants = data?.results || [];
  const totalCount = data?.count || 0;
  const nextPage = data?.next;
  const previousPage = data?.previous;

  return {
    assistants,
    totalCount,
    nextPage,
    previousPage,
    isLoading,
    error,
  };
};
