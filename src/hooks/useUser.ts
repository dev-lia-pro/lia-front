import { useState, useEffect } from 'react';
import apiClient from '@/api/axios';

interface User {
  id: number;
  email?: string;
  phone_number?: string;
  phone_auth: boolean;
  first_name?: string;
  last_name?: string;
  address?: string;
  zip_code?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  subscription: boolean;
  subscription_id: string;
  has_security_code: boolean;
  has_full_profile: boolean;
  timezone?: string;
}

interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  zip_code?: string;
  city?: string;
  country?: string;
  timezone?: string;
}

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Récupérer les données utilisateur
  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching user data...');
      const response = await apiClient.get('/users/');
      console.log('User data response:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data is array:', Array.isArray(response.data));
      console.log('Response data length:', response.data?.length);
      console.log('Results array:', response.data?.results);
      console.log('Results length:', response.data?.results?.length);
      
      // L'API retourne un objet avec une propriété results qui contient l'array des utilisateurs
      if (response.data?.results && Array.isArray(response.data.results) && response.data.results.length > 0) {
        console.log('Setting user to:', response.data.results[0]);
        setUser(response.data.results[0]);
      } else {
        console.log('No user data found in response');
        console.log('Response.data:', response.data);
        setError('Aucun utilisateur trouvé');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      console.error('Error fetching user:', error);
      setError(error.response?.data?.detail || 'Erreur lors de la récupération des données utilisateur');
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour les données utilisateur
  const updateUser = async (userData: UpdateUserData): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setUpdating(true);
      setError(null);
      console.log('Updating user with data:', userData);
      
      const response = await apiClient.patch(`/users/${user.id}/`, userData);
      console.log('Update response:', response.data);
      setUser(response.data);
      
      return true;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      console.error('Error updating user:', error);
      setError(error.response?.data?.detail || 'Erreur lors de la mise à jour du profil');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  // Charger les données utilisateur au montage du composant
  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    loading,
    error,
    updating,
    fetchUser,
    updateUser,
  };
}; 