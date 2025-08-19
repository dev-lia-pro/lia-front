import React, { useState } from 'react';
import { Plus, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventModal } from './EventModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { EventActions } from './EventActions';
import { EventIcon } from './EventIcon';
import { EmptyState } from './EmptyState';
import { useEvents, Event, CreateEventData, UpdateEventData } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';

export const EventsGrid = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useEvents();
  const { toast } = useToast();

  const handleCreateEvent = async (data: CreateEventData) => {
    try {
      await createEvent.mutateAsync(data);
      setIsCreateModalOpen(false);
      toast({
        title: "Événement créé",
        description: `L'événement "${data.title}" a été créé avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'événement. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateEvent = async (data: UpdateEventData) => {
    try {
      await updateEvent.mutateAsync(data);
      setEditingEvent(null);
      toast({
        title: "Événement modifié",
        description: `L'événement "${data.title}" a été modifié avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'événement. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    
    try {
      await deleteEvent.mutateAsync(deletingEvent.id);
      setDeletingEvent(null);
      toast({
        title: "Événement supprimé",
        description: `L'événement "${deletingEvent.title}" a été supprimé avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleEventClick = (event: Event) => {
    // Ouvrir la vue détaillée de l'événement
    console.log('Opening event:', event.title);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleDeleteEventClick = (event: Event) => {
    setDeletingEvent(event);
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Fonction pour formater l'heure
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <section className="animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Événements ({events?.length || 0})</h3>
          <Button
            size="sm"
            className="bg-gold hover:bg-gold/90 text-navy"
            disabled
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 p-4 bg-navy-card rounded-xl border border-border animate-pulse"
            >
              <div className="w-12 h-12 rounded-full bg-border" />
              <div className="w-16 h-4 bg-border rounded" />
              <div className="w-24 h-3 bg-border rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Événements ({events.length})
        </h3>
        <Button
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gold hover:bg-gold/90 text-navy"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {events.length === 0 ? (
        <EmptyState
          title="Aucun événement pour le moment"
          description="Cliquez sur l'icône ci-dessus pour créer votre premier événement"
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="group relative flex flex-col gap-3 p-4 bg-navy-card rounded-xl border border-border hover:border-gold transition-smooth cursor-pointer active:scale-[0.98]"
              onClick={() => handleEventClick(event)}
            >
              {/* Actions de l'événement */}
              <EventActions
                onEdit={() => handleEditEvent(event)}
                onDelete={() => handleDeleteEventClick(event)}
                eventTitle={event.title}
              />

              {/* Icône du fournisseur */}
              <div className="w-12 h-12 rounded-full border-2 border-gold flex items-center justify-center bg-navy-deep">
                <EventIcon provider={event.provider} size="md" />
              </div>

              {/* Titre de l'événement */}
              <span className="text-sm text-foreground font-medium text-center line-clamp-2">
                {event.title}
              </span>

              {/* Date et heure */}
              <div className="text-xs text-foreground/70 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(event.starts_at)}</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(event.starts_at)} - {formatTime(event.ends_at)}</span>
                </div>
              </div>

              {/* Localisation si disponible */}
              {event.location && (
                <div className="text-xs text-foreground/60 text-center flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              )}

              {/* Nombre de participants si disponible */}
              {event.attendees && event.attendees.length > 0 && (
                <div className="text-xs text-foreground/60 text-center flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{event.attendees.length} participant(s)</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modale de création/modification */}
      <EventModal
        isOpen={isCreateModalOpen || !!editingEvent}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
        isLoading={createEvent.isPending || updateEvent.isPending}
      />

      {/* Modale de confirmation de suppression */}
      <DeleteConfirmModal
        isOpen={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        projectName={deletingEvent?.title || ''}
        onConfirm={handleDeleteEvent}
        isLoading={deleteEvent.isPending}
      />
    </section>
  );
};
