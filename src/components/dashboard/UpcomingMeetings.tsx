import React, { useState, useMemo } from 'react';
import { Plus, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventModal } from './EventModal';
import EventDetailsModal from './EventDetailsModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { EventActions } from './EventActions';
import { EventIcon } from './EventIcon';
import { EmptyState } from './EmptyState';
import { useEvents, Event, CreateEventData, UpdateEventData } from '@/hooks/useEvents';
import { useProjectStore } from '@/stores/projectStore';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProjects } from '@/hooks/useProjects';
import { getIconByValue } from '@/config/icons';

export const UpcomingMeetings = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<Event | null>(null);
  
  // Utiliser un seul hook avec des filtres optimisés
  const { selected } = useProjectStore();
  const filters = useMemo(() => {
    const now = new Date();
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);
    return {
      date_from: now.toISOString(),
      date_to: endOfWeek.toISOString(),
      project: selected.id ?? undefined,
    };
  }, [selected.id]);

  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useEvents(filters);
  const { projects } = useProjects();
  const { toast } = useToast();

  // Séparer les événements du jour et à venir
  const todayEvents = useMemo(() => {
    const now = new Date();
    return events.filter(event => {
      const start = new Date(event.starts_at);
      const end = new Date(event.ends_at);
      const isToday = start.toDateString() === now.toDateString() || end.toDateString() === now.toDateString();
      const ongoingOrFuture = end >= now; // inclut les événements en cours
      return isToday && ongoingOrFuture;
    });
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events.filter(event => {
      const start = new Date(event.starts_at);
      const end = new Date(event.ends_at);
      const isToday = start.toDateString() === now.toDateString() || end.toDateString() === now.toDateString();
      const ongoingOrFuture = end >= now; // inclut les événements en cours
      return !isToday && ongoingOrFuture;
    });
  }, [events]);

  // Combiner les événements du jour et à venir, en priorisant ceux du jour
  const allEvents = [...todayEvents, ...upcomingEvents];

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

  const handleAssignEventProject = async (eventId: number, projectId: number | '') => {
    try {
      await updateEvent.mutateAsync({ id: eventId, project: projectId === '' ? null : (projectId as number) });
    } catch (error) {
      // silencieux
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedDetailEvent(event);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleDeleteEventClick = (event: Event) => {
    setDeletingEvent(event);
  };

  // Fonction pour formater l'heure
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  // Formater date sans libellés relatifs (pour les plages multi-jours)
  const formatDatePlain = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long'
    });
  };

  const isMultiDay = (startString: string, endString: string) => {
    const s = new Date(startString);
    const e = new Date(endString);
    return s.toDateString() !== e.toDateString();
  };

  // Fonction pour vérifier si un événement est aujourd'hui
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (isLoading) {
    return (
      <section className="animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Réunions à venir</h3>
          <Button size="sm" className="h-9 w-9 p-0 border border-gold bg-gold text-primary-foreground" disabled>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="p-4 bg-navy-card border border-border rounded-xl animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-border rounded" />
                <div className="flex-1">
                  <div className="w-24 h-4 bg-border rounded mb-2" />
                  <div className="w-32 h-3 bg-border rounded" />
                </div>
              </div>
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
          Réunions à venir ({allEvents.length})
        </h3>
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="h-9 w-9 p-0 border border-gold bg-gold hover:bg-gold/90 text-primary-foreground" aria-label="Créer un événement" title="Créer un événement">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {allEvents.length === 0 ? (
        <EmptyState
          title="Aucune réunion prévue"
          description="Cliquez sur l'icône ci-dessus pour créer votre premier événement"
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {allEvents.map((event) => (
            <div
              key={event.id}
              className={`group relative p-4 rounded-xl border transition-smooth cursor-pointer active:scale-[0.98] bg-navy-card border-border hover:border-gold`}
              onClick={() => handleEventClick(event)}
            >
              
              {/* Actions supprimées: ouverture par clic global */}

              <div className="flex items-center gap-3">
                {/* Icône du fournisseur */}
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center bg-navy-deep flex-shrink-0 border-border`}>
                  <EventIcon provider={event.provider} size="sm" />
                </div>

                <div className="flex-1 min-w-0">
                  {
                    <div className="mb-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="px-2 py-0.5 rounded bg-muted/10 border border-border flex items-center gap-1 hover:bg-muted/20 text-xs"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Affecter un projet"
                            title="Affecter un projet"
                          >
                            {event.project ? (
                              <>
                                <span>{getIconByValue((projects.find(p => p.id === event.project)?.icon) || '')}</span>
                                <span className="truncate max-w-[160px]">{projects.find(p => p.id === event.project)?.title || `Projet #${event.project}`}</span>
                              </>
                            ) : (
                              <span className="text-foreground/60">Aucun projet</span>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-navy-card border-border text-foreground" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => handleAssignEventProject(event.id, '')} className="cursor-pointer hover:bg-navy-muted">
                            Aucun projet
                          </DropdownMenuItem>
                          {projects.map((p) => (
                            <DropdownMenuItem key={p.id} onClick={() => handleAssignEventProject(event.id, p.id)} className="cursor-pointer hover:bg-navy-muted">
                              <span className="mr-2">{getIconByValue(p.icon)}</span>
                              <span>{p.title}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  }
                  {/* Titre et heure */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold text-sm text-foreground`}>
                      {formatTime(event.starts_at)}
                    </span>
                    <span className="text-foreground font-medium text-sm truncate">
                      {event.title}
                    </span>
                    {isToday(event.starts_at) && (
                      <span className="text-xs bg-muted/10 text-foreground px-2 py-1 rounded-full border border-border">
                        Aujourd'hui
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-xs text-foreground/70 mb-2">
                    {isMultiDay(event.starts_at, event.ends_at)
                      ? `${formatDatePlain(event.starts_at)} - ${formatDatePlain(event.ends_at)}`
                      : formatDate(event.starts_at)}
                  </div>

                  {/* Localisation */}
                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-foreground/60 mb-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}

                  {/* Participants */}
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-foreground/60">
                      <Users className="w-3 h-3" />
                      <span>{event.attendees.length} participant(s)</span>
                    </div>
                  )}
                </div>
              </div>
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

      {/* Modale de détails */}
      <EventDetailsModal
        isOpen={!!selectedDetailEvent}
        onClose={() => setSelectedDetailEvent(null)}
        event={selectedDetailEvent}
        showEdit={true}
        showDelete={true}
        onEdit={() => {
          if (selectedDetailEvent) {
            setEditingEvent(selectedDetailEvent);
            setSelectedDetailEvent(null);
          }
        }}
        onDelete={() => {
          if (selectedDetailEvent) {
            setDeletingEvent(selectedDetailEvent);
            setSelectedDetailEvent(null);
          }
        }}
      />

      {/* Modale de confirmation de suppression */}
      <DeleteConfirmModal
        isOpen={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleDeleteEvent}
        title="Supprimer l'événement"
        message={`Êtes-vous sûr de vouloir supprimer l'événement "${deletingEvent?.title}" ? Cette action est irréversible.`}
        loading={deleteEvent.isPending}
      />
    </section>
  );
};