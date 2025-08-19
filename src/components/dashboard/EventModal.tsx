import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModalActions } from './ModalActions';
import { Event, CreateEventData, UpdateEventData } from '@/hooks/useEvents';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
  onSubmit: (data: CreateEventData | UpdateEventData) => Promise<void>;
  isLoading: boolean;
}

export const EventModal = ({ isOpen, onClose, event, onSubmit, isLoading }: EventModalProps) => {
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

  // Initialiser le formulaire avec les données de l'événement existant
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        location: event.location || '',
        starts_at: event.starts_at.slice(0, 16), // Format datetime-local
        ends_at: event.ends_at.slice(0, 16),
        provider: event.provider,
        external_id: event.external_id || '',
        attendees: event.attendees || [],
        project: event.project,
      });
      setAttendeesInput(event.attendees?.join(', ') || '');
    } else {
      // Réinitialiser le formulaire pour un nouvel événement
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      
      setFormData({
        title: '',
        location: '',
        starts_at: now.toISOString().slice(0, 16),
        ends_at: inOneHour.toISOString().slice(0, 16),
        provider: 'GOOGLE',
        external_id: '',
        attendees: [],
        project: undefined,
      });
      setAttendeesInput('');
    }
  }, [event, isOpen]);

  const handleInputChange = (field: keyof CreateEventData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    const submitData = event 
      ? { ...formData, id: event.id } as UpdateEventData
      : formData as CreateEventData;

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

          {/* ID externe */}
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
