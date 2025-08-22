import React, { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PageNavigation } from '@/components/dashboard/PageNavigation';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Trash2, 
  TestTube,
  Power,
  PowerOff,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import type { NavigationTab } from '@/types/navigation';
import type { Provider } from '@/types/provider';
import { useProviders } from '@/hooks/useProviders';
import { ProviderForm } from '@/components/dashboard/ProviderForm';
import { DeleteConfirmModal } from '@/components/dashboard/DeleteConfirmModal';
import { useToast } from '@/hooks/use-toast';
import type { ProviderCreate, ProviderUpdate } from '@/types/provider';
import axios from '@/api/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProjectsGrid } from '@/components/dashboard/ProjectsGrid';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('parametres');
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);
  const [previewProvider, setPreviewProvider] = useState<Provider | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [syncingProvider, setSyncingProvider] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const {
    providers,
    types,
    // stats supprimées
    loading,
    error,
    createProvider,
    updateProvider,
    deleteProvider,
    testConnection,
    toggleProviderActive,
    clearError,
    fetchProviders,
    fetchTypes
  } = useProviders();

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'GMAIL':
        return '📧';
      case 'GOOGLE_CALENDAR':
        return '📅';
      case 'GOOGLE_DRIVE_SMS':
        return '💬';
      default:
        return '🔗';
    }
  };

  const getProviderTypeLabel = (type: string) => {
    switch (type) {
      case 'GMAIL':
        return 'Gmail';
      case 'GOOGLE_CALENDAR':
        return 'Google Calendar';
      case 'GOOGLE_DRIVE_SMS':
        return 'Google Drive SMS';
      default:
        return type;
    }
  };

  const getProviderTypeColor = (type: string) => {
    switch (type) {
      case 'GMAIL':
        return 'text-blue-400';
      case 'GOOGLE_CALENDAR':
        return 'text-purple-400';
      case 'GOOGLE_DRIVE_SMS':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleSubmitProvider = async (data: ProviderCreate | ProviderUpdate): Promise<boolean> => {
    try {
      if (editingProvider) {
        const success = await updateProvider(editingProvider.id, data);
        if (success) {
          toast({
            title: "Provider mis à jour",
            description: "Le provider a été modifié avec succès.",
          });
          setEditingProvider(null);
          // refresh list after update
          fetchProviders();
          return true;
        }
      } else {
        const success = await createProvider(data as ProviderCreate);
        if (success) {
          toast({
            title: "Provider créé",
            description: "Le provider a été ajouté avec succès.",
          });
          setIsAddingProvider(false);
          // refresh list after create
          fetchProviders();
          return true;
        }
      }
      return false;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // Edition désactivée

  const handleDeleteProvider = async (providerId: number) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setDeletingProvider(provider);
    }
  };

  const confirmDelete = async () => {
    if (deletingProvider) {
      const success = await deleteProvider(deletingProvider.id);
      if (success) {
        toast({
          title: "Provider supprimé",
          description: "Le provider a été supprimé avec succès.",
        });
        // refresh list after delete
        fetchProviders();
      }
      setDeletingProvider(null);
    }
  };

  const handleTestConnection = async (providerId: number) => {
    setTestingConnection(providerId);
    try {
      const result = await testConnection(providerId);
      if (result) {
        if (result.success) {
          toast({
            title: "Connexion réussie",
            description: result.message,
          });
        } else {
          toast({
            title: "Échec de la connexion",
            description: result.error || result.message,
            variant: "destructive",
          });
        }
      }
    } finally {
      setTestingConnection(null);
    }
  };

  const handleToggleActive = async (providerId: number) => {
    const success = await toggleProviderActive(providerId);
    if (success) {
      toast({
        title: "Statut modifié",
        description: "Le statut du provider a été modifié.",
      });
      // plus de stats à rafraîchir
    }
  };

  const handleOpenPreview = async (provider: Provider) => {
    // Lance une synchronisation au clic (read-only)
    setSyncingProvider(provider.id);
    try {
      let url = '';
      if (provider.provider_type === 'GMAIL') {
        url = `/providers/${provider.id}/sync_emails/`;
      } else if (provider.provider_type === 'GOOGLE_CALENDAR') {
        url = `/providers/${provider.id}/sync_calendar/`;
      } else if (provider.provider_type === 'GOOGLE_DRIVE_SMS') {
        url = `/providers/${provider.id}/sync_sms/`;
      }
      const { data } = await axios.post(url, {});
      toast({
        title: 'Synchronisation lancée',
        description: typeof data?.status === 'string' ? `Statut: ${data.status}` : 'Les données vont être synchronisées en arrière-plan.',
      });
    } catch (e: unknown) {
      let msg = 'Erreur lors de la synchronisation';
      if (e && typeof e === 'object') {
        const err = e as { response?: { data?: { error?: string } }, message?: string };
        msg = err.response?.data?.error || err.message || msg;
      }
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleCancel = () => {
    setIsAddingProvider(false);
    setEditingProvider(null);
    clearError();
  };

  // Afficher les erreurs du hook
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Erreur",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="min-h-screen bg-navy-deep text-foreground flex flex-col">
      <DashboardHeader />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-6">
          {/* Section Projets */}
          <Card className="bg-navy-card border-border mb-6">
            <CardContent className="pt-6">
              <ProjectsGrid />
            </CardContent>
          </Card>

          {/* Section des providers */}
          <Card className="bg-navy-card border-border mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Fournisseurs de données
                </CardTitle>
                <Button size="sm" onClick={() => setIsAddingProvider(true)} className="h-9 w-9 p-0 border border-gold bg-gold hover:bg-gold/90 text-primary-foreground" aria-label="Ajouter un fournisseur" title="Ajouter un fournisseur">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Statistiques supprimées */}

              {/* Formulaire d'ajout/édition */}
              {(isAddingProvider || editingProvider) && (
                <div className="mb-6 p-4 bg-navy-deep rounded-lg border border-border">
                  <h3 className="text-lg font-medium mb-4 text-foreground">
                    {editingProvider ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                  </h3>
                  <ProviderForm
                    provider={editingProvider}
                    types={types}
                    onSubmit={handleSubmitProvider}
                    onCancel={handleCancel}
                    loading={loading}
                  />
                </div>
              )}

              {/* Liste des providers */}
              <div className="space-y-3">
                {Array.isArray(providers) && providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-4 bg-navy-deep rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg bg-navy-card ${getProviderTypeColor(provider.provider_type)}`}>
                        <span className="text-2xl">{getProviderIcon(provider.provider_type)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{provider.name}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-navy-card text-foreground/70">
                            {getProviderTypeLabel(provider.provider_type)}
                          </span>
                          {provider.is_active ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                              Actif
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">
                              Inactif
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/70">
                          Créé le {new Date(provider.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        {provider.last_sync_at && (
                          <p className="text-xs text-foreground/50">
                            Dernière synchro: {new Date(provider.last_sync_at).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestConnection(provider.id)}
                        disabled={testingConnection === provider.id}
                        className="border-border text-foreground hover:bg-navy-muted"
                      >
                        {testingConnection === provider.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPreview(provider)}
                        className="border-border text-foreground hover:bg-navy-muted"
                        aria-label="Synchroniser"
                      >
                        {syncingProvider === provider.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(provider.id)}
                        className={provider.is_active 
                          ? "border-green-500/30 text-green-400 hover:bg-green-500/10" 
                          : "border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
                        }
                        aria-label={provider.is_active ? 'Désactiver' : 'Activer'}
                      >
                        {provider.is_active ? (
                          <Power className="w-4 h-4" />
                        ) : (
                          <PowerOff className="w-4 h-4" />
                        )}
                      </Button>
                      
                      {/* Bouton d'édition supprimé */}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!Array.isArray(providers) || providers.length === 0) && !loading && (
                  <div className="text-center py-8">
                    <button
                      onClick={() => setIsAddingProvider(true)}
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold border border-gold hover:bg-gold/90 flex items-center justify-center transition-all duration-200 cursor-pointer group active:scale-95"
                      type="button"
                    >
                      <Plus className="w-8 h-8 text-primary-foreground transition-all duration-200" />
                    </button>
                    <p className="text-foreground/70 mb-2">Aucun provider configuré</p>
                    <p className="text-sm text-foreground/50">
                      Ajoutez votre premier provider pour commencer à synchroniser vos données
                    </p>
                  </div>
                )}

                {loading && providers.length === 0 && (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-foreground/50" />
                    <p className="text-foreground/70">Chargement des providers...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section des préférences (mock) */}
          <Card className="bg-navy-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Préférences générales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-foreground font-medium">Notifications push</span>
                    <p className="text-sm text-foreground/70">Recevoir des notifications sur votre appareil</p>
                  </div>
                  <Button variant="outline" disabled className="border-border text-foreground/50">
                    Bientôt disponible
                  </Button>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Modal de confirmation de suppression */}
      <DeleteConfirmModal
        isOpen={!!deletingProvider}
        onClose={() => setDeletingProvider(null)}
        onConfirm={confirmDelete}
        title="Supprimer le provider"
        message={`Êtes-vous sûr de vouloir supprimer le provider "${deletingProvider?.name}" ? Cette action est irréversible.`}
        loading={loading}
      />
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <Dialog open={!!previewProvider} onOpenChange={(open) => { if (!open) { setPreviewProvider(null); setPreviewData(null); setPreviewError(null); } }}>
        <DialogContent className="max-w-3xl bg-navy-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Aperçu des données</DialogTitle>
            <DialogDescription>
              {previewProvider ? `${getProviderTypeLabel(previewProvider.provider_type)} • ${previewProvider.name}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            {previewLoading && (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-foreground/50" />
                <p className="text-foreground/70">Chargement…</p>
              </div>
            )}
            {!previewLoading && previewError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {previewError}
              </div>
            )}
            {!previewLoading && previewData && (
              <pre className="max-h-[60vh] overflow-auto bg-navy-deep border border-border rounded-md p-3 text-xs text-foreground/90">
{JSON.stringify(previewData, null, 2)}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
