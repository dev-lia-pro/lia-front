import React, { useState } from 'react';
import { ChevronDown, Power, PowerOff, Edit, Trash2, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProviderItem } from './ProviderItem';
import { CategoryLogo } from './CategoryLogo';
import type { MetaProvider } from '@/types/meta-provider';
import type { Provider } from '@/types/provider';
import { getCategoryIcon, getCategoryColors, getCategoryLabel } from '@/types/meta-provider';

interface MetaProviderCardProps {
  metaProvider: MetaProvider;
  onToggleActive: (id: number) => void;
  onDelete: (metaProvider: MetaProvider) => void;
  onUpdatePermissions: (metaProvider: MetaProvider) => void;
  onSyncProvider: (provider: Provider) => void;
  onConfigureProvider: (provider: Provider) => void;
  onToggleProviderActive: (id: number) => void;
  onToggleProviderReadOnly: (id: number) => void;
  syncingProviderId?: number | null;
}

export const MetaProviderCard: React.FC<MetaProviderCardProps> = ({
  metaProvider,
  onToggleActive,
  onDelete,
  onUpdatePermissions,
  onSyncProvider,
  onConfigureProvider,
  onToggleProviderActive,
  onToggleProviderReadOnly,
  syncingProviderId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = getCategoryColors(metaProvider.category);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className={`rounded-lg border ${colors.border} bg-card overflow-hidden transition-all hover:shadow-md`}>
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-3 flex-1 min-w-0 text-left group">
                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <CategoryLogo category={metaProvider.category} className="w-10 h-10" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">{metaProvider.name}</h3>
                    <Badge variant="outline" className={`${colors.text} border-current/30 text-xs`}>
                      {getCategoryLabel(metaProvider.category)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {metaProvider.is_active ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/30 text-xs">
                        Inactif
                      </Badge>
                    )}

                    <span className="text-xs text-foreground/60">
                      {metaProvider.active_provider_count}/{metaProvider.provider_count} service{metaProvider.provider_count > 1 ? 's' : ''} actif{metaProvider.active_provider_count > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <ChevronDown
                  className={`w-5 h-5 text-foreground/50 transition-transform flex-shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </CollapsibleTrigger>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onUpdatePermissions(metaProvider)}
                className="h-8 px-2"
                title="Modifier les services"
              >
                <Settings2 className="w-4 h-4 mr-1" />
                <span className="text-xs hidden sm:inline">Services</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleActive(metaProvider.id)}
                className={`h-8 w-8 p-0 ${metaProvider.is_active ? 'text-green-400' : 'text-gray-400'}`}
                title={metaProvider.is_active ? 'Désactiver' : 'Activer'}
              >
                {metaProvider.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(metaProvider)}
                className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content - Liste des providers */}
        <CollapsibleContent>
          <div className="border-t border-border/50 p-4 bg-background/50">
            {metaProvider.providers && metaProvider.providers.length > 0 ? (
              <div className="space-y-2">
                {metaProvider.providers.map((provider) => (
                  <ProviderItem
                    key={provider.id}
                    provider={provider}
                    onSync={onSyncProvider}
                    onConfigure={onConfigureProvider}
                    onToggleActive={onToggleProviderActive}
                    onToggleReadOnly={onToggleProviderReadOnly}
                    isSyncing={syncingProviderId === provider.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-foreground/50 text-sm">
                Aucun service configuré
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
