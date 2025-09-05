import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, X, Loader2 } from 'lucide-react';
import type { Provider, ProviderCreate, ProviderUpdate, ProviderTypeInfo } from '@/types/provider';
import axios from '@/api/axios';

interface ProviderFormProps {
  provider?: Provider;
  types: ProviderTypeInfo[];
  onSubmit: (data: ProviderCreate | ProviderUpdate) => Promise<boolean>;
  onCancel: () => void;
  onSuccess?: () => void; // Nouvelle prop pour notifier le succès
  loading?: boolean;
}

const getDefaultConfig = (providerType: string) => {
  switch (providerType) {
    case 'GMAIL':
      return {
        days_back: 10,
        max_results: 50,
        query: ''
      };
    case 'GOOGLE_CALENDAR':
      return {
        calendar_id: 'primary',
        days_back: 365,
        days_ahead: 365
      };
    case 'GOOGLE_DRIVE_SMS':
      return {
        folder_name: 'SMS',
        days_back: 10
      };
    case 'GOOGLE_DRIVE':
      return {
        folder_name: 'LIA'
      };
    default:
      return {};
  }
};

export const ProviderForm: React.FC<ProviderFormProps> = ({
  provider,
  types,
  onSubmit,
  onCancel,
  onSuccess,
  loading = false
}) => {
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [formData, setFormData] = useState<ProviderCreate>({
    name: '',
    provider_type: 'GMAIL',
    is_active: true,
    credentials_json: {},
    token_json: {},
    config: getDefaultConfig('GMAIL')
  });

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!provider;

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        provider_type: provider.provider_type,
        is_active: provider.is_active,
        credentials_json: provider.credentials_json,
        token_json: provider.token_json,
        config: provider.config
      });
      
      setStep('config');
    }
  }, [provider]);

  const handleTypeSelection = async () => {
    if (!formData.name.trim()) {
      setErrors({ name: 'Le nom est requis' });
      return;
    }
    
    // Démarrer directement l'authentification OAuth
    await handleOAuthAuth();
  };

  const getProviderTypeIcon = (type: string) => {
    switch (type) {
      case 'GMAIL':
        return '📧';
      case 'GOOGLE_CALENDAR':
        return '📅';
      case 'GOOGLE_DRIVE_SMS':
        return '💬';
      case 'GOOGLE_DRIVE':
        return '☁️';
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
      default:
        return type;
    }
  };

  const handleOAuthAuth = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      // Demander l'URL d'autorisation au backend
      const { data } = await axios.post('/providers/start_oauth/', {
        name: formData.name,
        provider_type: formData.provider_type
      });

      const authUrl = data?.auth_url;
      if (!authUrl) throw new Error('URL OAuth non reçue');

      const authWindow = window.open(authUrl, 'oauth', 'width=500,height=600,scrollbars=yes,resizable=yes');

      // Écoute le retour du backend via les pages /oauth-success ou /oauth-error
      const onMessage = (event: MessageEvent) => {
        console.log('Message reçu dans ProviderForm:', event.data); // Debug
        
        if (event.origin !== window.location.origin) {
          console.log('Origin différente, ignoré:', event.origin); // Debug
          return;
        }
        
        if (event.data?.type === 'OAUTH_PROVIDER_CREATED') {
          console.log('Provider OAuth créé avec succès!'); // Debug
          
          // Fermer la fenêtre OAuth
          try { authWindow?.close(); } catch (e) { /* noop */ }
          
          // Notifier le composant parent du succès pour rafraîchir la liste et fermer le formulaire
          if (onSuccess) {
            console.log('Appel de onSuccess...'); // Debug
            onSuccess();
          } else {
            console.log('onSuccess non défini!'); // Debug
          }
          
          // Nettoyer l'écouteur d'événements
          window.removeEventListener('message', onMessage);
        }
        if (event.data?.type === 'OAUTH_ERROR') {
          console.log('Erreur OAuth reçue:', event.data?.error); // Debug
          setAuthError(event.data?.error || 'Erreur OAuth');
          try { authWindow?.close(); } catch (e) { /* noop */ }
          window.removeEventListener('message', onMessage);
        }
      };
      
      console.log('Ajout de l\'écouteur d\'événements OAuth'); // Debug
      window.addEventListener('message', onMessage);

      // Vérification périodique pour détecter la création de providers
      // (fallback au cas où le message OAuth ne fonctionnerait pas)
      const checkProviderCreation = async () => {
        try {
          // Vérifier si un provider avec ce nom et type a été créé
          const response = await axios.get('/providers/', {
            params: {
              type: formData.provider_type
            }
          });
          
          const providers = Array.isArray(response.data) ? response.data : response.data.results || [];
          const newProvider = providers.find(p => 
            p.name === formData.name && 
            p.provider_type === formData.provider_type
          );
          
          if (newProvider) {
            console.log('Provider détecté via polling:', newProvider); // Debug
            
            // Fermer la fenêtre OAuth si elle est encore ouverte
            try { authWindow?.close(); } catch (e) { /* noop */ }
            
            // Nettoyer l'écouteur d'événements
            window.removeEventListener('message', onMessage);
            
            // Notifier le succès
            if (onSuccess) {
              onSuccess();
            }
            
            // Arrêter le polling
            clearInterval(pollingInterval);
          }
        } catch (error) {
          console.log('Erreur lors de la vérification polling:', error); // Debug
        }
      };

      // Démarrer le polling toutes les 2 secondes
      const pollingInterval = setInterval(checkProviderCreation, 2000);
      
      // Arrêter le polling après 5 minutes (timeout de sécurité)
      setTimeout(() => {
        clearInterval(pollingInterval);
        console.log('Polling OAuth arrêté (timeout)'); // Debug
      }, 5 * 60 * 1000);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
      setAuthError(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData = {
        ...formData,
        // credentials_json and token_json are now handled by the OAuth flow
      };

      const success = await onSubmit(submitData);
      if (success) {
        // Reset form
        setFormData({
          name: '',
          provider_type: 'GMAIL',
          is_active: true,
          credentials_json: {},
          token_json: {},
          config: {}
        });
        setErrors({});
        setStep('type');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue.";
      setErrors({ submit: errorMessage });
    }
  };

  // Étape 1: Sélection du type et nom (pour la création)
  if (step === 'type' && !isEditing) {
    return (
      <div className="space-y-6">
        <div>
          <Label htmlFor="name" className="text-sm text-foreground/70">
            Nom du fournisseur *
          </Label>
          <input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Mon Gmail, Calendrier perso..."
            className="w-full mt-1 p-2 bg-card border border-border rounded-md text-foreground text-sm"
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="provider_type" className="text-sm text-foreground/70">
            Type de fournisseur *
          </Label>
          <select
            id="provider_type"
            value={formData.provider_type}
            onChange={(e) => {
              const newType = e.target.value as ProviderTypeInfo['value'];
              setFormData({ 
                ...formData, 
                provider_type: newType,
                config: getDefaultConfig(newType)
              });
            }}
            className="w-full mt-1 p-2 bg-card border border-border rounded-md text-foreground text-sm"
          >
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {getProviderTypeIcon(type.value)} {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="p-3 bg-background rounded-lg border border-border">
          <p className="text-sm text-foreground/70">
            {types.find(t => t.value === formData.provider_type)?.description}
          </p>
        </div>

        {/* Erreur d'authentification */}
        {authError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{authError}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleTypeSelection}
            disabled={!formData.name.trim() || isAuthenticating}
            className="border border-border bg-card hover:bg-muted text-foreground/80"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Authentification en cours...
              </>
            ) : (
              'Continuer'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-border text-foreground hover:bg-muted"
          >
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  // Étape 2: Configuration et soumission (pour la création) ou édition
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-4">
        <h4 className="text-lg font-medium text-foreground">
          {isEditing ? 'Modifier le provider' : 'Configuration finale'}
        </h4>
        <p className="text-sm text-foreground/70">
          {getProviderTypeIcon(formData.provider_type)} {formData.name}
        </p>
      </div>

      {/* Nom du provider */}
      <div>
        <Label htmlFor="name" className="text-sm text-foreground/70">
          Nom du fournisseur *
        </Label>
        <input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Mon Gmail, Calendrier perso..."
          className="w-full mt-1 p-2 bg-navy-card border border-border rounded-md text-foreground text-sm"
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Type de provider (lecture seule en édition) */}
      {!isEditing && (
        <div>
          <Label htmlFor="provider_type" className="text-sm text-foreground/70">
            Type de fournisseur *
          </Label>
          <select
            id="provider_type"
            value={formData.provider_type}
            onChange={(e) => {
              const newType = e.target.value as ProviderTypeInfo['value'];
              setFormData({ 
                ...formData, 
                provider_type: newType,
                config: getDefaultConfig(newType)
              });
            }}
            className="w-full mt-1 p-2 bg-card border border-border rounded-md text-foreground text-sm"
          >
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {getProviderTypeIcon(type.value)} {type.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Statut actif */}
      <div className="flex items-center space-x-2">
        <input
          id="is_active"
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded border-border"
        />
        <Label htmlFor="is_active" className="text-sm text-foreground/70">
          {isEditing ? 'Activer ce provider' : 'Activer ce provider immédiatement'}
        </Label>
      </div>

      {/* Configuration JSON personnalisée */}
      <div>
        <Label htmlFor="config" className="text-sm text-foreground/70">
          Configuration avancée (JSON)
        </Label>
        <textarea
          id="config"
          value={JSON.stringify(formData.config, null, 2)}
          onChange={(e) => {
            try {
              const config = JSON.parse(e.target.value);
              setFormData({ ...formData, config });
              setErrors({ ...errors, config: '' });
            } catch (err) {
              setErrors({ ...errors, config: 'JSON invalide' });
            }
          }}
          placeholder='{"folder_name": "SMS", "sync_interval": 600}'
          className="w-full mt-1 p-2 bg-card border border-border rounded-md text-foreground font-mono text-sm min-h-[120px]"
        />
        {errors.config && <p className="text-red-400 text-xs mt-1">{errors.config}</p>}
        <p className="text-xs text-foreground/50 mt-1">
          Configuration optionnelle pour personnaliser le comportement du provider
        </p>
      </div>

      {/* Erreur générale */}
      {errors.submit && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="border border-border bg-navy-card hover:bg-navy-muted text-foreground/80">
          <Check className="w-4 h-4 mr-2" />
          {loading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer')}
        </Button>
        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('type')}
            className="border-border text-foreground hover:bg-muted"
          >
            Retour
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-border text-foreground hover:bg-navy-muted"
        >
          <X className="w-4 h-4 mr-2" />
          Annuler
        </Button>
      </div>
    </form>
  );
};
