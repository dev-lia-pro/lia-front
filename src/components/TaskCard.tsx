import React from 'react';
import { Calendar, AlertTriangle, CheckCircle, Clock, Circle } from 'lucide-react';
// Actions supprimées: ouverture par clic global
import { Task, UpdateTaskData } from '../hooks/useTasks';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProjects } from '@/hooks/useProjects';
import { getIconByValue } from '@/config/icons';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onClick: (task: Task) => void;
  onMarkDone?: (task: Task) => void;
  onAssignProject?: (taskId: number, projectId: number | '') => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onClick,
  onMarkDone,
  onAssignProject,
}) => {
  const { projects } = useProjects();
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'TODO':
      default:
        return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'MEDIUM':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'LOW':
      default:
        return <AlertTriangle className="w-4 h-4 text-green-500" />;
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'Urgente';
      case 'HIGH': return 'Haute';
      case 'MEDIUM': return 'Moyenne';
      case 'LOW': return 'Basse';
      default: return priority;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const isUrgent = task.priority === 'URGENT';
  
  return (
    <div
      className={`group relative flex flex-col gap-2 p-3 rounded-xl border transition-smooth cursor-pointer active:scale-[0.98] overflow-hidden select-none ${
        isUrgent 
          ? 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-400 hover:from-red-500/25 hover:to-red-600/15 dark:bg-gradient-to-br dark:from-red-500/20 dark:to-red-600/10' 
          : 'bg-navy-card border-border hover:border-gold'
      }`}
      onClick={() => onClick(task)}
    >

      {/* En-tête: projet (gauche) et priorité (droite) */}
      <div className="flex items-start justify-between">
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className={`px-2 py-0.5 rounded flex items-center gap-1 text-xs ${isUrgent ? 'bg-red-900/30 border border-red-500/20 hover:bg-red-900/40 text-black dark:text-foreground' : 'bg-muted/10 border border-border hover:bg-muted/20'}`} 
                onClick={(e) => e.stopPropagation()}
                data-no-drag="true"
              >
                {task.project ? (
                  <>
                    <span>{getIconByValue((projects.find(p => p.id === task.project)?.icon) || '')}</span>
                    <span className="truncate max-w-[100px]">{projects.find(p => p.id === task.project)?.title || `Projet #${task.project}`}</span>
                  </>
                ) : (
                  <span className="text-foreground/60">Aucun projet</span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-navy-card border-border text-foreground" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onAssignProject && onAssignProject(task.id, '')} className="cursor-pointer hover:bg-foreground/10">
                Aucun projet
              </DropdownMenuItem>
              {projects.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => onAssignProject && onAssignProject(task.id, p.id)} className="cursor-pointer hover:bg-foreground/10">
                  <span className="mr-2">{getIconByValue(p.icon)}</span>
                  <span>{p.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1">
          {getPriorityIcon(task.priority)}
          <span className={`text-sm ${isUrgent ? 'text-black/70 dark:text-foreground/70' : 'text-foreground/70'}`}>{getPriorityText(task.priority)}</span>
        </div>
      </div>

      {/* Titre de la tâche */}
      <span className={`text-base font-semibold text-center line-clamp-2 break-words ${isUrgent ? 'text-black dark:text-red-100' : 'text-foreground'}`}>
        {task.title}
      </span>

      {/* Description de la tâche (optionnelle) */}
      {task.description && (
        <p className={`text-sm text-center line-clamp-2 break-words ${isUrgent ? 'text-black/70 dark:text-foreground/70' : 'text-foreground/70'}`}>
          {task.description}
        </p>
      )}

      {/* Date d'échéance */}
      {task.due_at && (
        <div className={`flex items-center justify-center gap-2 text-xs ${isUrgent ? 'text-black/70 dark:text-foreground/70' : 'text-foreground/70'}`}>
          <Calendar className="w-3 h-3" />
          <span>Échéance : {formatDate(task.due_at)}</span>
        </div>
      )}

      {/* Espaceur pour maintenir la hauteur constante */}
      {!task.description && !task.due_at && (
        <div className="h-8"></div>
      )}
      {!task.description && task.due_at && (
        <div className="h-4"></div>
      )}
      {task.description && !task.due_at && (
        <div className="h-4"></div>
      )}

      {/* Statut en bas à droite */}
      <div className="absolute bottom-2 right-2">
        {task.status !== 'DONE' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onMarkDone) onMarkDone(task);
            }}
            className="px-2 py-0.5 rounded bg-muted/10 border border-border text-xs text-foreground/80 hover:bg-muted/20 flex items-center gap-1 group/status"
            aria-label="Marquer comme terminé"
            title="Marquer comme terminé"
            data-no-drag="true"
          >
            {getStatusIcon(task.status)}
            <span className="group-hover/status:hidden inline">{getStatusText(task.status)}</span>
            <span className="hidden group-hover/status:inline">Marquer comme terminé</span>
          </button>
        ) : (
          <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-xs text-green-400 flex items-center gap-1">
            {getStatusIcon(task.status)}
            <span>{getStatusText(task.status)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

