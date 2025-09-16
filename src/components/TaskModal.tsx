import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModalActions } from './ModalActions';
import { Task, CreateTaskData, UpdateTaskData } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSubmit: (data: CreateTaskData | UpdateTaskData) => void;
  isLoading?: boolean;
  projects?: Array<{ id: number; title: string }>;
  defaultPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  defaultStatus?: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onSubmit,
  isLoading = false,
  projects = [],
  defaultPriority,
  defaultStatus,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('none');

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      // Mode édition : pré-remplir avec les données de la tâche
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.due_at ? new Date(task.due_at).toISOString().split('T')[0] : '');
      setSelectedProject(task.project?.toString() || 'none');
    } else {
      // Mode création : champs vides ou avec priorité par défaut
      setTitle('');
      setDescription('');
      setStatus(defaultStatus || 'TODO');
      setPriority(defaultPriority || 'MEDIUM');
      setDueDate('');
      setSelectedProject('');
    }
  }, [task, isOpen, defaultPriority, defaultStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      due_at: dueDate || undefined,
      project: selectedProject !== 'none' ? parseInt(selectedProject) : undefined,
    };

    if (isEditing && task) {
      onSubmit({ ...data, id: task.id } as UpdateTaskData);
    } else {
      onSubmit(data);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Réinitialiser les champs quand on ferme la modale
      if (!task) {
        setTitle('');
        setDescription('');
        setStatus(defaultStatus || 'TODO');
        setPriority(defaultPriority || 'MEDIUM');
        setDueDate('');
        setSelectedProject('none');
      }
      onClose();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-500';
      case 'HIGH': return 'text-orange-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'LOW': return 'text-green-500';
      default: return 'text-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'text-green-500';
      case 'IN_PROGRESS': return 'text-blue-500';
      case 'TODO': return 'text-gray-500';
      default: return 'text-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit3 className="w-5 h-5 text-gold" />
                Modifier la tâche
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-gold" />
                Créer une nouvelle tâche
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
              placeholder="Titre de la tâche"
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
              placeholder="Description de la tâche (optionnel)"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium text-foreground">
              Statut
            </label>
            <Select value={status} onValueChange={(value: 'TODO' | 'IN_PROGRESS' | 'DONE') => setStatus(value)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">
                  À faire
                </SelectItem>
                <SelectItem value="IN_PROGRESS">
                  En cours
                </SelectItem>
                <SelectItem value="DONE">
                  Terminé
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium text-foreground">
              Priorité
            </label>
            <Select value={priority} onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => setPriority(value)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">
                  Basse
                </SelectItem>
                <SelectItem value="MEDIUM">
                  Moyenne
                </SelectItem>
                <SelectItem value="HIGH">
                  Haute
                </SelectItem>
                <SelectItem value="URGENT">
                  Urgente
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date d'échéance */}
          <div className="space-y-2">
            <label htmlFor="dueDate" className="text-sm font-medium text-foreground">
              Date d'échéance
            </label>
            <div className="relative">
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isLoading}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
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
            onCancel={handleClose}
            onSubmit={() => handleSubmit({} as React.FormEvent)}
            submitText={isEditing ? 'Modifier' : 'Créer'}
            isLoading={isLoading}
            isSubmitDisabled={!title.trim()}
            isEditMode={isEditing}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
