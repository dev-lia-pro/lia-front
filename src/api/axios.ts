import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL || 'http://localhost:8000/',
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
    // Si l'erreur est 401 (non autorisé), rediriger vers la page de login
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/auth/step1';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
