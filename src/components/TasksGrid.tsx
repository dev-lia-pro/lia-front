import React, { useState } from 'react';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskModal } from './TaskModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { TaskCard } from './TaskCard';
import TaskDetailsModal from './TaskDetailsModal';
import { useProjects } from '@/hooks/useProjects';
import { useTasks, Task, CreateTaskData, UpdateTaskData } from '@/hooks/useTasks';
import { useProjectStore } from '@/stores/projectStore';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useIsTouchDevice } from '@/hooks/use-touch-device';
 

export const TasksGrid = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<Task['status']>('TODO');
  
  const { projects } = useProjects();
  const { selected } = useProjectStore();
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();

  // Affichage/masquage de la colonne Terminé
  const [showDone, setShowDone] = useState(true);

  // Trois requêtes séparées: une par colonne de statut
  const todo = useTasks({ status: 'TODO', project: selected.id ?? undefined, exclude_urgent: true });
  const inProgress = useTasks({ status: 'IN_PROGRESS', project: selected.id ?? undefined, exclude_urgent: true });
  const done = useTasks({ status: 'DONE', project: selected.id ?? undefined, exclude_urgent: true }, { enabled: showDone });

  const tasksTodo = todo.tasks;
  const tasksInProgress = inProgress.tasks;
  const tasksDone = done.tasks;
  const isLoading = todo.isLoading || inProgress.isLoading || done.isLoading;
  const totalCount = tasksTodo.length + tasksInProgress.length + (showDone ? tasksDone.length : 0);

  // On réutilise les mutations d'un des hooks (elles invalident toutes les listes)
  const createTask = todo.createTask;
  const updateTask = todo.updateTask;
  const deleteTask = todo.deleteTask;
  const reorderTask = todo.reorderTask;
  const { toast } = useToast();

  // Drag & Drop handlers
  const handleDropSimple = async (data: any, targetStatus: Task['status']) => {
    try {
      const { id, priority, status: sourceStatus } = data;
      
      // Si c'est le même statut et pas de changement de priorité, ne rien faire
      const isFromUrgent = priority === 'URGENT' || priority === 'HIGH';
      if (sourceStatus === targetStatus && !isFromUrgent) return;
      
      // Si la tâche provient de la section urgente (priority URGENT ou HIGH) et est déposée ici,
      // on rétrograde la priorité à MEDIUM.
      const updatePayload: UpdateTaskData = { id, status: targetStatus };
      if (isFromUrgent && targetStatus !== 'DONE') {
        updatePayload.priority = 'MEDIUM';
      }
      
      // D'abord mettre à jour le statut
      await updateTask.mutateAsync(updatePayload);
      
      // Puis placer en première position (index 0)
      await reorderTask.mutateAsync({
        id: id,
        target_index: 0
      });
      
      const statusLabel = targetStatus === 'TODO' ? 'À faire' : targetStatus === 'IN_PROGRESS' ? 'En cours' : 'Terminé';
      const priorityMessage = isFromUrgent ? ' (priorité réduite)' : '';
      toast({ title: 'Tâche déplacée', description: `La tâche a été déplacée en haut de la colonne "${statusLabel}"${priorityMessage}.` });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de déplacer la tâche.', variant: 'destructive' });
    }
  };

  const handleDropWithPosition = async (data: any, targetIndex: number, targetStatus: Task['status']) => {
    try {
      // Appeler le nouvel endpoint reorder avec tous les paramètres
      await reorderTask.mutateAsync({
        id: data.id,
        target_position: targetIndex,
        target_status: targetStatus,
        target_is_urgent: false
      });
      
      // Message de succès
      const statusLabel = targetStatus === 'TODO' ? 'À faire' : targetStatus === 'IN_PROGRESS' ? 'En cours' : 'Terminé';
      const oldIsUrgent = data.priority === 'URGENT';
      
      if (data.status !== targetStatus || oldIsUrgent) {
        const priorityMessage = oldIsUrgent ? ' (priorité réduite à normale)' : '';
        toast({ title: 'Tâche déplacée', description: `La tâche a été déplacée vers "${statusLabel}"${priorityMessage}.` });
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
      await createTask.mutateAsync(data);
      setIsCreateModalOpen(false);
      toast({
        title: "Tâche créée",
        description: `La tâche "${data.title}" a été créée avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche. Veuillez réessayer.",
        variant: "destructive",
      });
    }
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

  const handleDeleteTask = async () => {
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
      await updateTask.mutateAsync({ id: task.id, status: 'DONE' });
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleDeleteTaskClick = (task: Task) => {
    setDeletingTask(task);
  };
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleAssignProject = async (taskId: number, projectId: number | '') => {
    try {
      await updateTask.mutateAsync({ id: taskId, project: projectId === '' ? null : (projectId as number) });
    } catch (error) {
      // silencieux
    }
  };

  if (isLoading) {
    return (
      <section className="animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-foreground">Tâches ({totalCount})</h3>
          <Button size="sm" className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground" disabled>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["À faire", "En cours", "Terminé"].map((title, index) => (
            <div key={index} className="p-4 bg-card/30 rounded-xl border border-border">
              <div className="h-5 w-24 bg-border rounded mb-4 animate-pulse" />
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-4 bg-card rounded-xl border border-border animate-pulse mb-3">
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
        <h3 className="text-xl font-semibold text-foreground">Tâches ({totalCount})</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="px-2 py-1 rounded border border-border bg-card hover:bg-card/80 text-foreground text-xs inline-flex items-center gap-1"
            title={showDone ? 'Masquer Terminé' : 'Afficher Terminé'}
          >
            {showDone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">{showDone ? 'Masquer terminés' : 'Afficher terminés'}</span>
          </button>
        </div>
      </div>

      <div className={`${isMobile ? 'flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4' : `grid grid-cols-1 ${showDone ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}`}>
        {/* Colonne À faire */}
        <div
          className={`${isMobile ? 'w-[240px] flex-shrink-0 snap-center' : ''} p-3 bg-card/30 rounded-xl border ${dragOverStatus === 'TODO' ? 'border-primary' : 'border-border'} transition-smooth`}
          data-drop-zone="TODO"
          onDragOver={(e) => tasksTodo.length === 0 ? handlers.onDragOver(e, 'TODO') : e.preventDefault()}
          onDragLeave={handlers.onDragLeave}
          onDrop={(e) => tasksTodo.length === 0 ? handlers.onDrop(e, 'TODO') : e.preventDefault()}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold">À faire ({tasksTodo.length})</h4>
            <Button size="icon" onClick={() => { setCreateDefaultStatus('TODO'); setIsCreateModalOpen(true); }} className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2 min-h-[60px]">
            {tasksTodo.length === 0 && (
              <div className="p-3 text-xs text-foreground/60 bg-card rounded border border-border text-center">
                Aucune tâche pour le moment
              </div>
            )}
            {tasksTodo.map((task, index) => (
              <div key={task.id} className="relative">
                {dropIndicatorIndex?.column === 'TODO' && dropIndicatorIndex.index === index && (
                  <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded z-10" />
                )}
                <div 
                  draggable={!isTouchDevice}
                  data-task-index={index}
                  data-task-column="TODO"
                  onDragStart={!isTouchDevice ? (e) => handlers.onDragStart(e, task) : undefined}
                  onDragOver={!isTouchDevice ? (e) => handlers.onDragOverVertical(e, index, 'TODO') : undefined}
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
                    onDelete={handleDeleteTaskClick}
                    onClick={handleTaskClick}
                    onMarkDone={handleMarkDone}
                    onAssignProject={handleAssignProject}
                  />
                </div>
              </div>
            ))}
            {dropIndicatorIndex?.column === 'TODO' && dropIndicatorIndex.index === tasksTodo.length && (
              <div className="h-0.5 bg-primary rounded" />
            )}
          </div>
        </div>

        {/* Colonne En cours */}
        <div
          className={`${isMobile ? 'w-[240px] flex-shrink-0 snap-center' : ''} p-3 bg-card/30 rounded-xl border ${dragOverStatus === 'IN_PROGRESS' ? 'border-primary' : 'border-border'} transition-smooth`}
          data-drop-zone="IN_PROGRESS"
          onDragOver={(e) => tasksInProgress.length === 0 ? handlers.onDragOver(e, 'IN_PROGRESS') : e.preventDefault()}
          onDragLeave={handlers.onDragLeave}
          onDrop={(e) => tasksInProgress.length === 0 ? handlers.onDrop(e, 'IN_PROGRESS') : e.preventDefault()}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold">En cours ({tasksInProgress.length})</h4>
            <Button size="icon" onClick={() => { setCreateDefaultStatus('IN_PROGRESS'); setIsCreateModalOpen(true); }} className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2 min-h-[60px]">
            {tasksInProgress.length === 0 && (
              <div className="p-3 text-xs text-foreground/60 bg-card rounded border border-border text-center">
                Aucune tâche pour le moment
              </div>
            )}
            {tasksInProgress.map((task, index) => (
              <div key={task.id} className="relative">
                {dropIndicatorIndex?.column === 'IN_PROGRESS' && dropIndicatorIndex.index === index && (
                  <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded z-10" />
                )}
                <div 
                  draggable={!isTouchDevice}
                  data-task-index={index}
                  data-task-column="IN_PROGRESS"
                  onDragStart={!isTouchDevice ? (e) => handlers.onDragStart(e, task) : undefined}
                  onDragOver={!isTouchDevice ? (e) => handlers.onDragOverVertical(e, index, 'IN_PROGRESS') : undefined}
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
                    onDelete={handleDeleteTaskClick}
                    onClick={handleTaskClick}
                    onMarkDone={handleMarkDone}
                    onAssignProject={handleAssignProject}
                  />
                </div>
              </div>
            ))}
            {dropIndicatorIndex?.column === 'IN_PROGRESS' && dropIndicatorIndex.index === tasksInProgress.length && (
              <div className="h-0.5 bg-primary rounded" />
            )}
          </div>
        </div>

        {/* Colonne Terminé */}
        {showDone && (
          <div
            className={`${isMobile ? 'w-[240px] flex-shrink-0 snap-center' : ''} p-3 bg-card/30 rounded-xl border ${dragOverStatus === 'DONE' ? 'border-primary' : 'border-border'} transition-smooth`}
            data-drop-zone="DONE"
            onDragOver={(e) => tasksDone.length === 0 ? handlers.onDragOver(e, 'DONE') : e.preventDefault()}
            onDragLeave={handlers.onDragLeave}
            onDrop={(e) => tasksDone.length === 0 ? handlers.onDrop(e, 'DONE') : e.preventDefault()}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold">Terminé ({tasksDone.length})</h4>
              <Button size="icon" onClick={() => { setCreateDefaultStatus('DONE'); setIsCreateModalOpen(true); }} className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-2 min-h-[60px]">
              {tasksDone.length === 0 && (
                <div className="p-3 text-xs text-foreground/60 bg-card rounded border border-border text-center">
                  Aucune tâche pour le moment
                </div>
              )}
              {tasksDone.map((task, index) => (
                <div key={task.id} className="relative">
                  {dropIndicatorIndex?.column === 'DONE' && dropIndicatorIndex.index === index && (
                    <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded z-10" />
                  )}
                  <div 
                    draggable={!isTouchDevice}
                    data-task-index={index}
                    data-task-column="DONE"
                    onDragStart={!isTouchDevice ? (e) => handlers.onDragStart(e, task) : undefined}
                    onDragOver={!isTouchDevice ? (e) => handlers.onDragOverVertical(e, index, 'DONE') : undefined}
                    onDrop={!isTouchDevice ? (e) => handlers.onDropVertical(e, 'DONE') : undefined}
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
                      onDelete={handleDeleteTaskClick}
                      onClick={handleTaskClick}
                      onAssignProject={handleAssignProject}
                    />
                  </div>
                </div>
              ))}
              {dropIndicatorIndex?.column === 'DONE' && dropIndicatorIndex.index === tasksDone.length && (
                <div className="h-0.5 bg-primary rounded" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modale de création/modification */}
      <TaskModal
        isOpen={isCreateModalOpen || !!editingTask}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        isLoading={createTask.isPending || updateTask.isPending}
        projects={projects || []}
        defaultStatus={createDefaultStatus}
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
        onConfirm={handleDeleteTask}
        title="Supprimer la tâche"
        message={`Êtes-vous sûr de vouloir supprimer la tâche "${deletingTask?.title}" ? Cette action est irréversible.`}
        loading={deleteTask.isPending}
      />
    </section>
  );
};
