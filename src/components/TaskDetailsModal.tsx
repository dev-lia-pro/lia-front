import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import type { Task } from '@/hooks/useTasks';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  showEdit?: boolean;
  onEdit?: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
  deleteLoading?: boolean;
}

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'URGENT': return 'Urgente';
    case 'HIGH': return 'Haute';
    case 'MEDIUM': return 'Moyenne';
    case 'LOW': return 'Basse';
    default: return priority;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'DONE': return 'Terminé';
    case 'IN_PROGRESS': return 'En cours';
    case 'TODO': return 'À faire';
    default: return status;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  task,
  showEdit = false,
  onEdit,
  showDelete = false,
  onDelete,
  deleteLoading = false,
}) => {
  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-navy-card border-border text-foreground max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-foreground break-words pr-2 flex-1">{task.title}</DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
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
          {task.description && (
            <div className="text-sm text-foreground/80 whitespace-pre-wrap">{task.description}</div>
          )}

          {task.due_at && (
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <Calendar className="h-4 w-4" />
              <div>Échéance: {formatDate(task.due_at)}</div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <AlertTriangle className="h-4 w-4" />
            <div>Priorité: {getPriorityText(task.priority)}</div>
          </div>

          <div className="pt-4 pb-0 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;


