import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { CategoryType, StartCategoryOAuth, AppleAuth } from '@/types/meta-provider';
import type { ProviderType } from '@/types/provider';
import { getCategoryIcon, getCategoryColors, getCategoryLabel, CATEGORY_SERVICES } from '@/types/meta-provider';
import { CategoryLogo } from './CategoryLogo';

interface AddMetaProviderDialogProps {
  open: boolean;
  onClose: () => void;
  onStartOAuth: (payload: StartCategoryOAuth) => void;
  onAppleAuth: (payload: AppleAuth) => void;
  isLoading?: boolean;
}

type Step = 'category' | 'services' | 'options' | 'auth';

const getProviderLabel = (type: ProviderType): string => {
  const labels: Record<ProviderType, string> = {
    GMAIL: 'Gmail',
    GOOGLE_CALENDAR: 'Calendrier',
    GOOGLE_CONTACTS: 'Contacts',
    GOOGLE_DRIVE: 'Drive',
    GOOGLE_DRIVE_SMS: 'SMS (Drive)',
    OUTLOOK_MAIL: 'Mail',
    OUTLOOK_CALENDAR: 'Calendrier',
    OUTLOOK_CONTACTS: 'Contacts',
    ICLOUD_MAIL: 'Mail',
    ICLOUD_CALENDAR: 'Calendrier',
    ICLOUD_CONTACTS: 'Contacts',
  };
  return labels[type] || type;
};

const getProviderIcon = (type: ProviderType): string => {
  if (type.includes('MAIL') || type === 'GMAIL' || type === 'OUTLOOK_MAIL') return '📧';
  if (type.includes('CALENDAR')) return '📅';
  if (type.includes('CONTACTS')) return '👥';
  if (type.includes('DRIVE')) return '☁️';
  if (type.includes('SMS')) return '💬';
  return '🔗';
};

const supportsReadWrite = (type: ProviderType) => {
  // Seuls les calendriers et contacts supportent la synchronisation bidirectionnelle (lecture/écriture)
  // Gmail, Drive et autres services ne supportent pas ce mode
  return ['GOOGLE_CALENDAR', 'OUTLOOK_CALENDAR', 'GOOGLE_CONTACTS', 'OUTLOOK_CONTACTS', 'ICLOUD_CALENDAR', 'ICLOUD_CONTACTS'].includes(type);
};

export const AddMetaProviderDialog: React.FC<AddMetaProviderDialogProps> = ({
  open,
  onClose,
  onStartOAuth,
  onAppleAuth,
  isLoading = false,
}) => {
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [name, setName] = useState('');
  const [selectedServices, setSelectedServices] = useState<ProviderType[]>([]);
  const [readOnly, setReadOnly] = useState(false);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [appleId, setAppleId] = useState('');
  const [appPassword, setAppPassword] = useState('');

  const reset = () => {
    setStep('category');
    setCategory(null);
    setName('');
    setSelectedServices([]);
    setReadOnly(false);
    setServiceNames({});
    setAppleId('');
    setAppPassword('');
  };

  // Réinitialiser le formulaire quand la dialog se ferme
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCategorySelect = (cat: CategoryType) => {
    setCategory(cat);
    setName('');
    setSelectedServices([]);
    setStep('services');
  };

  const handleServiceToggle = (service: ProviderType) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleNext = () => {
    if (step === 'services' && selectedServices.length > 0) {
      setStep('options');
    } else if (step === 'options') {
      if (category === 'APPLE') {
        setStep('auth');
      } else {
        handleSubmitOAuth();
      }
    }
  };

  const handleSubmitOAuth = () => {
    if (!category || !name || selectedServices.length === 0) return;

    if (category === 'APPLE') {
      // Apple auth avec app password
      onAppleAuth({
        name,
        services: selectedServices,
        apple_id: appleId,
        app_password: appPassword,
        read_only: readOnly,
        service_names: serviceNames,
      });
    } else {
      // OAuth Google/Microsoft
      onStartOAuth({
        name,
        category,
        services: selectedServices,
        read_only: readOnly,
        service_names: serviceNames,
      });
    }
  };

  const canProceed = () => {
    if (step === 'category') return category !== null;
    if (step === 'services') return selectedServices.length > 0 && name.trim() !== '';
    if (step === 'options') return true;
    if (step === 'auth') return appleId.trim() !== '' && appPassword.trim() !== '';
    return false;
  };

  const categories: CategoryType[] = ['GOOGLE', 'MICROSOFT', 'APPLE'];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle>Ajouter un compte</DialogTitle>
          <DialogDescription>
            {step === 'category' && 'Choisissez une catégorie de services'}
            {step === 'services' && `Sélectionnez les services ${category ? getCategoryLabel(category) : ''}`}
            {step === 'options' && 'Options avancées'}
            {step === 'auth' && 'Authentification Apple'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Étape 1: Catégorie */}
          {step === 'category' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const colors = getCategoryColors(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`p-6 rounded-lg border-2 ${
                      category === cat ? colors.border : 'border-border'
                    } ${colors.hover} transition-all hover:scale-105 bg-card`}
                  >
                    <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center">
                      <CategoryLogo category={cat} className="w-20 h-20" />
                    </div>
                    <h3 className="font-semibold text-center text-foreground">{getCategoryLabel(cat)}</h3>
                  </button>
                );
              })}
            </div>
          )}

          {/* Étape 2: Services */}
          {step === 'services' && category && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du compte</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`Ex: Mon compte ${getCategoryLabel(category)} perso`}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Services à activer</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {CATEGORY_SERVICES[category].map((service) => (
                    <div
                      key={service}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        selectedServices.includes(service) ? 'border-primary bg-primary/5' : 'border-border'
                      } cursor-pointer hover:bg-muted transition-colors`}
                      onClick={() => handleServiceToggle(service)}
                    >
                      <Checkbox checked={selectedServices.includes(service)} />
                      <span className="text-xl">{getProviderIcon(service)}</span>
                      <span className="text-sm font-medium flex-1">{getProviderLabel(service)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Options */}
          {step === 'options' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                <Checkbox id="readonly" checked={readOnly} onCheckedChange={(checked) => setReadOnly(checked as boolean)} />
                <Label htmlFor="readonly" className="cursor-pointer flex-1">
                  <div>
                    <div className="font-medium">Lecture seule</div>
                    <div className="text-xs text-foreground/60">Synchronisation unidirectionnelle (calendriers et contacts)</div>
                  </div>
                </Label>
              </div>

              <div>
                <Label>Noms personnalisés (optionnel)</Label>
                <div className="space-y-2 mt-2">
                  {selectedServices.map((service) => (
                    <div key={service} className="flex items-center gap-2">
                      <span className="text-lg">{getProviderIcon(service)}</span>
                      <Input
                        placeholder={getProviderLabel(service)}
                        value={serviceNames[service] || ''}
                        onChange={(e) => setServiceNames({ ...serviceNames, [service]: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Aide SMS (Drive) */}
              {selectedServices.includes('GOOGLE_DRIVE_SMS') && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-sm text-blue-400 mb-2 font-medium">
                    Configuration SMS (Drive)
                  </p>
                  <p className="text-sm text-foreground/80 mb-2">
                    Pour synchroniser vos SMS via Google Drive, vous devez installer l'application SMS Backup & Restore :
                  </p>
                  <ol className="list-decimal ml-5 text-xs space-y-1 text-foreground/70">
                    <li>
                      Téléchargez{' '}
                      <a
                        href="https://play.google.com/store/apps/details?id=com.riteshsahu.SMSBackupRestore"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline hover:text-blue-300"
                      >
                        SMS Backup & Restore
                      </a>
                      {' '}depuis le Google Play Store
                    </li>
                    <li>Configurez l'application pour sauvegarder vos SMS sur Google Drive dans le dossier "SMS"</li>
                    <li>Lors de la connexion, accordez les permissions d'écriture complètes sur Google Drive</li>
                    <li>L-IA lira automatiquement les fichiers de sauvegarde depuis le dossier SMS</li>
                  </ol>
                </div>
              )}

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm text-blue-400">
                  {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} sélectionné{selectedServices.length > 1 ? 's' : ''}.
                  Une seule autorisation sera nécessaire pour tous.
                </p>
              </div>
            </div>
          )}

          {/* Étape 4: Auth Apple */}
          {step === 'auth' && category === 'APPLE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm text-blue-400 mb-2">
                  Pour connecter votre compte Apple, générez un mot de passe d'application :
                </p>
                <ol className="list-decimal ml-5 text-xs space-y-1 text-foreground/70">
                  <li>Visitez <a href="https://appleid.apple.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">appleid.apple.com</a></li>
                  <li>Sélectionnez "Mots de passe d'app" dans "Connexion et sécurité"</li>
                  <li>Créez un nouveau mot de passe pour "L-IA"</li>
                  <li>Copiez-le ci-dessous</li>
                </ol>
              </div>

              <div>
                <Label htmlFor="appleId">Apple ID (Email)</Label>
                <Input
                  id="appleId"
                  type="email"
                  value={appleId}
                  onChange={(e) => setAppleId(e.target.value)}
                  placeholder="votre@icloud.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="appPassword">Mot de passe d'application</Label>
                <Input
                  id="appPassword"
                  type="password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step !== 'category' && (
            <Button variant="outline" onClick={() => {
              if (step === 'services') setStep('category');
              else if (step === 'options') setStep('services');
              else if (step === 'auth') setStep('options');
            }}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>
          )}

          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>

          {step !== 'auth' && (
            <Button onClick={handleNext} disabled={!canProceed() || isLoading}>
              {step === 'options' ? 'Autoriser' : 'Suivant'}
              {step !== 'options' && <ChevronRight className="w-4 h-4 ml-1" />}
              {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            </Button>
          )}

          {step === 'auth' && category === 'APPLE' && (
            <Button onClick={handleSubmitOAuth} disabled={!canProceed() || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Connecter'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
