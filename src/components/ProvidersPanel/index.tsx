import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { MetaProviderCard } from './MetaProviderCard';
import { AddMetaProviderDialog } from './AddMetaProviderDialog';
import { EditMetaProviderDialog } from './EditMetaProviderDialog';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { useMetaProviders } from '@/hooks/useMetaProviders';
import { useProviders } from '@/hooks/useProviders';
import { useToast } from '@/hooks/use-toast';
import axios from '@/api/axios';
import type { MetaProvider, UpdateCategoryPermissions } from '@/types/meta-provider';
import type { Provider } from '@/types/provider';

export const ProvidersPanel: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMetaProvider, setEditingMetaProvider] = useState<MetaProvider | null>(null);
  const [deletingMetaProvider, setDeletingMetaProvider] = useState<MetaProvider | null>(null);
  const [configuringProvider, setConfiguringProvider] = useState<Provider | null>(null);
  const [configJson, setConfigJson] = useState('{}');
  const [configError, setConfigError] = useState('');
  const [syncingProviderId, setSyncingProviderId] = useState<number | null>(null);

  const {
    metaProviders,
    isLoading: isLoadingMeta,
    refetch: refetchMeta,
    startOAuth,
    appleAuth,
    updatePermissions,
    deleteMetaProvider,
    toggleActive,
    isStartingOAuth,
    isAppleAuth,
    isUpdating,
    isStartOAuthSuccess,
    isAppleAuthSuccess,
  } = useMetaProviders();

  const {
    providers,
    updateProvider,
    fetchProviders: refetchProviders,
  } = useProviders();

  // Fermer la dialog après un ajout réussi (Apple, Google, Microsoft)
  useEffect(() => {
    if (isAppleAuthSuccess || isStartOAuthSuccess) {
      setShowAddDialog(false);
    }
  }, [isAppleAuthSuccess, isStartOAuthSuccess]);

  // Enrichir les metaProviders avec leurs providers
  const enrichedMetaProviders = metaProviders.map((mp) => ({
    ...mp,
    providers: providers.filter((p) => p.meta_provider === mp.id),
  }));

  const filteredMetaProviders = enrichedMetaProviders.filter((mp) =>
    mp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSyncProvider = async (provider: Provider) => {
    setSyncingProviderId(provider.id);
    try {
      let url = '';
      if (provider.provider_type === 'GMAIL') {
        url = `/providers/${provider.id}/sync_emails/`;
      } else if (provider.provider_type === 'GOOGLE_CALENDAR' || provider.provider_type === 'OUTLOOK_CALENDAR' || provider.provider_type === 'ICLOUD_CALENDAR') {
        url = `/providers/${provider.id}/sync_calendar/`;
      } else if (provider.provider_type === 'GOOGLE_DRIVE_SMS') {
        url = `/providers/${provider.id}/sync_sms/`;
      } else if (provider.provider_type === 'GOOGLE_CONTACTS' || provider.provider_type === 'OUTLOOK_CONTACTS' || provider.provider_type === 'ICLOUD_CONTACTS') {
        url = `/providers/${provider.id}/sync_contacts/`;
      } else if (provider.provider_type === 'OUTLOOK_MAIL' || provider.provider_type === 'ICLOUD_MAIL') {
        url = `/providers/${provider.id}/sync_emails/`;
      } else if (provider.provider_type === 'GOOGLE_DRIVE') {
        toast({
          title: 'Google Drive configuré',
          description: 'Google Drive est configuré pour le stockage de fichiers.',
        });
        return;
      }

      await axios.post(url, {});
      toast({
        title: 'Synchronisation lancée',
        description: 'Les données vont être synchronisées en arrière-plan.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.response?.data?.error || 'Erreur lors de la synchronisation',
        variant: 'destructive',
      });
    } finally {
      setSyncingProviderId(null);
    }
  };

  const handleConfigureProvider = (provider: Provider) => {
    setConfiguringProvider(provider);
    setConfigJson(JSON.stringify(provider.config || {}, null, 2));
    setConfigError('');
  };

  const handleSaveConfig = async () => {
    if (!configuringProvider || configError) return;

    try {
      const config = JSON.parse(configJson);
      const success = await updateProvider(configuringProvider.id, { config });
      if (success) {
        toast({
          title: 'Configuration mise à jour',
          description: 'Les paramètres ont été enregistrés.',
        });
        setConfiguringProvider(null);
        refetchMeta();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la configuration.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleProviderActive = async (id: number) => {
    const provider = providers.find((p) => p.id === id);
    if (!provider) return;

    const success = await updateProvider(id, { is_active: !provider.is_active });
    if (success) {
      refetchMeta();
      toast({
        title: 'Statut modifié',
        description: 'Le statut du service a été modifié.',
      });
    }
  };

  const handleToggleProviderReadOnly = async (id: number) => {
    try {
      const response = await axios.post(`/providers/${id}/toggle-read-only/`);

      // Cas 1: Mise à jour directe (iCloud) - pas besoin d'OAuth
      if (response.data.success && response.data.direct_update) {
        refetchMeta();
        refetchProviders();
        toast({
          title: 'Mode de synchronisation modifié',
          description: response.data.message || 'Le mode a été modifié avec succès.',
        });
        return;
      }

      // Cas 2: OAuth requis (Google/Microsoft)
      if (response.data.success && response.data.auth_url) {
        const authWindow = window.open(
          response.data.auth_url,
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
              refetchMeta();
              refetchProviders();
              toast({
                title: 'Mode de synchronisation modifié',
                description: 'Les permissions ont été mises à jour avec succès.',
              });
            }, 2000);
          }
        }, 500);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.response?.data?.error || 'Impossible de modifier le mode de synchronisation',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePermissions = (metaProvider: MetaProvider) => {
    // Ouvrir le dialog d'édition
    setEditingMetaProvider(metaProvider);
  };

  const handleSubmitUpdatePermissions = (id: number, payload: UpdateCategoryPermissions) => {
    updatePermissions({ id, payload });
    // Fermer le dialog immédiatement - l'utilisateur verra la popup OAuth
    setEditingMetaProvider(null);
  };

  if (isLoadingMeta) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-foreground/50" />
        <p className="text-foreground/70">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec recherche et bouton ajouter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
          <Input
            placeholder="Rechercher un compte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Ajouter un compte</span>
        </Button>
      </div>

      {/* Liste des MetaProviders */}
      {filteredMetaProviders.length > 0 ? (
        <div className="space-y-4">
          {filteredMetaProviders.map((metaProvider) => (
            <MetaProviderCard
              key={metaProvider.id}
              metaProvider={metaProvider}
              onToggleActive={toggleActive}
              onDelete={setDeletingMetaProvider}
              onUpdatePermissions={handleUpdatePermissions}
              onSyncProvider={handleSyncProvider}
              onConfigureProvider={handleConfigureProvider}
              onToggleProviderActive={handleToggleProviderActive}
              onToggleProviderReadOnly={handleToggleProviderReadOnly}
              syncingProviderId={syncingProviderId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-foreground/70">
            {searchQuery ? 'Aucun compte trouvé' : 'Aucun compte configuré'}
          </p>
        </div>
      )}

      {/* Dialog d'ajout */}
      <AddMetaProviderDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onStartOAuth={startOAuth}
        onAppleAuth={appleAuth}
        isLoading={isStartingOAuth || isAppleAuth}
      />

      {/* Dialog d'édition */}
      <EditMetaProviderDialog
        open={!!editingMetaProvider}
        metaProvider={editingMetaProvider}
        onClose={() => setEditingMetaProvider(null)}
        onUpdatePermissions={handleSubmitUpdatePermissions}
        isLoading={isUpdating}
      />

      {/* Dialog de suppression */}
      <DeleteConfirmModal
        isOpen={!!deletingMetaProvider}
        onClose={() => setDeletingMetaProvider(null)}
        onConfirm={() => {
          if (deletingMetaProvider) {
            deleteMetaProvider(deletingMetaProvider.id);
            setDeletingMetaProvider(null);
          }
        }}
        title="Supprimer le compte"
        description={`Êtes-vous sûr de vouloir supprimer "${deletingMetaProvider?.name}" ? Tous les services et données associés seront supprimés.`}
      />

      {/* Dialog de configuration */}
      <Dialog open={!!configuringProvider} onOpenChange={(open) => {
        if (!open) {
          setConfiguringProvider(null);
          setConfigJson('{}');
          setConfigError('');
        }
      }}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>Configuration de {configuringProvider?.name}</DialogTitle>
            <DialogDescription>Paramètres avancés du service</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-foreground/70 block mb-2">Configuration JSON</label>
              <textarea
                value={configJson}
                onChange={(e) => {
                  setConfigJson(e.target.value);
                  try {
                    JSON.parse(e.target.value);
                    setConfigError('');
                  } catch (err) {
                    setConfigError('JSON invalide');
                  }
                }}
                className="w-full h-64 p-3 bg-background border border-border rounded-md text-foreground font-mono text-sm"
                placeholder='{"folder_name": "SMS", "sync_interval": 600}'
              />
              {configError && <p className="text-red-400 text-xs mt-1">{configError}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfiguringProvider(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveConfig} disabled={!!configError}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
