import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-navy-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {event.title}
          </DialogTitle>
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
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <div>{event.attendees.length} participant(s)</div>
            </div>
          )}

          {(showDelete || showEdit) && (
            <div className="pt-2 border-t border-border flex justify-end gap-2">
              {showEdit && (
                <Button variant="secondary" onClick={onEdit}>
                  Modifier
                </Button>
              )}
              {showDelete && (
                <Button variant="destructive" onClick={onDelete} disabled={deleteLoading}>
                  {deleteLoading ? 'Suppression…' : 'Supprimer'}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsModal;


