import { useState } from 'react';
import apiClient from '@/api/axios';

interface SubscriptionResponse {
  url: string;
}

interface CancelSubscriptionResponse {
  message: string;
}

export const useBilling = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Créer une session de checkout Stripe et rediriger l'utilisateur
   */
  const createSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Creating Stripe checkout session...');

      const response = await apiClient.get<SubscriptionResponse>('/billing/create_subscription/');
      console.log('Checkout session created:', response.data);

      // Redirection vers Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('URL de redirection manquante');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; detail?: string } } };
      console.error('Error creating subscription:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Erreur lors de la création de l\'abonnement';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Annuler l'abonnement actuel (conservation jusqu'à la fin de période)
   */
  const cancelSubscription = async (): Promise<CancelSubscriptionResponse> => {
    try {
      setLoading(true);
      setError(null);
      console.log('Cancelling subscription...');

      const response = await apiClient.get<CancelSubscriptionResponse>('/billing/cancel_subscription/');
      console.log('Subscription cancelled:', response.data);

      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; detail?: string } } };
      console.error('Error cancelling subscription:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Erreur lors de l\'annulation de l\'abonnement';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Réactiver un abonnement marqué pour annulation
   */
  const reactivateSubscription = async (): Promise<{ status: string }> => {
    try {
      setLoading(true);
      setError(null);
      console.log('Reactivating subscription...');

      const response = await apiClient.get<{ status: string }>('/billing/reactivate_subscription/');
      console.log('Subscription reactivated:', response.data);

      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; detail?: string } } };
      console.error('Error reactivating subscription:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Erreur lors de la réactivation de l\'abonnement';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createSubscription,
    cancelSubscription,
    reactivateSubscription,
    loading,
    error,
  };
};
