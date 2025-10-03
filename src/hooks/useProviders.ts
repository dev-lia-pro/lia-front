import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/api/axios';
import type { 
  Provider, 
  ProviderCreate, 
  ProviderUpdate, 
  ProviderTypeInfo, 
  TestConnectionResult 
} from '@/types/provider';

export const useProviders = () => {
  const queryClient = useQueryClient();

  // Fonction helper pour invalider tous les caches de données dépendantes des providers
  const invalidateProviderData = () => {
    queryClient.invalidateQueries({ queryKey: ['providers'] });
    queryClient.invalidateQueries({ queryKey: ['messages'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['contact-duplicates'] });
    queryClient.invalidateQueries({ queryKey: ['contact-statistics'] });
  };

  // Récupérer les providers avec TanStack Query
  const {
    data: providersData,
    isLoading: loading,
    error,
    refetch: fetchProviders
  } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await axios.get('/providers/');
      console.log('Providers response:', response.data);
      // L'API retourne {count, results} - on extrait results
      return response.data.results || [];
    }
  });

  // Extraire les providers de la réponse
  const providers = providersData || [];

  // Récupérer les types disponibles avec TanStack Query
  const {
    data: types = []
  } = useQuery({
    queryKey: ['provider-types'],
    queryFn: async () => {
      console.log('Fetching provider types...');
      const response = await axios.get('/providers/types_available/');
      console.log('Types response:', response.data);
      return response.data.types;
    }
  });

  // Créer un provider avec TanStack Query
  const createProviderMutation = useMutation({
    mutationFn: async (providerData: ProviderCreate): Promise<Provider> => {
      const response = await axios.post('/providers/', providerData);
      return response.data;
    },
    onSuccess: (newProvider) => {
      // Invalider tous les caches de données dépendantes
      invalidateProviderData();
    },
    onError: (error: unknown) => {
      console.error('Erreur lors de la création du provider:', error);
    }
  });

  // Mettre à jour un provider avec TanStack Query
  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProviderUpdate }): Promise<Provider> => {
      const response = await axios.patch(`/providers/${id}/`, data);
      return response.data;
    },
    onSuccess: (updatedProvider) => {
      // Invalider et rafraîchir la liste des providers
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (error: unknown) => {
      console.error('Erreur lors de la mise à jour du provider:', error);
    }
  });

  // Supprimer un provider avec TanStack Query
  const deleteProviderMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await axios.delete(`/providers/${id}/`);
    },
    onSuccess: () => {
      // Invalider tous les caches de données dépendantes
      invalidateProviderData();
    },
    onError: (error: unknown) => {
      console.error('Erreur lors de la suppression du provider:', error);
    }
  });

  // Tester la connexion d'un provider
  const testConnection = async (id: number): Promise<TestConnectionResult | null> => {
    try {
      const response = await axios.post(`/providers/${id}/test_connection/`);
      return response.data;
    } catch (err: unknown) {
      let errorMessage = 'Erreur lors du test de connexion';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        errorMessage = axiosError.response?.data?.error || errorMessage;
      }
      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    }
  };

  // Fonctions wrapper pour la compatibilité
  const createProvider = async (providerData: ProviderCreate): Promise<Provider | null> => {
    try {
      const result = await createProviderMutation.mutateAsync(providerData);
      return result;
    } catch (error) {
      return null;
    }
  };

  const updateProvider = async (id: number, providerData: ProviderUpdate): Promise<Provider | null> => {
    try {
      const result = await updateProviderMutation.mutateAsync({ id, data: providerData });
      return result;
    } catch (error) {
      return null;
    }
  };

  const deleteProvider = async (id: number): Promise<boolean> => {
    try {
      await deleteProviderMutation.mutateAsync(id);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Fonction pour rafraîchir les providers et retourner la liste mise à jour
  const refreshProviders = async (): Promise<Provider[]> => {
    try {
      // Utiliser directement refetch() de useQuery
      const result = await fetchProviders();
      // result.data contient les providers mis à jour
      return (result.data as Provider[]) || [];
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      return [];
    }
  };

  return {
    providers,
    types,
    loading,
    error: error?.message || null,
    fetchProviders,
    fetchTypes: () => queryClient.invalidateQueries({ queryKey: ['provider-types'] }),
    createProvider,
    updateProvider,
    deleteProvider,
    testConnection,
    clearError: () => {
      // Avec TanStack Query, on ne peut pas "nettoyer" l'erreur directement
      // L'erreur sera automatiquement gérée par le hook
    },
    // Exposer les mutations pour utiliser mutateAsync
    createProviderMutation,
    updateProviderMutation,
    deleteProviderMutation,
    refreshProvidersMutation: undefined, // Supprimer la mutation de rafraîchissement
    // Exposer la fonction de rafraîchissement
    refreshProviders,
    // Exposer la fonction d'invalidation des caches
    invalidateProviderData
  };
};
