import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import type { Project } from '@/hooks/useProjects';
import { ProjectIcon } from './ProjectIcon';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onEdit?: () => void;
  onDelete?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
  deleteLoading?: boolean;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  isOpen,
  onClose,
  project,
  onEdit,
  onDelete,
  showEdit = true,
  showDelete = true,
  deleteLoading = false,
}) => {
  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-navy-card border-border text-foreground max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-foreground truncate flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-gold">
                <ProjectIcon icon={project.icon} size="sm" />
              </span>
              <span className="truncate">{project.title}</span>
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

        <div className="space-y-3">
          {project.description && (
            <div className="text-sm text-foreground/80 whitespace-pre-wrap">{project.description}</div>
          )}

          <div className="pt-4 pb-0 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailsModal;


