import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Trash2, 
  TestTube,
  Power,
  PowerOff,
  RefreshCw,
  AlertCircle,
  Settings2
} from 'lucide-react';
import type { NavigationTab } from '@/types/navigation';
import type { Provider } from '@/types/provider';
import { useProviders } from '@/hooks/useProviders';
import { ProviderForm } from '@/components/ProviderForm';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { useToast } from '@/hooks/use-toast';
import type { ProviderCreate, ProviderUpdate } from '@/types/provider';
import axios from '@/api/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProjectsGrid } from '@/components/ProjectsGrid';
import { AssistantHistory } from '@/components/AssistantHistory';
import { ContactsSection } from '@/components/ContactsSection';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('accueil');
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);
  const [previewProvider, setPreviewProvider] = useState<Provider | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [syncingProvider, setSyncingProvider] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [configuringProvider, setConfiguringProvider] = useState<Provider | null>(null);
  const [configJson, setConfigJson] = useState<string>('{}');
  const [configError, setConfigError] = useState<string>('');
  
  const { toast } = useToast();
  const {
    providers,
    types,
    loading,
    error,
    createProvider,
    updateProvider,
    deleteProvider,
    testConnection,
    clearError,
    fetchProviders,
    fetchTypes,
    refreshProviders
  } = useProviders();

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'GMAIL':
        return '📧';
      case 'GOOGLE_CALENDAR':
        return '📅';
      case 'GOOGLE_DRIVE_SMS':
        return '💬';
      case 'GOOGLE_DRIVE':
        return '☁️';
      case 'GOOGLE_CONTACTS':
        return '👥';
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
      case 'GOOGLE_DRIVE':
        return 'Google Drive';
      case 'GOOGLE_CONTACTS':
        return 'Google Contacts';
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
      case 'GOOGLE_DRIVE':
        return 'text-orange-400';
      case 'GOOGLE_CONTACTS':
        return 'text-cyan-400';
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
      } else if (isAddingProvider) {
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
    const provider = providers.find(p => p.id === providerId);
    if (!provider) {
      toast({
        title: "Erreur",
        description: "Provider non trouvé",
        variant: "destructive",
      });
      return;
    }

    const success = await updateProvider(providerId, { is_active: !provider.is_active });
    if (success) {
      toast({
        title: "Statut modifié",
        description: "Le statut du provider a été modifié.",
      });
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
      } else if (provider.provider_type === 'GOOGLE_CONTACTS') {
        url = `/providers/${provider.id}/sync_contacts/`;
      } else if (provider.provider_type === 'GOOGLE_DRIVE') {
        // Pour Google Drive, on ne lance pas de synchronisation automatique
        // car c'est principalement pour le stockage de fichiers
        toast({
          title: 'Google Drive configuré',
          description: 'Google Drive est maintenant configuré pour le stockage de fichiers.',
        });
        return;
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

  // Fonction spécifique pour gérer le succès OAuth
  const handleOAuthSuccess = async () => {
    console.log('handleOAuthSuccess appelé!'); // Debug
    
    // Rafraîchir la liste des providers avec TanStack Query
    console.log('Rafraîchissement de la liste des providers...'); // Debug
    const updatedProviders = await refreshProviders();
    console.log('Liste des providers après rafraîchissement:', updatedProviders); // Debug
    
    // Identifier le nouveau provider (probablement le plus récemment créé)
    // On peut utiliser l'ID le plus élevé comme approximation
    const latestProvider = updatedProviders.length > 0 
      ? updatedProviders.reduce((latest, current) => 
          (current.id > latest.id) ? current : latest
        )
      : null;
      
    if (latestProvider) {
      console.log('Lancement de la synchronisation pour le nouveau provider:', latestProvider.name);
      
      // Lancer la synchronisation selon le type de provider
      if (latestProvider.provider_type === 'GMAIL') {
        axios.post(`/providers/${latestProvider.id}/sync_emails/`, { max: 50 });
      } else if (latestProvider.provider_type === 'GOOGLE_CALENDAR') {
        axios.post(`/providers/${latestProvider.id}/sync_calendar/`, { days_back: 30, days_ahead: 30 });
      } else if (latestProvider.provider_type === 'GOOGLE_DRIVE_SMS') {
        axios.post(`/providers/${latestProvider.id}/sync_sms/`);
      } else if (latestProvider.provider_type === 'GOOGLE_CONTACTS') {
        axios.post(`/providers/${latestProvider.id}/sync_contacts/`);
      } else if (latestProvider.provider_type === 'GOOGLE_DRIVE') {
        // Pour Google Drive, on ne lance pas de synchronisation automatique
        // car c'est principalement pour le stockage de fichiers
        toast({
          title: "Provider Google Drive créé",
          description: "Google Drive est maintenant configuré pour le stockage de fichiers.",
        });
        return;
      }
      
      // Afficher un toast de confirmation
      toast({
        title: "Provider créé et synchronisation lancée",
        description: `Le provider ${latestProvider.name} a été créé et sa synchronisation est en cours.`,
      });
    }
  
    // Fermer le formulaire de création
    console.log('Fermeture du formulaire de création...'); // Debug
    setIsAddingProvider(false);
    
    // Nettoyer les erreurs
    clearError();
    
    console.log('handleOAuthSuccess terminé!'); // Debug
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-6">
          {/* Section Projets */}
          <Card className="bg-card border-border mb-6">
            <CardContent className="pt-6">
              <ProjectsGrid />
            </CardContent>
          </Card>

          {/* Section des providers */}
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Fournisseurs de données
                </CardTitle>
                <Button size="sm" onClick={() => setIsAddingProvider(true)} className="h-9 w-9 p-0 border border-primary bg-primary hover:bg-primary/90 text-primary-foreground" aria-label="Ajouter un fournisseur" title="Ajouter un fournisseur">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Statistiques supprimées */}

              {/* Formulaire d'ajout/édition */}
              {(isAddingProvider || editingProvider) && (
                <div className="mb-6 p-4 bg-background rounded-lg border border-border">
                  <h3 className="text-sm font-medium mb-4 text-foreground">
                    {editingProvider ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                  </h3>
                  <ProviderForm
                    provider={editingProvider}
                    types={types}
                    onSubmit={handleSubmitProvider}
                    onCancel={handleCancel}
                    onSuccess={handleOAuthSuccess}
                    loading={loading}
                  />
                </div>
              )}

              {/* Liste des providers */}
              <div className="space-y-3">
                {Array.isArray(providers) && providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-background rounded-lg border border-border gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg bg-card ${getProviderTypeColor(provider.provider_type)}`}>
                        <span className="text-2xl">{getProviderIcon(provider.provider_type)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{provider.name}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-card text-foreground/70">
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
                        {provider.provider_type === 'GOOGLE_DRIVE' && (
                          <p className="text-xs text-gray-400">
                            Stockage de fichiers
                          </p>
                        )}
                        {provider.last_sync_at && provider.provider_type !== 'GOOGLE_DRIVE' && (
                          <p className="text-xs text-foreground/50">
                            Dernière synchro: {new Date(provider.last_sync_at).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestConnection(provider.id)}
                        disabled={testingConnection === provider.id}
                        className="border-border text-foreground hover:bg-muted"
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
                        className="border-border text-foreground hover:bg-muted"
                        aria-label="Synchroniser"
                        disabled={provider.provider_type === 'GOOGLE_DRIVE'}
                        title={provider.provider_type === 'GOOGLE_DRIVE' ? 'Pas de synchronisation pour Google Drive' : 'Synchroniser'}
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
                        onClick={() => {
                          setConfiguringProvider(provider);
                          setConfigJson(JSON.stringify(provider.config || {}, null, 2));
                          setConfigError('');
                        }}
                        className="border-border text-foreground hover:bg-muted"
                        aria-label="Configurer"
                        title="Configurer"
                      >
                        <Settings2 className="w-4 h-4" />
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
                    <p className="text-foreground/70 mb-2">Aucun provider configuré</p>
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

          {/* Section Contacts */}
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContactsSection />
            </CardContent>
          </Card>

          {/* Section Historique de l'assistant */}
          <Card className="bg-card border-border mb-6 pt-6">
            <CardContent>
              <AssistantHistory />
            </CardContent>
          </Card>

          {/* Section des préférences (mock) */}
          <Card className="bg-card border-border">
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
        <DialogContent className="max-w-3xl bg-card border-border text-foreground">
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
              <pre className="max-h-[60vh] overflow-auto bg-background border border-border rounded-md p-3 text-xs text-foreground/90">
{JSON.stringify(previewData, null, 2)}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de configuration du provider */}
      <Dialog open={!!configuringProvider} onOpenChange={(open) => {
        if (!open) {
          setConfiguringProvider(null);
          setConfigJson('{}');
          setConfigError('');
        }
      }}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Configuration de {configuringProvider?.name}
            </DialogTitle>
            <DialogDescription className="text-foreground/70">
              Personnalisez les paramètres avancés du provider
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-foreground/70 block mb-2">
                Configuration JSON
              </label>
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
              {configError && (
                <p className="text-red-400 text-xs mt-1">{configError}</p>
              )}
            </div>
            
            <div className="bg-background p-3 rounded-md border border-border">
              <p className="text-sm text-foreground/70 mb-2">Exemples de configuration :</p>
              <ul className="text-xs space-y-1 text-foreground/60">
                <li>• <code>folder_name</code> : Nom du dossier pour Google Drive SMS</li>
                <li>• <code>sync_interval</code> : Intervalle de synchronisation en secondes</li>
                <li>• <code>max_results</code> : Nombre maximum de résultats par sync</li>
                <li>• <code>days_back</code> : Nombre de jours d'historique à synchroniser</li>
              </ul>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setConfiguringProvider(null);
                  setConfigJson('{}');
                  setConfigError('');
                }}
                className="border-border text-foreground hover:bg-muted"
              >
                Annuler
              </Button>
              <Button
                onClick={async () => {
                  if (configuringProvider && !configError) {
                    try {
                      const config = JSON.parse(configJson);
                      const success = await updateProvider(configuringProvider.id, { config });
                      if (success) {
                        toast({
                          title: "Configuration mise à jour",
                          description: "Les paramètres ont été enregistrés avec succès.",
                        });
                        setConfiguringProvider(null);
                        setConfigJson('{}');
                        setConfigError('');
                        fetchProviders(); // Rafraîchir la liste
                      }
                    } catch (err) {
                      toast({
                        title: "Erreur",
                        description: "Impossible de sauvegarder la configuration.",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                disabled={!!configError || loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <BottomNavigation activeTab={activeTab} />
    </div>
  );
};

export default SettingsPage;

