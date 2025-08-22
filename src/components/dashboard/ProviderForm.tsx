import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, ExternalLink, Loader2 } from 'lucide-react';
import type { Provider, ProviderCreate, ProviderUpdate, ProviderTypeInfo } from '@/types/provider';
import axios from '@/api/axios';

interface ProviderFormProps {
  provider?: Provider;
  types: ProviderTypeInfo[];
  onSubmit: (data: ProviderCreate | ProviderUpdate) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

export const ProviderForm: React.FC<ProviderFormProps> = ({
  provider,
  types,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [formData, setFormData] = useState<ProviderCreate>({
    name: '',
    provider_type: 'GMAIL',
    is_active: true,
    credentials_json: {},
    token_json: {},
    config: {}
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
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'OAUTH_PROVIDER_CREATED') {
          // Fermer le formulaire et laisser la liste se rafraîchir (au prochain fetch)
          try { authWindow?.close(); } catch (e) { /* noop */ }
          onCancel();
          window.removeEventListener('message', onMessage);
        }
        if (event.data?.type === 'OAUTH_ERROR') {
          setAuthError(event.data?.error || 'Erreur OAuth');
          try { authWindow?.close(); } catch (e) { /* noop */ }
          window.removeEventListener('message', onMessage);
        }
      };
      window.addEventListener('message', onMessage);
      
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

  // Étape 1: Sélection du type et nom
  if (step === 'type') {
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
            className="w-full mt-1 p-2 bg-navy-card border border-border rounded-md text-foreground"
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
            onChange={(e) => setFormData({ ...formData, provider_type: e.target.value as ProviderTypeInfo['value'] })}
            className="w-full mt-1 p-2 bg-navy-card border border-border rounded-md text-foreground"
          >
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {getProviderTypeIcon(type.value)} {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="p-3 bg-navy-deep rounded-lg border border-border">
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
            className="border border-border bg-navy-card hover:bg-navy-muted text-foreground/80"
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
            className="border-border text-foreground hover:bg-navy-muted"
          >
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  // Étape 2: Configuration et soumission
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-4">
        <h4 className="text-lg font-medium text-foreground">
          Configuration finale
        </h4>
        <p className="text-sm text-foreground/70">
          {getProviderTypeIcon(formData.provider_type)} {formData.name}
        </p>
      </div>

      {/* Configuration spécifique supprimée */}

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
          Activer ce provider immédiatement
        </Label>
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
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep('type')}
          className="border-border text-foreground hover:bg-navy-muted"
        >
          Retour
        </Button>
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
