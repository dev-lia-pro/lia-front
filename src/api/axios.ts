import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { useAuthStore } from '../stores/authStore';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
});

apiClient.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis le localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si l'erreur est 401 (non autorisé), déconnecter l'utilisateur
    if (error.response?.status === 401) {
      // Nettoyer complètement l'état d'authentification
      const authStore = useAuthStore.getState();
      authStore.logout();
      
      // Ne rediriger que si on n'est pas déjà sur la page de login
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/step1';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
