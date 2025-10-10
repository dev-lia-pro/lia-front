import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Calendar, AlertTriangle, Mail, MessageSquare, ExternalLink, Users } from 'lucide-react';
import type { Task } from '@/hooks/useTasks';
import { useMessage } from '@/hooks/useMessages';
import { useProjects } from '@/hooks/useProjects';
import { MessageDetailsDialog } from '@/components/MessageDetailsDialog';
import axios from '@/api/axios';
import { useToast } from '@/hooks/use-toast';

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
  const [showSourceMessage, setShowSourceMessage] = React.useState(false);
  const [attachmentStates, setAttachmentStates] = React.useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const { projects } = useProjects();

  // Récupérer le message source
  const { message: sourceMessage, isLoading: isLoadingMessage } = useMessage(
    showSourceMessage && task?.source_message ? task.source_message : null
  );

  if (!task) return null;

  const handleSourceMessageClick = () => {
    setShowSourceMessage(true);
  };

  const handleCloseSourceMessage = () => {
    setShowSourceMessage(false);
  };

  const handleSaveInDrive = async (attachmentId: number, messageId: number, isCurrentlyInDrive: boolean) => {
    setAttachmentStates(prev => ({
      ...prev,
      [attachmentId]: !isCurrentlyInDrive
    }));

    try {
      const response = await axios.post(`/messages/${messageId}/attachments/${attachmentId}/save_in_drive/`, {
        google_drive_backup: !isCurrentlyInDrive
      });

      if (response.data.success) {
        toast({
          title: isCurrentlyInDrive ? "Fichier supprimé de Google Drive" : "Fichier stocké dans Google Drive",
          description: response.data.message,
        });
      } else {
        setAttachmentStates(prev => ({
          ...prev,
          [attachmentId]: isCurrentlyInDrive
        }));
      }
    } catch (error: any) {
      setAttachmentStates(prev => ({
        ...prev,
        [attachmentId]: isCurrentlyInDrive
      }));

      const errorMessage = error.response?.data?.error || "Une erreur est survenue";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleAssignProject = async (messageId: number, projectId: number | '') => {
    const newProjectId = projectId === '' ? null : projectId;

    try {
      await axios.patch(`/messages/${messageId}/`, { project: newProjectId });
      toast({
        title: "Projet modifié",
        description: "Le projet du message a été mis à jour",
      });
    } catch (e) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le projet",
        variant: "destructive",
      });
    }
  };

  const getProviderDisplay = (providerType?: string) => {
    const providers: Record<string, { icon: React.ReactNode; label: string }> = {
      'GMAIL': { icon: <Mail className="h-4 w-4" />, label: 'Gmail' },
      'GOOGLE_CALENDAR': { icon: <Calendar className="h-4 w-4" />, label: 'Google Calendar' },
      'SMS': { icon: <MessageSquare className="h-4 w-4" />, label: 'SMS' },
      'WHATSAPP': { icon: <MessageSquare className="h-4 w-4" />, label: 'WhatsApp' },
      'OUTLOOK': { icon: <Mail className="h-4 w-4" />, label: 'Outlook' },
      'OUTLOOK_CALENDAR': { icon: <Calendar className="h-4 w-4" />, label: 'Outlook Calendar' },
      'ICLOUD_MAIL': { icon: <Mail className="h-4 w-4" />, label: 'iCloud Mail' },
      'ICLOUD_CALENDAR': { icon: <Calendar className="h-4 w-4" />, label: 'iCloud Calendar' },
      'ICLOUD_CONTACTS': { icon: <Users className="h-4 w-4" />, label: 'iCloud Contacts' },
    };

    if (!providerType) return null;
    return providers[providerType] || null;
  };

  return (
    <>
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

          {task.source_provider_type && (
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              {getProviderDisplay(task.source_provider_type)?.icon}
              <div>Source: {getProviderDisplay(task.source_provider_type)?.label}</div>
            </div>
          )}

          {task.source_message && (
            <button
              onClick={handleSourceMessageClick}
              className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Voir le message source</span>
            </button>
          )}

          <div className="pt-4 pb-0 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Dialog du message source */}
    {showSourceMessage && sourceMessage && (
      <MessageDetailsDialog
        message={sourceMessage}
        projects={projects}
        onClose={handleCloseSourceMessage}
        onSaveInDrive={handleSaveInDrive}
        attachmentStates={attachmentStates}
        onContactClick={() => {}} // Pas de gestion des contacts dans ce contexte
        onAssignProject={handleAssignProject}
      />
    )}
  </>
  );
};

export default TaskDetailsModal;


