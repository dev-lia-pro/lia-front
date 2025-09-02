import React, { useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTasks, Task, CreateTaskData, UpdateTaskData } from '@/hooks/useTasks';
import { useProjectStore } from '@/stores/projectStore';
import { useProjects } from '@/hooks/useProjects';
import { TaskCard } from './TaskCard';
import TaskDetailsModal from './TaskDetailsModal';
import { TaskModal } from './TaskModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from './EmptyState';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useIsTouchDevice } from '@/hooks/use-touch-device';

export const UrgentTasks = () => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Statut de création par défaut (selon la colonne +)
  const [createDefaultStatus, setCreateDefaultStatus] = useState<'TODO' | 'IN_PROGRESS'>('TODO');
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();
  
  // Récupérer les tâches (filtrées par projet sélectionné)
  const { selected } = useProjectStore();
  
  // Deux requêtes séparées pour les tâches urgentes
  const { tasks: urgentTodo, isLoading: isLoadingTodo, updateTask, deleteTask, createTask, reorderTask } = useTasks({ 
    project: selected.id ?? undefined, 
    priority: 'URGENT', 
    status: 'TODO' 
  });
  const { tasks: urgentInProgress, isLoading: isLoadingInProgress } = useTasks({ 
    project: selected.id ?? undefined, 
    priority: 'URGENT', 
    status: 'IN_PROGRESS' 
  });
  
  const { projects } = useProjects();
  const { toast } = useToast();
  
  // Calculer le total des tâches urgentes
  const allUrgentTasks = [...urgentTodo, ...urgentInProgress];
  
  const isLoading = isLoadingTodo || isLoadingInProgress;

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleEditTask = async (task: Task) => {
    setEditingTask(task);
  };

  const handleDeleteTask = (task: Task) => {
    setDeletingTask(task);
  };

  const handleUpdateTask = async (data: UpdateTaskData) => {
    try {
      await updateTask.mutateAsync(data);
      setEditingTask(null);
      toast({
        title: "Tâche modifiée",
        description: `La tâche "${data.title}" a été modifiée avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la tâche. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTaskConfirm = async () => {
    if (!deletingTask) return;
    
    try {
      await deleteTask.mutateAsync(deletingTask.id);
      setDeletingTask(null);
      toast({
        title: "Tâche supprimée",
        description: `La tâche "${deletingTask.title}" a été supprimée avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleMarkDone = async (task: Task) => {
    try {
      const payload: UpdateTaskData = { id: task.id, status: 'DONE' };
      await updateTask.mutateAsync(payload);
      toast({
        title: 'Tâche terminée',
        description: `La tâche "${task.title}" a été marquée comme faite.`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer la tâche comme faite. Veuillez réessayer.',
        variant: 'destructive',
      });
    }
  };

  const handleAssignProject = async (taskId: number, projectId: number | '') => {
    try {
      await updateTask.mutateAsync({ id: taskId, project: projectId === '' ? null : (projectId as number) } as UpdateTaskData);
    } catch (error) {
      // silencieux
    }
  };

  // Drag & Drop handlers
  const handleDropSimple = async (data: any, targetStatus: Task['status']) => {
    try {
      const { id, status: sourceStatus, priority } = data;
      
      // Si c'est déjà une tâche urgente avec le même statut, ne rien faire
      if (sourceStatus === targetStatus && priority === 'URGENT') return;
      
      const updatePayload: UpdateTaskData = { id, status: targetStatus, priority: 'URGENT' };
      
      // D'abord mettre à jour le statut et la priorité
      await updateTask.mutateAsync(updatePayload);
      
      // Puis placer en première position (index 0)
      await reorderTask.mutateAsync({
        id: id,
        target_index: 0
      });
      
      const statusLabel = targetStatus === 'TODO' ? 'À faire' : 'En cours';
      toast({ title: 'Tâche urgente déplacée', description: `La tâche a été déplacée en haut de la colonne urgente "${statusLabel}".` });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de déplacer la tâche.', variant: 'destructive' });
    }
  };

  const handleDropWithPosition = async (data: any, targetIndex: number, targetStatus: Task['status']) => {
    try {
      // Appeler le nouvel endpoint reorder avec les paramètres pour colonne urgente
      await reorderTask.mutateAsync({
        id: data.id,
        target_position: targetIndex,
        target_status: targetStatus,
        target_is_urgent: true // Toujours urgent dans UrgentTasks
      });
      
      // Message de succès
      const statusLabel = targetStatus === 'TODO' ? 'À faire' : 'En cours';
      const oldIsUrgent = data.priority === 'URGENT';
      
      if (data.status !== targetStatus || !oldIsUrgent) {
        const priorityMessage = !oldIsUrgent ? ' (priorité augmentée à urgente)' : '';
        toast({ title: 'Tâche déplacée', description: `La tâche a été déplacée vers la section urgente "${statusLabel}"${priorityMessage}.` });
      } else {
        toast({ title: 'Tâche réordonnée', description: 'La position de la tâche a été mise à jour.' });
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de déplacer la tâche.', variant: 'destructive' });
    }
  };

  const { draggedItemId, dragOverStatus, dropIndicatorIndex, handlers } = useDragAndDrop({
    onDrop: handleDropSimple,
    onDropVertical: handleDropWithPosition
  });

  const handleCreateTask = async (data: CreateTaskData) => {
    try {
      // S'assurer que la priorité est URGENT
      const urgentTaskData = { ...data, priority: 'URGENT' as const };
      await createTask.mutateAsync(urgentTaskData);
      setIsCreateModalOpen(false);
      toast({
        title: "Tâche urgente créée",
        description: `La tâche urgente "${data.title}" a été créée avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche urgente. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <section className="animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-foreground">
            Tâches urgentes
          </h3>
          <Button size="sm" className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground" disabled>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className={`${isMobile ? 'flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
          {[...Array(2)].map((_, index) => (
            <div key={index} className={`${isMobile ? 'w-[240px] flex-shrink-0 snap-center' : ''} p-3 bg-card/30 border border-border rounded-xl animate-pulse`}>
              <div className="h-5 w-24 bg-border rounded mb-4" />
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-4 bg-card border border-border rounded-xl mb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-16 h-3 bg-border rounded" />
                    <div className="w-12 h-3 bg-border rounded" />
                  </div>
                  <div className="w-full h-4 bg-border rounded mb-2" />
                  <div className="w-3/4 h-3 bg-border rounded mb-3" />
                  <div className="w-20 h-3 bg-border rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  }


  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-foreground">
          Tâches urgentes ({allUrgentTasks.length})
        </h3>
      </div>
      <div className={`${isMobile ? 'flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
        {/* Urgent - À faire */}
        <div
          className={`${isMobile ? 'w-[240px] flex-shrink-0 snap-center' : ''} p-3 bg-card/30 rounded-xl border ${dragOverStatus === 'TODO' ? 'border-primary' : 'border-border'} transition-smooth`}
          data-drop-zone="TODO"
          onDragOver={(e) => urgentTodo.length === 0 ? handlers.onDragOver(e, 'TODO') : e.preventDefault()}
          onDragLeave={handlers.onDragLeave}
          onDrop={(e) => urgentTodo.length === 0 ? handlers.onDrop(e, 'TODO') : e.preventDefault()}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold">À faire ({urgentTodo.length})</h4>
            <Button size="icon" onClick={() => { setCreateDefaultStatus('TODO'); setIsCreateModalOpen(true); }} className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2 min-h-[60px]">
            {urgentTodo.length === 0 && (
              <div className="p-3 text-xs text-foreground/60 bg-card rounded border border-border text-center">
                Aucune tâche urgente pour le moment
              </div>
            )}
            {urgentTodo.map((task, index) => (
              <div key={task.id} className="relative">
                {dropIndicatorIndex?.column === 'URGENT_TODO' && dropIndicatorIndex.index === index && (
                  <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded z-10" />
                )}
                <div 
                  draggable={!isTouchDevice}
                  data-task-index={index}
                  data-task-column="URGENT_TODO"
                  onDragStart={!isTouchDevice ? (e) => handlers.onDragStart(e, task) : undefined}
                  onDragOver={!isTouchDevice ? (e) => handlers.onDragOverVertical(e, index, 'URGENT_TODO') : undefined}
                  onDrop={!isTouchDevice ? (e) => handlers.onDropVertical(e, 'TODO') : undefined}
                  onDragEnd={!isTouchDevice ? handlers.onDragEnd : undefined}
                  onTouchStart={(e) => handlers.onTouchStart(e, task)}
                  onTouchMove={handlers.onTouchMove}
                  onTouchEnd={handlers.onTouchEnd}
                  onTouchCancel={handlers.onTouchCancel}
                  className={draggedItemId === task.id ? 'opacity-50' : ''}
                >
                  <TaskCard
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onClick={handleTaskClick}
                    onMarkDone={handleMarkDone}
                    onAssignProject={handleAssignProject}
                  />
                </div>
              </div>
            ))}
            {dropIndicatorIndex?.column === 'URGENT_TODO' && dropIndicatorIndex.index === urgentTodo.length && (
              <div className="h-0.5 bg-primary rounded" />
            )}
          </div>
        </div>

        {/* Urgent - En cours */}
        <div
          className={`${isMobile ? 'w-[240px] flex-shrink-0 snap-center' : ''} p-3 bg-card/30 rounded-xl border ${dragOverStatus === 'IN_PROGRESS' ? 'border-primary' : 'border-border'} transition-smooth`}
          data-drop-zone="IN_PROGRESS"
          onDragOver={(e) => urgentInProgress.length === 0 ? handlers.onDragOver(e, 'IN_PROGRESS') : e.preventDefault()}
          onDragLeave={handlers.onDragLeave}
          onDrop={(e) => urgentInProgress.length === 0 ? handlers.onDrop(e, 'IN_PROGRESS') : e.preventDefault()}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold">En cours ({urgentInProgress.length})</h4>
            <Button size="icon" onClick={() => { setCreateDefaultStatus('IN_PROGRESS'); setIsCreateModalOpen(true); }} className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2 min-h-[60px]">
            {urgentInProgress.length === 0 && (
              <div className="p-3 text-xs text-foreground/60 bg-card rounded border border-border text-center">
                Aucune tâche urgente pour le moment
              </div>
            )}
            {urgentInProgress.map((task, index) => (
              <div key={task.id} className="relative">
                {dropIndicatorIndex?.column === 'URGENT_IN_PROGRESS' && dropIndicatorIndex.index === index && (
                  <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded z-10" />
                )}
                <div 
                  draggable={!isTouchDevice}
                  data-task-index={index}
                  data-task-column="URGENT_IN_PROGRESS"
                  onDragStart={!isTouchDevice ? (e) => handlers.onDragStart(e, task) : undefined}
                  onDragOver={!isTouchDevice ? (e) => handlers.onDragOverVertical(e, index, 'URGENT_IN_PROGRESS') : undefined}
                  onDrop={!isTouchDevice ? (e) => handlers.onDropVertical(e, 'IN_PROGRESS') : undefined}
                  onDragEnd={!isTouchDevice ? handlers.onDragEnd : undefined}
                  onTouchStart={(e) => handlers.onTouchStart(e, task)}
                  onTouchMove={handlers.onTouchMove}
                  onTouchEnd={handlers.onTouchEnd}
                  onTouchCancel={handlers.onTouchCancel}
                  className={draggedItemId === task.id ? 'opacity-50' : ''}
                >
                  <TaskCard
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onClick={handleTaskClick}
                    onMarkDone={handleMarkDone}
                    onAssignProject={handleAssignProject}
                  />
                </div>
              </div>
            ))}
            {dropIndicatorIndex?.column === 'URGENT_IN_PROGRESS' && dropIndicatorIndex.index === urgentInProgress.length && (
              <div className="h-0.5 bg-primary rounded" />
            )}
          </div>
        </div>
      </div>

      {/* Modale de modification */}
      <TaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onSubmit={handleUpdateTask}
        isLoading={updateTask.isPending}
        projects={projects || []}
      />

      {/* Modale de détails */}
      <TaskDetailsModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        showEdit={true}
        showDelete={true}
        onEdit={() => {
          if (selectedTask) {
            setEditingTask(selectedTask);
            setSelectedTask(null);
          }
        }}
        onDelete={() => {
          if (selectedTask) {
            setDeletingTask(selectedTask);
            setSelectedTask(null);
          }
        }}
      />

      {/* Modale de confirmation de suppression */}
      <DeleteConfirmModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteTaskConfirm}
        title="Supprimer la tâche"
        message={`Êtes-vous sûr de vouloir supprimer la tâche "${deletingTask?.title}" ? Cette action est irréversible.`}
        loading={deleteTask.isPending}
      />

      {/* Modale de création de tâche urgente */}
      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        task={null}
        onSubmit={handleCreateTask}
        isLoading={createTask.isPending}
        projects={projects || []}
        defaultPriority="URGENT"
        defaultStatus={createDefaultStatus}
      />
    </section>
  );
};