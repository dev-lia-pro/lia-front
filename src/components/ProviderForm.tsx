import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
        folder_name: 'L-IA'
      };
    case 'GOOGLE_CONTACTS':
      return {
        sync_interval: 3600,
        sync_groups: true,
        auto_create_from_messages: true
      };
    case 'OUTLOOK_CONTACTS':
      return {
        sync_interval: 3600
      };
    case 'OUTLOOK_MAIL':
      return {
        days_back: 10,
        max_results: 50,
        folder: 'Inbox'
      };
    case 'OUTLOOK_CALENDAR':
      return {
        calendar_id: 'primary',
        days_back: 365,
        days_ahead: 365,
        read_only: true
      };
    case 'ICLOUD_MAIL':
      return {
        days_back: 10,
        max_results: 50,
        imap_server: 'imap.mail.me.com',
        imap_port: 993
      };
    case 'ICLOUD_CALENDAR':
      return {
        calendar_id: 'primary',
        days_back: 365,
        days_ahead: 365
      };
    case 'ICLOUD_CONTACTS':
      return {
        sync_interval: 3600
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
  const [step, setStep] = useState<'type' | 'config' | 'icloud-auth'>('type');
  const [iCloudCredentials, setICloudCredentials] = useState({
    apple_id: '',
    app_password: ''
  });
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
  const [readOnly, setReadOnly] = useState(false);

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
      case 'GOOGLE_CONTACTS':
        return '👥';
      case 'OUTLOOK_MAIL':
        return '📧';
      case 'OUTLOOK_CALENDAR':
        return '📅';
      case 'OUTLOOK_CONTACTS':
        return '👥';
      case 'ICLOUD_MAIL':
        return '📧';
      case 'ICLOUD_CALENDAR':
        return '📅';
      case 'ICLOUD_CONTACTS':
        return '👥';
      default:
        return '🔗';
    }
  };

  const isICloudProvider = (type: string) => {
    return type === 'ICLOUD_MAIL' || type === 'ICLOUD_CALENDAR' || type === 'ICLOUD_CONTACTS';
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
      case 'OUTLOOK_MAIL':
        return 'Outlook Mail';
      case 'OUTLOOK_CALENDAR':
        return 'Outlook Calendar';
      case 'OUTLOOK_CONTACTS':
        return 'Outlook Contacts';
      case 'ICLOUD_MAIL':
        return 'iCloud Mail';
      case 'ICLOUD_CALENDAR':
        return 'iCloud Calendar';
      case 'ICLOUD_CONTACTS':
        return 'iCloud Contacts';
      default:
        return type;
    }
  };

  const handleOAuthAuth = async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Vérifier si c'est un provider iCloud
      if (isICloudProvider(formData.provider_type)) {
        // Pour iCloud, on ouvre un formulaire de credentials au lieu d'OAuth
        setStep('icloud-auth');
        setIsAuthenticating(false);
        return;
      }

      // Demander l'URL d'autorisation au backend
      const { data } = await axios.post('/providers/start_oauth/', {
        name: formData.name,
        provider_type: formData.provider_type,
        read_only: readOnly
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

  const handleICloudAuth = async () => {
    if (!iCloudCredentials.apple_id || !iCloudCredentials.app_password) {
      setErrors({ icloud: 'Apple ID et App Password sont requis' });
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Envoyer les credentials au backend
      const { data } = await axios.post('/providers/icloud/auth/', {
        name: formData.name,
        provider_type: formData.provider_type,
        apple_id: iCloudCredentials.apple_id,
        app_password: iCloudCredentials.app_password,
        read_only: readOnly
      });

      // Provider créé avec succès
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erreur d'authentification iCloud";
      setAuthError(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Étape iCloud Auth
  if (step === 'icloud-auth') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-4">
          <h4 className="text-lg font-medium text-foreground">
            Authentification iCloud
          </h4>
          <p className="text-sm text-foreground/70 mt-2">
            {getProviderTypeIcon(formData.provider_type)} {formData.name}
          </p>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-foreground/80">
            Pour connecter votre compte iCloud, vous devez générer un mot de passe d'application :
          </p>
          <ol className="list-decimal ml-5 mt-2 text-sm text-foreground/70">
            <li>Connectez-vous à <a href="https://appleid.apple.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">appleid.apple.com</a></li>
            <li>Dans "Connexion et sécurité", sélectionnez "Mots de passe d'app"</li>
            <li>Créez un nouveau mot de passe pour "L-IA"</li>
            <li>Copiez le mot de passe généré ci-dessous</li>
          </ol>
        </div>

        <div>
          <Label htmlFor="apple_id" className="text-sm text-foreground/70">
            Apple ID (Email) *
          </Label>
          <input
            id="apple_id"
            type="email"
            value={iCloudCredentials.apple_id}
            onChange={(e) => setICloudCredentials({ ...iCloudCredentials, apple_id: e.target.value })}
            placeholder="votre@icloud.com"
            className="w-full mt-1 p-2 bg-card border border-border rounded-md text-foreground text-sm"
          />
        </div>

        <div>
          <Label htmlFor="app_password" className="text-sm text-foreground/70">
            Mot de passe d'application *
          </Label>
          <input
            id="app_password"
            type="password"
            value={iCloudCredentials.app_password}
            onChange={(e) => setICloudCredentials({ ...iCloudCredentials, app_password: e.target.value })}
            placeholder="xxxx-xxxx-xxxx-xxxx"
            className="w-full mt-1 p-2 bg-card border border-border rounded-md text-foreground text-sm"
          />
          <p className="text-xs text-foreground/50 mt-1">
            Mot de passe spécifique à l'application généré depuis appleid.apple.com
          </p>
        </div>

        {/* Erreur d'authentification */}
        {authError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{authError}</p>
          </div>
        )}

        {errors.icloud && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{errors.icloud}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleICloudAuth}
            disabled={isAuthenticating || !iCloudCredentials.apple_id || !iCloudCredentials.app_password}
            className="border border-border bg-card hover:bg-muted text-foreground/80"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Authentification...
              </>
            ) : (
              'Connecter'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('type')}
            className="border-border text-foreground hover:bg-muted"
          >
            Retour
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
          <Select
            value={formData.provider_type}
            onValueChange={(value) => {
              const newType = value as ProviderTypeInfo['value'];
              setFormData({
                ...formData,
                provider_type: newType,
                config: getDefaultConfig(newType)
              });
            }}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Sélectionner un type de fournisseur" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem
                  key={type.value}
                  value={type.value}
                >
                  <span className="flex items-center gap-2">
                    <span>{getProviderTypeIcon(type.value)}</span>
                    <span>{type.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 bg-background rounded-lg border border-border">
          <p className="text-sm text-foreground/70">
            {types.find(t => t.value === formData.provider_type)?.description}
          </p>
        </div>

        {/* Option Lecture seule */}
        {(formData.provider_type === 'GOOGLE_CALENDAR' ||
          formData.provider_type === 'GOOGLE_CONTACTS' ||
          formData.provider_type === 'OUTLOOK_CALENDAR' ||
          formData.provider_type === 'OUTLOOK_CONTACTS' ||
          formData.provider_type === 'ICLOUD_CALENDAR' ||
          formData.provider_type === 'ICLOUD_CONTACTS') && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="readOnly" 
              checked={readOnly}
              onCheckedChange={(checked) => setReadOnly(checked as boolean)}
            />
            <Label 
              htmlFor="readOnly" 
              className="text-sm text-foreground/70 cursor-pointer"
            >
              Lecture seule (synchronisation unidirectionnelle)
            </Label>
          </div>
        )}

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
          <Select
            value={formData.provider_type}
            onValueChange={(value) => {
              const newType = value as ProviderTypeInfo['value'];
              setFormData({
                ...formData,
                provider_type: newType,
                config: getDefaultConfig(newType)
              });
            }}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Sélectionner un type de fournisseur" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem
                  key={type.value}
                  value={type.value}
                >
                  <span className="flex items-center gap-2">
                    <span>{getProviderTypeIcon(type.value)}</span>
                    <span>{type.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
