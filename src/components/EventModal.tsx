import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ModalActions } from './ModalActions';
import { Event, CreateEventData, UpdateEventData } from '@/hooks/useEvents';
import { useProjects } from '@/hooks/useProjects';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
  onSubmit: (data: CreateEventData | UpdateEventData) => Promise<void>;
  isLoading: boolean;
  initialStart?: Date | string;
}

export const EventModal = ({ isOpen, onClose, event, onSubmit, isLoading, initialStart }: EventModalProps) => {
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    location: '',
    starts_at: '',
    ends_at: '',
    is_all_day: false,
    provider: 'GOOGLE',
    external_id: '',
    attendees: [],
    project: undefined,
  });

  const [attendeesInput, setAttendeesInput] = useState('');
  const { projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>('none');

  const formatLocalDateInput = (d: Date, dateOnly: boolean = false) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    if (dateOnly) {
      return `${year}-${month}-${day}`;
    }
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Initialiser le formulaire avec les données de l'événement existant
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        location: event.location || '',
        starts_at: formatLocalDateInput(new Date(event.starts_at), event.is_all_day),
        ends_at: formatLocalDateInput(new Date(event.ends_at), event.is_all_day),
        is_all_day: event.is_all_day || false,
        provider: event.provider,
        external_id: event.external_id || '',
        attendees: event.attendees || [],
        project: event.project,
      });
      setAttendeesInput(event.attendees?.join(', ') || '');
      setSelectedProject(event.project ? String(event.project) : 'none');
    } else {
      // Réinitialiser le formulaire pour un nouvel événement
      const base = initialStart ? new Date(initialStart) : new Date();
      // Par défaut, proposer 09:00 locale
      base.setHours(9, 0, 0, 0);
      const end = new Date(base.getTime() + 60 * 60 * 1000);

      setFormData({
        title: '',
        location: '',
        starts_at: formatLocalDateInput(base),
        ends_at: formatLocalDateInput(end),
        is_all_day: false,
        provider: 'GOOGLE',
        external_id: '',
        attendees: [],
        project: undefined,
      });
      setAttendeesInput('');
      setSelectedProject('none');
    }
  }, [event, isOpen, initialStart]);

  const handleInputChange = (field: keyof CreateEventData, value: string | boolean) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value } as CreateEventData;
      
      // Si on change le statut all-day
      if (field === 'is_all_day') {
        const isAllDay = value as boolean;
        if (isAllDay) {
          // Convertir en dates seules (début et fin de journée)
          const startDate = new Date(prev.starts_at);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(prev.ends_at);
          endDate.setHours(23, 59, 59, 999);
          next.starts_at = formatLocalDateInput(startDate, true);
          next.ends_at = formatLocalDateInput(endDate, true);
        } else {
          // Convertir en datetime (ajouter une heure par défaut)
          const startDate = new Date(prev.starts_at);
          if (!prev.starts_at.includes('T')) {
            startDate.setHours(9, 0, 0, 0);
          }
          const endDate = new Date(prev.ends_at);
          if (!prev.ends_at.includes('T')) {
            endDate.setHours(10, 0, 0, 0);
          }
          next.starts_at = formatLocalDateInput(startDate);
          next.ends_at = formatLocalDateInput(endDate);
        }
      }
      
      if (field === 'starts_at') {
        const start = new Date(value as string);
        const end = new Date(next.ends_at);
        if (isFinite(start.getTime()) && isFinite(end.getTime()) && end < start) {
          // Forcer la fin à être au moins égale au début
          next.ends_at = value as string;
        }
      }
      return next;
    });
  };

  const handleAttendeesChange = (value: string) => {
    setAttendeesInput(value);
    const attendees = value.split(',').map(email => email.trim()).filter(email => email);
    setFormData(prev => ({ ...prev, attendees }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.starts_at || !formData.ends_at) {
      return;
    }

    // Convertir les dates locales (datetime-local) en ISO UTC pour l'API
    let startsUtc: string;
    let endsUtc: string;
    
    if (formData.is_all_day) {
      // Pour les événements all-day, on envoie le début et la fin de journée en UTC
      const startDate = new Date(formData.starts_at);
      startDate.setHours(0, 0, 0, 0);
      startsUtc = startDate.toISOString();
      
      const endDate = new Date(formData.ends_at);
      endDate.setHours(23, 59, 59, 999);
      endsUtc = endDate.toISOString();
    } else {
      startsUtc = new Date(formData.starts_at).toISOString();
      endsUtc = new Date(formData.ends_at).toISOString();
    }

    const submitData = event 
      ? ({
          ...formData,
          id: event.id,
          starts_at: startsUtc,
          ends_at: endsUtc,
          project: selectedProject !== 'none' ? parseInt(selectedProject) : undefined,
        } as UpdateEventData)
      : ({
          ...formData,
          starts_at: startsUtc,
          ends_at: endsUtc,
          project: selectedProject !== 'none' ? parseInt(selectedProject) : undefined,
        } as CreateEventData);

    await onSubmit(submitData);
  };

  // Validation en temps réel pour les champs requis
  const isFormValid = formData.title.trim() !== '' && 
                     formData.starts_at !== '' && 
                     formData.ends_at !== '' &&
                     (formData.is_all_day 
                       ? new Date(formData.starts_at) <= new Date(formData.ends_at)  // Pour all-day, permettre même jour
                       : new Date(formData.starts_at) < new Date(formData.ends_at)); // Pour les autres, heure de fin doit être après

  const isEditMode = !!event;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-navy-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditMode ? 'Modifier l\'événement' : 'Créer un événement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              Titre *
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Titre de l'événement"
              className={`bg-navy-muted border text-foreground placeholder-muted-foreground focus:ring-gold focus:outline-none transition-colors ${
                formData.title.trim() === '' 
                  ? 'border-destructive focus:border-destructive' 
                  : 'border-border focus:border-gold'
              }`}
              required
            />
          </div>

          {/* Localisation */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
              Localisation
            </label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Lieu de l'événement"
              className="bg-navy-muted border-border text-foreground placeholder-muted-foreground focus:border-gold focus:ring-gold"
            />
          </div>

          {/* Checkbox Toute la journée */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_all_day"
              checked={formData.is_all_day}
              onCheckedChange={(checked) => handleInputChange('is_all_day', checked as boolean)}
              className="border-border data-[state=checked]:bg-gold data-[state=checked]:border-gold"
            />
            <label htmlFor="is_all_day" className="text-sm font-medium text-foreground cursor-pointer">
              Toute la journée
            </label>
          </div>

          {/* Date et heure de début */}
          <div>
            <label htmlFor="starts_at" className="block text-sm font-medium text-foreground mb-2">
              Début *
            </label>
            <Input
              id="starts_at"
              type={formData.is_all_day ? "date" : "datetime-local"}
              value={formData.starts_at}
              onChange={(e) => handleInputChange('starts_at', e.target.value)}
              className={`bg-navy-muted border text-foreground focus:ring-gold focus:outline-none transition-colors ${
                formData.starts_at === '' 
                  ? 'border-destructive focus:border-destructive' 
                  : 'border-border focus:border-gold'
              }`}
              required
            />
          </div>

          {/* Date et heure de fin */}
          <div>
            <label htmlFor="ends_at" className="block text-sm font-medium text-foreground mb-2">
              Fin *
            </label>
            <Input
              id="ends_at"
              type={formData.is_all_day ? "date" : "datetime-local"}
              value={formData.ends_at}
              onChange={(e) => handleInputChange('ends_at', e.target.value)}
              className={`bg-navy-muted border text-foreground focus:ring-gold focus:outline-none transition-colors ${
                formData.ends_at === '' 
                  ? 'border-destructive focus:border-destructive' 
                  : 'border-border focus:border-gold'
              }`}
              required
            />
          </div>

          {/* Fournisseur */}
          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-foreground mb-2">
              Fournisseur
            </label>
            <Select
              value={formData.provider}
              onValueChange={(value) => handleInputChange('provider', value)}
              disabled={true}
            >
              <SelectTrigger className="bg-navy-muted border-border text-foreground focus:border-gold focus:ring-gold disabled:opacity-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-navy-card border-border text-foreground">
                <SelectItem value="GOOGLE">Google</SelectItem>
                <SelectItem value="OUTLOOK">Outlook</SelectItem>
                <SelectItem value="ICAL">iCal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Participants */}
          <div>
            <label htmlFor="attendees" className="block text-sm font-medium text-foreground mb-2">
              Participants
            </label>
            <Input
              id="attendees"
              value={attendeesInput}
              onChange={(e) => handleAttendeesChange(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              className="bg-navy-muted border-border text-foreground placeholder-muted-foreground focus:border-gold focus:ring-gold"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Séparez les emails par des virgules
            </p>
          </div>

          {/* Projet associé */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="project" className="text-sm font-medium text-foreground">
                Projet associé
              </label>
              <Select value={selectedProject} onValueChange={setSelectedProject} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun projet</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Boutons d'action */}
          <ModalActions
            onCancel={onClose}
            onSubmit={() => handleSubmit({} as React.FormEvent)}
            submitText={isEditMode ? 'Modifier' : 'Créer'}
            isLoading={isLoading}
            isSubmitDisabled={!isFormValid}
            isEditMode={isEditMode}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
