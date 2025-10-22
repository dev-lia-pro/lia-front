import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Settings2, Power, PowerOff, ArrowRight, ArrowLeftRight } from 'lucide-react';
import type { Provider } from '@/types/provider';

interface ProviderItemProps {
  provider: Provider;
  onSync: (provider: Provider) => void;
  onConfigure: (provider: Provider) => void;
  onToggleActive: (id: number) => void;
  onToggleReadOnly: (id: number) => void;
  isSyncing?: boolean;
}

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

const supportsReadWrite = (type: string) => {
  // Seuls les calendriers et contacts supportent la synchronisation bidirectionnelle (lecture/écriture)
  // Gmail, Drive et autres services ne supportent pas ce mode
  return ['GOOGLE_CALENDAR', 'OUTLOOK_CALENDAR', 'GOOGLE_CONTACTS', 'OUTLOOK_CONTACTS', 'ICLOUD_CALENDAR', 'ICLOUD_CONTACTS'].includes(type);
};

export const ProviderItem: React.FC<ProviderItemProps> = ({
  provider,
  onSync,
  onConfigure,
  onToggleActive,
  onToggleReadOnly,
  isSyncing = false,
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50 hover:border-border transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-2xl flex-shrink-0">{getProviderIcon(provider.provider_type)}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground truncate">{provider.name}</span>

            {provider.is_active ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                Actif
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/30 text-xs">
                Inactif
              </Badge>
            )}

            {provider.read_only && supportsReadWrite(provider.provider_type) && (
              <Badge variant="outline" className="bg-muted/50 text-foreground/70 border-border text-xs">
                Lecture seule
              </Badge>
            )}
          </div>

          {provider.last_sync_at && provider.provider_type !== 'GOOGLE_DRIVE' && (
            <p className="text-xs text-foreground/50 mt-0.5">
              Dernière synchro: {new Date(provider.last_sync_at).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onSync(provider)}
          disabled={isSyncing || provider.provider_type === 'GOOGLE_DRIVE'}
          className="h-8 w-8 p-0"
          title="Synchroniser"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onConfigure(provider)}
          className="h-8 w-8 p-0"
          title="Configurer"
        >
          <Settings2 className="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleActive(provider.id)}
          className={`h-8 w-8 p-0 ${provider.is_active ? 'text-green-400' : 'text-gray-400'}`}
          title={provider.is_active ? 'Désactiver' : 'Activer'}
        >
          {provider.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
        </Button>

        {supportsReadWrite(provider.provider_type) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleReadOnly(provider.id)}
            className="h-8 w-8 p-0"
            title={provider.read_only ? 'Activer écriture' : 'Désactiver écriture'}
          >
            {provider.read_only ? <ArrowRight className="w-4 h-4" /> : <ArrowLeftRight className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </div>
  );
};
