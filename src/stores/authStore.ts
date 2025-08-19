import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthState {
  // État
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  
  // Actions
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  clearAuth: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // État initial
      isAuthenticated: false,
      user: null,
      accessToken: null,

      // Actions
      setToken: (token: string) => {
        localStorage.setItem('access_token', token);
        set({ accessToken: token, isAuthenticated: true });
      },

      setUser: (user: User) => {
        set({ user });
      },

      login: (token: string, user: User) => {
        localStorage.setItem('access_token', token);
        set({
          accessToken: token,
          user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        });
        // Nettoyer le localStorage
        localStorage.removeItem('access_token');
      },

      clearAuth: () => {
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        });
      },

      initializeAuth: () => {
        const token = localStorage.getItem('access_token');
        if (token) {
          set({ accessToken: token, isAuthenticated: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 