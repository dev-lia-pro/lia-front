import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ModalActions } from './ModalActions';
import { Project, CreateProjectData, UpdateProjectData } from '../../hooks/useProjects';
import { ICON_PACK } from '../../config/icons';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  onSubmit: (data: CreateProjectData | UpdateProjectData) => void;
  isLoading?: boolean;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSubmit,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');

  const isEditing = !!project;

  useEffect(() => {
    if (project) {
      // Mode édition : pré-remplir avec les données du projet
      setTitle(project.title);
      setDescription(project.description);
      setSelectedIcon(project.icon);
    } else {
      // Mode création : champs vides
      setTitle('');
      setDescription('');
      setSelectedIcon('');
    }
  }, [project, isOpen]); // Ajouter isOpen pour réinitialiser quand la modale s'ouvre

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !selectedIcon) {
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim(),
      icon: selectedIcon,
    };

    if (isEditing && project) {
      onSubmit({ ...data, id: project.id } as UpdateProjectData);
    } else {
      onSubmit(data);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Réinitialiser les champs quand on ferme la modale
      if (!project) {
        setTitle('');
        setDescription('');
        setSelectedIcon('');
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>Modifier le projet</>
            ) : (
              <>
                <Plus className="w-5 h-5 text-gold" />
                Créer un nouveau projet
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Titre *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom du projet"
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du projet (optionnel)"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Sélecteur d'icône */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Icône *
            </label>
            <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto overflow-x-hidden pt-2">
              {ICON_PACK.map((iconOption) => (
                <button
                  key={iconOption.value}
                  type="button"
                  onClick={() => setSelectedIcon(iconOption.value)}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-all duration-200 hover:scale-[1.02] transform-gpu will-change-transform p-1 overflow-hidden ${
                    selectedIcon === iconOption.value
                      ? 'border-gold bg-gold/10'
                      : 'border-border hover:border-gold/50'
                  }`}
                  disabled={isLoading}
                >
                  {iconOption.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Boutons d'action */}
          <ModalActions
            onCancel={handleClose}
            onSubmit={() => handleSubmit({} as React.FormEvent)}
            submitText={isEditing ? 'Modifier' : 'Créer'}
            isLoading={isLoading}
            isSubmitDisabled={!title.trim() || !selectedIcon}
            isEditMode={isEditing}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
