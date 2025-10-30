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
  intendedPlan: string | null; // Plan d'abonnement choisi depuis la landing

  // Actions
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  clearAuth: () => void;
  initializeAuth: () => void;
  setIntendedPlan: (plan: string | null) => void;
  clearIntendedPlan: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // État initial
      isAuthenticated: false,
      user: null,
      accessToken: null,
      intendedPlan: null,

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
          intendedPlan: null,
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
          // Récupérer l'utilisateur temporaire du sessionStorage si disponible
          const tempUser = sessionStorage.getItem('temp_user');
          if (tempUser) {
            try {
              const user = JSON.parse(tempUser);
              set({ accessToken: token, user, isAuthenticated: true });
              // Nettoyer le sessionStorage
              sessionStorage.removeItem('temp_user');
            } catch (e) {
              set({ accessToken: token, isAuthenticated: true });
            }
          } else {
            set({ accessToken: token, isAuthenticated: true });
          }
        }
      },

      setIntendedPlan: (plan: string | null) => {
        set({ intendedPlan: plan });
      },

      clearIntendedPlan: () => {
        set({ intendedPlan: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        intendedPlan: state.intendedPlan,
      }),
    }
  )
); 