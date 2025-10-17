import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/api/axios';

export interface ConversationMessage {
  id: number;
  message_type: 'user_request' | 'assistant_response';
  content: string;
  is_audio?: boolean;
  audio_file?: string;
  audio_url?: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  message_count?: number;
  last_message?: {
    content: string;
    created_at: string;
    message_type: string;
  };
}

export interface ConversationDetail extends Conversation {
  messages: ConversationMessage[];
}

// Hook pour récupérer la liste des conversations
export const useConversations = () => {
  const { data: conversations = [], isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await axios.get('/conversations/');
      return response.data.results || response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    conversations,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};

// Hook pour récupérer une conversation spécifique avec ses messages
export const useConversation = (conversationId: number | null) => {
  const { data: conversation, isLoading, error, refetch } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const response = await axios.get(`/conversations/${conversationId}/`);
      return response.data;
    },
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000, // 10 seconds
  });

  return {
    conversation: conversation as ConversationDetail | null,
    isLoading,
    error,
    refetch,
  };
};

// Hook pour créer une nouvelle conversation
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data?: { title?: string }) => {
      const response = await axios.post('/conversations/', data || {});
      return response.data;
    },
    onSuccess: () => {
      // Invalider la liste des conversations pour la rafraîchir
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

// Hook pour envoyer un message dans une conversation
export const useSendMessage = (conversationId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      const response = await axios.post(`/conversations/${conversationId}/send_message/`, {
        message,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalider la conversation pour rafraîchir les messages
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      // Invalider la liste des conversations pour mettre à jour le dernier message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

// Hook pour envoyer un message audio dans une conversation
export const useSendAudioMessage = (conversationId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { audioBlob: Blob; timezone?: string }) => {
      const formData = new FormData();
      formData.append('audio_file', data.audioBlob, 'recording.webm');
      if (data.timezone) {
        formData.append('timezone', data.timezone);
      }

      const response = await axios.post(
        `/conversations/${conversationId}/send_audio_message/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalider la conversation pour rafraîchir les messages
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      // Invalider la liste des conversations pour mettre à jour le dernier message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

// Hook pour supprimer une conversation
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: number) => {
      await axios.delete(`/conversations/${conversationId}/`);
    },
    onSuccess: () => {
      // Invalider la liste des conversations
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
