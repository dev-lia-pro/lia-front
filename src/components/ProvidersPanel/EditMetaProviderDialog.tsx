import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { MetaProvider, UpdateCategoryPermissions } from '@/types/meta-provider';
import type { ProviderType } from '@/types/provider';
import { CATEGORY_SERVICES } from '@/types/meta-provider';

interface EditMetaProviderDialogProps {
  open: boolean;
  metaProvider: MetaProvider | null;
  onClose: () => void;
  onUpdatePermissions: (id: number, payload: UpdateCategoryPermissions) => void;
  isLoading?: boolean;
}

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
  return ['GOOGLE_CALENDAR', 'OUTLOOK_CALENDAR', 'GOOGLE_CONTACTS', 'OUTLOOK_CONTACTS', 'ICLOUD_CALENDAR', 'ICLOUD_CONTACTS'].includes(type);
};

export const EditMetaProviderDialog: React.FC<EditMetaProviderDialogProps> = ({
  open,
  metaProvider,
  onClose,
  onUpdatePermissions,
  isLoading = false,
}) => {
  const [selectedServices, setSelectedServices] = useState<ProviderType[]>([]);
  const [readOnly, setReadOnly] = useState(false);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});

  // Initialiser les valeurs quand le dialog s'ouvre
  useEffect(() => {
    if (open && metaProvider) {
      // Récupérer les services actuels
      const currentServices = metaProvider.providers.map((p) => p.provider_type as ProviderType);
      setSelectedServices(currentServices);

      // Récupérer le mode read_only (on prend le premier provider qui le supporte)
      const readWriteProvider = metaProvider.providers.find((p) => supportsReadWrite(p.provider_type as ProviderType));
      setReadOnly(readWriteProvider?.read_only ?? false);

      // Récupérer les noms personnalisés
      const names: Record<string, string> = {};
      metaProvider.providers.forEach((p) => {
        if (p.name !== getDefaultServiceName(p.provider_type as ProviderType)) {
          names[p.provider_type] = p.name;
        }
      });
      setServiceNames(names);
    }
  }, [open, metaProvider]);

  const getDefaultServiceName = (type: ProviderType): string => {
    const prefix = metaProvider?.category === 'GOOGLE' ? 'Google' : metaProvider?.category === 'MICROSOFT' ? 'Outlook' : 'iCloud';
    const label = getProviderLabel(type);
    return `${label} ${prefix}`;
  };

  const handleServiceToggle = (service: ProviderType) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleSubmit = () => {
    if (!metaProvider || selectedServices.length === 0) return;

    // Filtrer les noms vides - ne garder que les noms personnalisés non vides
    const filteredServiceNames: Record<string, string> = {};
    Object.keys(serviceNames).forEach((service) => {
      const name = serviceNames[service]?.trim();
      if (name && name.length > 0) {
        filteredServiceNames[service] = name;
      }
    });

    const payload: UpdateCategoryPermissions = {
      services: selectedServices,
      read_only: readOnly,
      service_names: filteredServiceNames,
    };

    onUpdatePermissions(metaProvider.id, payload);
  };

  const handleClose = () => {
    setSelectedServices([]);
    setReadOnly(false);
    setServiceNames({});
    onClose();
  };

  if (!metaProvider) return null;

  const availableServices = CATEGORY_SERVICES[metaProvider.category] || [];

  const getChangeStatus = () => {
    // 1. Vérifier si les services ont changé
    const currentServices = metaProvider.providers.map((p) => p.provider_type);
    const servicesChanged =
      selectedServices.length !== currentServices.length ||
      selectedServices.some((s) => !currentServices.includes(s));

    // 2. Vérifier si le mode read_only a changé
    const readWriteProvider = metaProvider.providers.find((p) => supportsReadWrite(p.provider_type as ProviderType));
    const readOnlyChanged = readOnly !== (readWriteProvider?.read_only ?? false);

    // 3. Vérifier si les noms personnalisés ont changé
    const namesChanged = metaProvider.providers.some((provider) => {
      const serviceType = provider.provider_type;
      const newCustomName = serviceNames[serviceType]?.trim() || '';

      // Nom par défaut pour ce type de service
      const defaultName = getDefaultServiceName(serviceType as ProviderType);

      // Si le provider avait un nom personnalisé, le récupérer
      const hadCustomName = provider.name !== defaultName;
      const oldCustomName = hadCustomName ? provider.name : '';

      // Comparer l'ancien nom personnalisé avec le nouveau
      return newCustomName !== oldCustomName;
    });

    return { servicesChanged, readOnlyChanged, namesChanged };
  };

  const hasChanges = () => {
    const { servicesChanged, readOnlyChanged, namesChanged } = getChangeStatus();
    return servicesChanged || readOnlyChanged || namesChanged;
  };

  const needsOAuth = () => {
    const { servicesChanged, readOnlyChanged } = getChangeStatus();
    // OAuth nécessaire seulement si les services ou read_only changent
    return servicesChanged || readOnlyChanged;
  };

  const removedServices = metaProvider.providers.filter(
    (p) => !selectedServices.includes(p.provider_type as ProviderType)
  );

  const addedServices = selectedServices.filter(
    (s) => !metaProvider.providers.some((p) => p.provider_type === s)
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle>Modifier les services - {metaProvider.name}</DialogTitle>
          <DialogDescription>
            Ajoutez ou retirez des services pour ce compte
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Liste des services disponibles */}
          <div>
            <Label>Services disponibles</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {availableServices.map((service) => {
                const isCurrentlyActive = metaProvider.providers.some((p) => p.provider_type === service);
                return (
                  <div
                    key={service}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      selectedServices.includes(service) ? 'border-primary bg-primary/5' : 'border-border'
                    } cursor-pointer hover:bg-muted transition-colors`}
                    onClick={() => handleServiceToggle(service)}
                  >
                    <Checkbox checked={selectedServices.includes(service)} />
                    <span className="text-xl">{getProviderIcon(service)}</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{getProviderLabel(service)}</span>
                      {isCurrentlyActive && (
                        <Badge variant="outline" className="ml-2 text-xs bg-green-500/10 text-green-400 border-green-500/30">
                          Actif
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Options */}
          {selectedServices.some((s) => supportsReadWrite(s)) && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <Checkbox id="readonly" checked={readOnly} onCheckedChange={(checked) => setReadOnly(checked as boolean)} />
              <Label htmlFor="readonly" className="cursor-pointer flex-1">
                <div>
                  <div className="font-medium">Lecture seule</div>
                  <div className="text-xs text-foreground/60">Synchronisation unidirectionnelle (calendriers et contacts)</div>
                </div>
              </Label>
            </div>
          )}

          {/* Noms personnalisés */}
          <div>
            <Label>Noms personnalisés (optionnel)</Label>
            <div className="space-y-2 mt-2">
              {selectedServices.map((service) => (
                <div key={service} className="flex items-center gap-2">
                  <span className="text-lg">{getProviderIcon(service)}</span>
                  <Input
                    placeholder={getDefaultServiceName(service)}
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

          {/* Aperçu des changements */}
          {hasChanges() && (
            <div className="space-y-3">
              {addedServices.length > 0 && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-sm text-blue-400 font-medium mb-2">
                    ✨ Services à ajouter ({addedServices.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {addedServices.map((service) => (
                      <Badge key={service} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                        {getProviderIcon(service)} {getProviderLabel(service)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {removedServices.length > 0 && (
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-orange-400 font-medium mb-2">
                        ⚠️ Services à retirer ({removedServices.length})
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {removedServices.map((provider) => (
                          <Badge key={provider.id} variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                            {getProviderIcon(provider.provider_type as ProviderType)} {provider.name}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-orange-300">
                        Les données synchronisées via ces services seront conservées, mais ne seront plus mises à jour.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {needsOAuth() ? (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-sm text-primary">
                    🔐 Une nouvelle autorisation OAuth sera nécessaire pour appliquer ces modifications.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-sm text-green-400">
                    ✨ Les modifications seront appliquées immédiatement sans nouvelle autorisation.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!hasChanges() || selectedServices.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Autorisation...
              </>
            ) : (
              'Appliquer les modifications'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
