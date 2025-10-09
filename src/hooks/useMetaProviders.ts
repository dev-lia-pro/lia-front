import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { metaProvidersApi } from '@/api/metaProviders';
import type {
  StartCategoryOAuth,
  UpdateCategoryPermissions,
  AppleAuth,
  MetaProviderUpdate,
  CategoryType,
} from '@/types/meta-provider';
import { useToast } from './use-toast';

export const useMetaProviders = (params?: { category?: CategoryType; active?: boolean }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query: Liste des MetaProviders
  const {
    data: metaProviders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['metaProviders', params],
    queryFn: async () => {
      const response = await metaProvidersApi.getAll(params);
      return response.results || [];
    },
  });

  // Query: Détails d'un MetaProvider
  const useMetaProvider = (id: number | null) =>
    useQuery({
      queryKey: ['metaProvider', id],
      queryFn: () => metaProvidersApi.getById(id!),
      enabled: id !== null,
    });

  // Mutation: Démarrer OAuth
  const startOAuthMutation = useMutation({
    mutationFn: (payload: StartCategoryOAuth) => metaProvidersApi.startOAuth(payload),
    onSuccess: (data) => {
      // Ouvrir popup OAuth
      const width = 600;
      const height = 700;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;

      const authWindow = window.open(
        data.auth_url,
        'oauthWindow',
        `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no`
      );

      if (!authWindow || authWindow.closed) {
        toast({
          title: 'Popup bloquée',
          description: 'Veuillez autoriser les popups pour ce site.',
          variant: 'destructive',
        });
        return;
      }

      // Surveiller la fermeture de la popup
      const checkInterval = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkInterval);
          // Rafraîchir les données après OAuth
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['metaProviders'] });
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            toast({
              title: 'Connexion réussie',
              description: 'Vos services ont été ajoutés avec succès.',
            });
          }, 2000);
        }
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur OAuth',
        description: error?.response?.data?.error || 'Une erreur est survenue',
        variant: 'destructive',
      });
    },
  });

  // Mutation: Authentification Apple
  const appleAuthMutation = useMutation({
    mutationFn: (payload: AppleAuth) => metaProvidersApi.appleAuth(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metaProviders'] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast({
        title: 'Connexion réussie',
        description: 'Vos services Apple ont été ajoutés avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur Apple',
        description: error?.response?.data?.error || 'Une erreur est survenue',
        variant: 'destructive',
      });
    },
  });

  // Mutation: Mettre à jour un MetaProvider
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MetaProviderUpdate }) =>
      metaProvidersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metaProviders'] });
      toast({
        title: 'Mis à jour',
        description: 'Le compte a été modifié avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error?.response?.data?.error || 'Une erreur est survenue',
        variant: 'destructive',
      });
    },
  });

  // Mutation: Modifier permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCategoryPermissions }) =>
      metaProvidersApi.updatePermissions(id, payload),
    onSuccess: (data) => {
      // Si mise à jour directe (seuls les noms ont changé) → pas d'OAuth
      if (data.direct_update) {
        queryClient.invalidateQueries({ queryKey: ['metaProviders'] });
        queryClient.invalidateQueries({ queryKey: ['providers'] });
        toast({
          title: 'Mise à jour réussie',
          description: data.message || 'Les services ont été mis à jour avec succès.',
        });
        return;
      }

      // Sinon → Ouvrir popup OAuth pour re-autoriser
      const authWindow = window.open(
        data.auth_url,
        'oauthWindow',
        'width=600,height=700,toolbar=no,menubar=no'
      );

      if (!authWindow || authWindow.closed) {
        toast({
          title: 'Popup bloquée',
          description: 'Veuillez autoriser les popups pour continuer.',
          variant: 'destructive',
        });
        return;
      }

      // Afficher un message informatif pendant l'OAuth
      toast({
        title: 'Autorisation requise',
        description: 'Veuillez autoriser les nouvelles permissions dans la fenêtre qui vient de s\'ouvrir.',
      });

      const checkInterval = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkInterval);
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['metaProviders'] });
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            toast({
              title: 'Permissions mises à jour',
              description: 'Les services ont été modifiés avec succès.',
            });
          }, 2000);
        }
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error?.response?.data?.error || 'Impossible de modifier les permissions',
        variant: 'destructive',
      });
    },
  });

  // Mutation: Supprimer un MetaProvider
  const deleteMutation = useMutation({
    mutationFn: (id: number) => metaProvidersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metaProviders'] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast({
        title: 'Supprimé',
        description: 'Le compte et tous ses services ont été supprimés.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error?.response?.data?.error || 'Une erreur est survenue',
        variant: 'destructive',
      });
    },
  });

  // Mutation: Toggle actif/inactif
  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => metaProvidersApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metaProviders'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error?.response?.data?.error || 'Une erreur est survenue',
        variant: 'destructive',
      });
    },
  });

  return {
    metaProviders,
    isLoading,
    error,
    refetch,
    useMetaProvider,
    startOAuth: startOAuthMutation.mutate,
    appleAuth: appleAuthMutation.mutate,
    update: updateMutation.mutate,
    updatePermissions: updatePermissionsMutation.mutate,
    deleteMetaProvider: deleteMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,
    isStartingOAuth: startOAuthMutation.isPending,
    isAppleAuth: appleAuthMutation.isPending,
    isUpdating: updateMutation.isPending || updatePermissionsMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
