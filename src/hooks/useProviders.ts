import { useState, useEffect, useCallback } from 'react';
import axios from '@/api/axios';
import type { 
  Provider, 
  ProviderCreate, 
  ProviderUpdate, 
  ProviderTypeInfo, 
  TestConnectionResult 
} from '@/types/provider';

export const useProviders = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [types, setTypes] = useState<ProviderTypeInfo[]>([]);
  // Stats supprimées

  // Récupérer la liste des providers
  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/providers/');
      console.log('Providers response:', response.data);
      // S'assurer que providers est un tableau
      const providersData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setProviders(providersData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des providers';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer les types disponibles
  const fetchTypes = useCallback(async () => {
    try {
      console.log('Fetching provider types...');
      const response = await axios.get('/providers/types_available/');
      console.log('Types response:', response.data);
      setTypes(response.data.types);
    } catch (err: unknown) {
      console.error('Erreur lors de la récupération des types:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: unknown };
        console.error('Response:', axiosError.response);
      }
    }
  }, []);

  // fetchStats supprimé

  // Créer un provider
  const createProvider = useCallback(async (providerData: ProviderCreate): Promise<Provider | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('/providers/', providerData);
      const newProvider = response.data;
      setProviders(prev => [newProvider, ...prev]);
      return newProvider;
    } catch (err: unknown) {
      let errorMessage = 'Erreur lors de la création du provider';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour un provider
  const updateProvider = useCallback(async (id: number, providerData: ProviderUpdate): Promise<Provider | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.patch(`/providers/${id}/`, providerData);
      const updatedProvider = response.data;
      setProviders(prev => prev.map(p => p.id === id ? updatedProvider : p));
      return updatedProvider;
    } catch (err: unknown) {
      let errorMessage = 'Erreur lors de la mise à jour du provider';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer un provider
  const deleteProvider = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await axios.delete(`/providers/${id}/`);
      setProviders(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err: unknown) {
      let errorMessage = 'Erreur lors de la suppression du provider';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Tester la connexion d'un provider
  const testConnection = useCallback(async (id: number): Promise<TestConnectionResult | null> => {
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
  }, []);

  // Activer/désactiver un provider
  const toggleProviderActive = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await axios.post(`/providers/${id}/toggle_active/`);
      const updatedProvider = response.data.provider;
      setProviders(prev => prev.map(p => p.id === id ? updatedProvider : p));
      return true;
    } catch (err: unknown) {
      let errorMessage = 'Erreur lors du changement de statut';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialisation
  useEffect(() => {
    fetchProviders();
    fetchTypes();
  }, [fetchProviders, fetchTypes]);

  return {
    providers,
    types,
    // stats supprimées
    loading,
    error,
    fetchProviders,
    fetchTypes,
    // fetchStats supprimé
    createProvider,
    updateProvider,
    deleteProvider,
    testConnection,
    toggleProviderActive,
    clearError: () => setError(null)
  };
};
