import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    provider: 'GOOGLE',
    external_id: '',
    attendees: [],
    project: undefined,
  });

  const [attendeesInput, setAttendeesInput] = useState('');
  const { projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>('none');

  const formatLocalDateInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
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
        starts_at: formatLocalDateInput(new Date(event.starts_at)),
        ends_at: formatLocalDateInput(new Date(event.ends_at)),
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
        provider: 'GOOGLE',
        external_id: '',
        attendees: [],
        project: undefined,
      });
      setAttendeesInput('');
      setSelectedProject('none');
    }
  }, [event, isOpen, initialStart]);

  const handleInputChange = (field: keyof CreateEventData, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value } as CreateEventData;
      if (field === 'starts_at') {
        const start = new Date(value);
        const end = new Date(next.ends_at);
        if (isFinite(start.getTime()) && isFinite(end.getTime()) && end < start) {
          // Forcer la fin à être au moins égale au début
          next.ends_at = value;
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
    const startsUtc = new Date(formData.starts_at).toISOString();
    const endsUtc = new Date(formData.ends_at).toISOString();

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
                     new Date(formData.starts_at) < new Date(formData.ends_at);

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

          {/* Date et heure de début */}
          <div>
            <label htmlFor="starts_at" className="block text-sm font-medium text-foreground mb-2">
              Début *
            </label>
            <Input
              id="starts_at"
              type="datetime-local"
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
              type="datetime-local"
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
            >
              <SelectTrigger className="bg-navy-muted border-border text-foreground focus:border-gold focus:ring-gold">
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

          {/* ID externe: visible uniquement en édition */}
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
          {isEditMode && (
            <div>
              <label htmlFor="external_id" className="block text-sm font-medium text-foreground mb-2">
                ID externe
              </label>
              <Input
                id="external_id"
                value={formData.external_id}
                onChange={(e) => handleInputChange('external_id', e.target.value)}
                placeholder="ID de l'événement externe"
                className="bg-navy-muted border-border text-foreground placeholder-muted-foreground focus:border-gold focus:ring-gold"
              />
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
