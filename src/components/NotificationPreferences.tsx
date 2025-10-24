import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/api/axios';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type NotificationMode = 'none' | 'push_only' | 'push_and_in_app';

interface NotificationPreference {
  label: string;
  mode: NotificationMode;
}

type PushPreferences = Record<string, NotificationPreference>;

export const NotificationPreferences: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notification preferences
  const { data: preferences, isLoading } = useQuery<PushPreferences>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await axios.get('/users/notification-preferences/');
      return response.data;
    },
  });

  // Update notification preferences mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, NotificationMode>) => {
      const response = await axios.post('/users/notification-preferences/', updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: 'Préférences mises à jour',
        description: 'Vos préférences de notifications ont été enregistrées',
      });
    },
    onError: (error) => {
      console.error('Error updating notification preferences:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour vos préférences',
        variant: 'destructive',
      });
    },
  });

  const handleModeChange = (notificationType: string, newMode: NotificationMode) => {
    // Optimistic update
    queryClient.setQueryData(['notification-preferences'], (old: PushPreferences | undefined) => {
      if (!old) return old;
      return {
        ...old,
        [notificationType]: {
          ...old[notificationType],
          mode: newMode,
        },
      };
    });

    // Send update to server
    updateMutation.mutate({ [notificationType]: newMode });
  };

  const getModeLabel = (mode: NotificationMode): string => {
    switch (mode) {
      case 'none':
        return 'Aucune';
      case 'push_only':
        return 'Push uniquement';
      case 'push_and_in_app':
        return 'Push + Notification';
      default:
        return 'Push + Notification';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Impossible de charger les préférences</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-foreground/70 mb-4">
        Pour chaque type de notification, choisissez comment vous souhaitez être notifié :
        <ul className="mt-2 ml-4 space-y-1">
          <li><strong>Aucune :</strong> Désactivé</li>
          <li><strong>Push uniquement :</strong> Notification push mobile seulement</li>
          <li><strong>Push + Notification :</strong> Push mobile + notification in-app (cloche 🔔)</li>
        </ul>
      </div>

      {Object.entries(preferences).map(([type, { label, mode }]) => (
        <div key={type} className="flex items-center justify-between py-3 border-b border-border last:border-0">
          <div className="flex-1">
            <span className="text-foreground font-medium">{label}</span>
          </div>
          <Select
            value={mode}
            onValueChange={(value) => handleModeChange(type, value as NotificationMode)}
            disabled={updateMutation.isPending}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue>{getModeLabel(mode)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune</SelectItem>
              <SelectItem value="push_only">Push uniquement</SelectItem>
              <SelectItem value="push_and_in_app">Push + Notification</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
};
