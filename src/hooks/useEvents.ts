import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/api/axios';

export interface Event {
  id: number;
  title: string;
  location?: string;
  starts_at: string;
  ends_at: string;
  is_all_day: boolean;
  provider: number | null;  // Now it's the provider ID
  provider_type?: string;  // The actual provider type string
  external_id?: string;
  attendees: string[];  // Always an array of email strings
  provider_metadata?: {  // Provider-specific metadata (Outlook, Google, etc.)
    organizer?: string;
    attendee_details?: Array<{
      email: string;
      name: string;
      status: string;
      type: string;
    }>;
    categories?: string[];
    importance?: string;
    is_cancelled?: boolean;
    is_online_meeting?: boolean;
    online_meeting_url?: string;
    response_status?: string;
    sensitivity?: string;
    show_as?: string;
    recurrence?: any;
    series_master_id?: string;
  };
  project?: number;
  sync_status?: 'PENDING' | 'SYNCED' | 'FAILED';
  synced_at?: string;
  sync_error?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  title: string;
  location?: string;
  starts_at: string;
  ends_at: string;
  is_all_day?: boolean;
  provider?: number;  // ID du provider (optionnel)
  external_id?: string;
  attendees?: string[];
  project?: number;
}

export interface UpdateEventData {
  id: number;
  title?: string;
  location?: string;
  starts_at?: string;
  ends_at?: string;
  is_all_day?: boolean;
  // provider n'est PAS dans UpdateEventData car il est verrouillé après création
  external_id?: string;
  attendees?: string[];
  project?: number | null;
}

export interface EventsFilters {
  project?: number;
  date_from?: string;
  date_to?: string;
  month?: string; // YYYY-MM
  week?: string;  // YYYY-Www
}

export const useEvents = (filters: EventsFilters = {}) => {
  const queryClient = useQueryClient();

  // Construire les paramètres de requête
  const queryParams = new URLSearchParams();
  if (filters.project) queryParams.append('project', filters.project.toString());
  if (filters.date_from) queryParams.append('date_from', filters.date_from);
  if (filters.date_to) queryParams.append('date_to', filters.date_to);
  if (filters.month) queryParams.append('month', filters.month);
  if (filters.week) queryParams.append('week', filters.week);

  const queryString = queryParams.toString();
  const url = `/events/${queryString ? `?${queryString}` : ''}`;

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      const response = await axios.get(url);
      return response.data.results || response.data;
    },
    // Désactiver le rafraîchissement automatique pour éviter les boucles
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    // Garder les données en cache plus longtemps
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
  });

  const createEvent = useMutation({
    mutationFn: async (data: CreateEventData) => {
      const response = await axios.post('/events/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async (data: UpdateEventData) => {
      const { id, ...updateData } = data;
      const response = await axios.patch(`/events/${id}/`, updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: number) => {
      await axios.delete(`/events/${eventId}/`);
      return eventId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
  };
};
