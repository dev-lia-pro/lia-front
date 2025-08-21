import React from 'react';
import { Calendar, AlertTriangle, CheckCircle, Clock, Circle } from 'lucide-react';
import { TaskActions } from './TaskActions';
import { Task, UpdateTaskData } from '../../hooks/useTasks';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onClick: (task: Task) => void;
  onMarkDone?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onClick,
  onMarkDone,
}) => {
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

  return (
    <div
      className="group relative flex flex-col gap-3 p-4 bg-navy-card rounded-xl border border-border hover:border-gold transition-smooth cursor-pointer active:scale-[0.98]"
      onClick={() => onClick(task)}
    >
      {/* Actions de la tâche */}
      <TaskActions
        onEdit={() => onEdit(task)}
        onDelete={() => onDelete(task)}
        taskTitle={task.title}
      />

      {/* En-tête avec statut et priorité */}
      <div className="flex items-start justify-between">
        {task.status !== 'DONE' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onMarkDone) onMarkDone(task);
            }}
            onMouseEnter={(e) => void 0}
            onMouseLeave={(e) => void 0}
            className="flex items-center gap-2 text-left"
            aria-label="Marquer comme terminé"
            title="Marquer comme terminé"
          >
            {/* Icône hover: coche verte, sinon icône de statut */}
            <span className="relative">
              <span className="block group-hover:hidden">
                {getStatusIcon(task.status)}
              </span>
              <CheckCircle className="w-4 h-4 text-green-500 hidden group-hover:block" />
            </span>
            <span className="text-xs text-foreground/70">
              <span className="group-hover:hidden inline">{getStatusText(task.status)}</span>
              <span className="hidden group-hover:inline">Marquer comme terminé</span>
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {getStatusIcon(task.status)}
            <span className="text-xs text-foreground/70">{getStatusText(task.status)}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          {getPriorityIcon(task.priority)}
          <span className="text-xs text-foreground/70">
            {getPriorityText(task.priority)}
          </span>
        </div>
      </div>

      {/* Titre de la tâche */}
      <span className="text-sm font-medium text-foreground text-center line-clamp-2">
        {task.title}
      </span>

      {/* Description de la tâche (optionnelle) */}
      {task.description && (
        <p className="text-xs text-foreground/70 text-center line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Date d'échéance */}
      {task.due_at && (
        <div className="flex items-center justify-center gap-2 text-xs text-foreground/70">
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

      {/* Checkbox supprimée - l'action est sur le statut en haut à gauche */}
    </div>
  );
};

