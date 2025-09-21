import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Check, AlertCircle, Clock as ClockIcon, Mail, MessageSquare } from 'lucide-react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import type { Event } from '@/hooks/useEvents';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  showDelete?: boolean;
  onDelete?: () => void;
  showEdit?: boolean;
  onEdit?: () => void;
  deleteLoading?: boolean;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  showDelete = false,
  onDelete,
  showEdit = false,
  onEdit,
  deleteLoading = false,
}) => {
  if (!event) return null;

  const starts = new Date(event.starts_at);
  const ends = new Date(event.ends_at);

  const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const fmtTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });


  const getProviderDisplay = (providerType?: string) => {
    const providers: Record<string, { icon: React.ReactNode; label: string }> = {
      'GMAIL': { icon: <Mail className="h-4 w-4" />, label: 'Gmail' },
      'GOOGLE_CALENDAR': { icon: <Calendar className="h-4 w-4" />, label: 'Google Calendar' },
      'SMS': { icon: <MessageSquare className="h-4 w-4" />, label: 'SMS' },
      'WHATSAPP': { icon: <MessageSquare className="h-4 w-4" />, label: 'WhatsApp' },
      'OUTLOOK': { icon: <Mail className="h-4 w-4" />, label: 'Outlook' },
      'OUTLOOK_CALENDAR': { icon: <Calendar className="h-4 w-4" />, label: 'Outlook Calendar' },
    };

    if (!providerType) return null;
    return providers[providerType] || null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-navy-card border-border text-foreground max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-foreground truncate">
              {event.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {showEdit && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-border hover:bg-navy-muted" onClick={onEdit} aria-label="Modifier">
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {showDelete && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-border hover:bg-navy-muted" onClick={onDelete} disabled={deleteLoading} aria-label="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-1" />
            <div className="text-sm">
              <div className="capitalize">{fmtDate(starts)}</div>
              {fmtDate(starts) !== fmtDate(ends) && (
                <div className="capitalize">{fmtDate(ends)}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <div>
              {fmtTime(starts)} — {fmtTime(ends)}
            </div>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <div>{event.location}</div>
            </div>
          )}

          {!!event.attendees?.length && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <div>{event.attendees.length} participant(s)</div>
              </div>
              {/* Show more details if available in metadata */}
              {event.provider_metadata?.attendee_details && (
                <div className="ml-6 text-xs space-y-1">
                  {event.provider_metadata.attendee_details.slice(0, 3).map((attendee, i) => (
                    <div key={i} className="text-muted-foreground">
                      {attendee.name || attendee.email}
                    </div>
                  ))}
                  {event.provider_metadata.attendee_details.length > 3 && (
                    <div className="text-muted-foreground">
                      +{event.provider_metadata.attendee_details.length - 3} autres
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Show organizer if available in metadata */}
          {event.provider_metadata?.organizer && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <div>Organisateur: {event.provider_metadata.organizer}</div>
            </div>
          )}

          {/* Show online meeting info if available */}
          {event.provider_metadata?.is_online_meeting && event.provider_metadata?.online_meeting_url && (
            <div className="flex items-center gap-2 text-sm">
              <a
                href={event.provider_metadata.online_meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Rejoindre la réunion en ligne
              </a>
            </div>
          )}

          {event.provider_type && (
            <div className="flex items-center gap-2 text-sm">
              {getProviderDisplay(event.provider_type)?.icon}
              <div>Source: {getProviderDisplay(event.provider_type)?.label}</div>
            </div>
          )}

          {event.provider_type === 'GOOGLE_CALENDAR' && event.sync_status && (
            <div className="flex items-center gap-2 text-sm">
              {event.sync_status === 'SYNCED' && (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <div className="text-green-500">Synchronisé avec Google Calendar</div>
                </>
              )}
              {event.sync_status === 'PENDING' && (
                <>
                  <ClockIcon className="h-4 w-4 text-yellow-500" />
                  <div className="text-yellow-500">Synchronisation en attente</div>
                </>
              )}
              {event.sync_status === 'FAILED' && (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <div className="text-red-500">
                    Échec de synchronisation
                    {event.sync_error && <div className="text-xs mt-1">{event.sync_error}</div>}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="pt-4 pb-0 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsModal;


