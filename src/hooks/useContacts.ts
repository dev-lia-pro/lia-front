import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { 
  Contact, 
  ContactList, 
  ContactCreate, 
  ContactUpdate, 
  ContactMergeRequest,
  ContactDuplicate,
  ContactStatistics 
} from '../types/contact';

interface ContactsParams {
  search?: string;
  has_email?: boolean;
  has_phone?: boolean;
  is_person?: boolean;
  is_self?: boolean;
  source?: 'LOCAL' | 'GOOGLE';
  has_messages?: boolean;
  has_events?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Hook pour récupérer la liste des contacts
export const useContacts = (params?: ContactsParams) => {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: async () => {
      const response = await axios.get<PaginatedResponse<ContactList>>('/contacts/', { params });
      return response.data;
    },
  });
};

// Hook pour récupérer un contact spécifique
export const useContact = (id: number | undefined) => {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      if (!id) throw new Error('Contact ID is required');
      const response = await axios.get<Contact>(`/contacts/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Hook pour créer un contact
export const useCreateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ContactCreate) => {
      const response = await axios.post<Contact>('/contacts/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

// Hook pour mettre à jour un contact
export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ContactUpdate }) => {
      const response = await axios.patch<Contact>(`/contacts/${id}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', data.id] });
    },
  });
};

// Hook pour supprimer un contact
export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/contacts/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

// Hook pour extraire les contacts depuis les messages
export const useExtractContactsFromMessages = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await axios.post('/contacts/extract_from_messages/');
      return response.data;
    },
    onSuccess: () => {
      // Invalider après un délai pour laisser le temps à la tâche async
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
      }, 2000);
    },
  });
};

// Hook pour détecter les doublons
export const useContactDuplicates = () => {
  return useQuery({
    queryKey: ['contact-duplicates'],
    queryFn: async () => {
      const response = await axios.get<ContactDuplicate[]>('/contacts/duplicates/');
      return response.data;
    },
  });
};

// Hook pour fusionner des contacts
export const useMergeContacts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ContactMergeRequest) => {
      const response = await axios.post<Contact>('/contacts/merge/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-duplicates'] });
    },
  });
};

// Hook pour synchroniser un contact avec Google
export const useSyncContactWithGoogle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contactId: number) => {
      const response = await axios.post(`/contacts/${contactId}/sync_google/`);
      return response.data;
    },
    onSuccess: (_, contactId) => {
      // Invalider après un délai pour laisser le temps à la sync
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      }, 2000);
    },
  });
};

// Hook pour récupérer les statistiques des contacts
export const useContactStatistics = () => {
  return useQuery({
    queryKey: ['contact-statistics'],
    queryFn: async () => {
      const response = await axios.get<ContactStatistics>('/contacts/statistics/');
      return response.data;
    },
  });
};

// Hook pour rechercher des contacts (pour autocomplete)
export const useSearchContacts = (query: string, enabled = true) => {
  return useQuery({
    queryKey: ['contacts-search', query],
    queryFn: async () => {
      const response = await axios.get<PaginatedResponse<ContactList>>('/contacts/', {
        params: { search: query, page_size: 10 }
      });
      return response.data.results;
    },
    enabled: enabled && query.length > 0,
  });
};