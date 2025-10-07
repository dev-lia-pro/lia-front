import { useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useAuthStore } from '@/stores/authStore';

export const usePostHogIdentify = () => {
  const posthog = usePostHog();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Ne pas identifier si PostHog n'est pas activé
    const isPostHogEnabled = import.meta.env.VITE_ENABLE_POSTHOG === 'true';
    if (!isPostHogEnabled || !posthog) {
      return;
    }

    if (isAuthenticated && user) {
      // Identifier l'utilisateur avec ses propriétés
      posthog.identify(
        user.id.toString(), // distinct_id doit être une string
        {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        }
      );
      console.log('PostHog: User identified', user.id);
    } else if (!isAuthenticated) {
      // Réinitialiser PostHog quand l'utilisateur se déconnecte
      posthog.reset();
      console.log('PostHog: User reset');
    }
  }, [isAuthenticated, user, posthog]);
};
