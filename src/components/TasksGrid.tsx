import React, { useState } from 'react';
import { Plus, Eye, EyeOff, AlertTriangle } from 'lucide-react';
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
 

interface TasksGridProps {
  includeUrgent?: boolean;
  urgentOnlyFilter?: boolean; // Force le filtre urgent
  showToggles?: boolean; // Affiche les toggles (défaut: true)
}

export const TasksGrid = ({ includeUrgent = false, urgentOnlyFilter = false, showToggles = true }: TasksGridProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<Task['status']>('TODO');
  
  const { projects } = useProjects();
  const { selected } = useProjectStore();
  const isMobile = useIsMobile();

  // Affichage/masquage de la colonne Terminé
  const [showDone, setShowDone] = useState(true);
  // Filtrage des tâches urgentes uniquement
  const [urgentOnly, setUrgentOnly] = useState(urgentOnlyFilter);

  // Trois requêtes séparées: une par colonne de statut
  const todo = useTasks({ status: 'TODO', project: selected.id ?? undefined, exclude_urgent: !includeUrgent });
  const inProgress = useTasks({ status: 'IN_PROGRESS', project: selected.id ?? undefined, exclude_urgent: !includeUrgent });
  const done = useTasks({ status: 'DONE', project: selected.id ?? undefined, exclude_urgent: !includeUrgent }, { enabled: showDone });

  // Filtrer les tâches selon le toggle urgentOnly
  const tasksTodo = urgentOnly ? todo.tasks.filter(t => t.priority === 'URGENT') : todo.tasks;
  const tasksInProgress = urgentOnly ? inProgress.tasks.filter(t => t.priority === 'URGENT') : inProgress.tasks;
  const tasksDone = urgentOnly ? done.tasks.filter(t => t.priority === 'URGENT') : done.tasks;
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
      
      // Si c'est le même statut, ne rien faire
      if (sourceStatus === targetStatus) return;
      
      // Mettre à jour le statut uniquement
      const updatePayload: UpdateTaskData = { id, status: targetStatus };
      
      // D'abord mettre à jour le statut et/ou la priorité
      await updateTask.mutateAsync(updatePayload);
      
      // Puis placer en première position (index 0)
      await reorderTask.mutateAsync({
        id: id,
        target_index: 0
      });
      
      const statusLabel = targetStatus === 'TODO' ? 'À faire' : targetStatus === 'IN_PROGRESS' ? 'En cours' : 'Terminé';
      toast({ title: 'Tâche déplacée', description: `La tâche a été déplacée en haut de la colonne "${statusLabel}".` });
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
        <h3 className="text-xl font-semibold text-foreground">{urgentOnlyFilter && !showToggles ? 'Tâches urgentes' : 'Tâches'} ({totalCount})</h3>
        {showToggles && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUrgentOnly((v) => !v)}
              className="px-2 py-1 rounded border border-border bg-card hover:bg-card/80 text-foreground text-xs inline-flex items-center gap-1"
              title={urgentOnly ? 'Afficher toutes les tâches' : 'Afficher uniquement les urgentes'}
            >
              <AlertTriangle className={`w-4 h-4 ${urgentOnly ? 'text-red-500' : ''}`} />
              <span className="hidden sm:inline">Urgentes uniquement</span>
            </button>
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
        )}
      </div>

      <div className={`${isMobile ? 'flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4' : `grid grid-cols-1 ${showDone ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}`}>
        {/* Colonne À faire */}
        <div
          className={`${isMobile ? 'w-[240px] flex-shrink-0 snap-center' : ''} p-3 bg-card/30 rounded-xl border ${dragOverStatus === 'TODO' && tasksTodo.length === 0 ? 'border-primary' : 'border-border'} transition-smooth`}
          data-drop-zone="TODO"
          onDragOver={(e) => {
            handlers.onDragOver(e, 'TODO');
            // Also trigger vertical positioning check if we have tasks
            if (tasksTodo.length > 0) {
              const columnTasks = Array.from(document.querySelectorAll('[data-task-column="TODO"]'));
              for (let i = 0; i < columnTasks.length; i++) {
                const taskElement = columnTasks[i] as HTMLElement;
                const rect = taskElement.getBoundingClientRect();
                const midPoint = rect.top + rect.height / 2;
                if (e.clientY < midPoint) {
                  handlers.onDragOverVertical(e, i, 'TODO');
                  return;
                }
              }
              // If we're at the bottom
              handlers.onDragOverVertical(e, columnTasks.length, 'TODO');
            }
          }}
          onDragLeave={handlers.onDragLeave}
          onDrop={(e) => dropIndicatorIndex ? handlers.onDropVertical(e, 'TODO') : handlers.onDrop(e, 'TODO')}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold">À faire ({tasksTodo.length})</h4>
            <Button size="icon" onClick={() => { setCreateDefaultStatus('TODO'); setIsCreateModalOpen(true); }} className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col min-h-[60px]">
            {tasksTodo.length === 0 && (
              <div className="p-8 text-xs text-foreground/60 bg-card/50 rounded-xl border-2 border-dashed border-border/50 text-center">
                <div className="mb-2">Aucune tâche</div>
                <div className="text-[10px] text-foreground/40">Glissez une tâche ici</div>
              </div>
            )}
            {tasksTodo.map((task, index) => {
              const isDragging = draggedItemId === task.id;
              const showDropZone = dropIndicatorIndex?.column === 'TODO' && dropIndicatorIndex.index === index;
              
              return (
                <React.Fragment key={task.id}>
                  {showDropZone && !isDragging && (
                    <div className="relative h-0 mb-0">
                      <div className="absolute left-0 right-0 -top-1 h-1 bg-primary rounded-full shadow-lg shadow-primary/50 z-20" />
                    </div>
                  )}
                  <div 
                    draggable={true}
                    data-task-index={index}
                    data-task-column="TODO"
                    onDragStart={(e) => handlers.onDragStart(e, task)}
                    onDragOver={(e) => handlers.onDragOverVertical(e, index, 'TODO')}
                    onDrop={(e) => handlers.onDropVertical(e, 'TODO')}
                    onDragEnd={handlers.onDragEnd}
                    onTouchStart={(e) => handlers.onTouchStart(e, task)}
                    onTouchMove={handlers.onTouchMove}
                    onTouchEnd={handlers.onTouchEnd}
                    onTouchCancel={handlers.onTouchCancel}
                    className={`${index < tasksTodo.length - 1 ? 'mb-2' : ''}`}
                    style={{
                      opacity: isDragging ? 0.3 : 1,
                      transform: isDragging ? 'scale(0.98)' : 'scale(1)',
                      filter: isDragging ? 'blur(2px)' : 'none',
                      transition: 'all 0.2s ease-in-out'
                    }}
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
                </React.Fragment>
              );
            })}
            {dropIndicatorIndex?.column === 'TODO' && dropIndicatorIndex.index === tasksTodo.length && (
              <div className="relative h-4 mt-2">
                <div className="absolute left-0 right-0 top-1 h-1 bg-primary rounded-full shadow-lg shadow-primary/50" />
              </div>
            )}
          </div>
        </div>

        {/* Colonne En cours */}
        <div
          className={`${isMobile ? 'w-[240px] flex-shrink-0 snap-center' : ''} p-3 bg-card/30 rounded-xl border ${dragOverStatus === 'IN_PROGRESS' && tasksInProgress.length === 0 ? 'border-primary' : 'border-border'} transition-smooth`}
          data-drop-zone="IN_PROGRESS"
          onDragOver={(e) => {
            handlers.onDragOver(e, 'IN_PROGRESS');
            // Also trigger vertical positioning check if we have tasks
            if (tasksInProgress.length > 0) {
              const columnTasks = Array.from(document.querySelectorAll('[data-task-column="IN_PROGRESS"]'));
              for (let i = 0; i < columnTasks.length; i++) {
                const taskElement = columnTasks[i] as HTMLElement;
                const rect = taskElement.getBoundingClientRect();
                const midPoint = rect.top + rect.height / 2;
                if (e.clientY < midPoint) {
                  handlers.onDragOverVertical(e, i, 'IN_PROGRESS');
                  return;
                }
              }
              // If we're at the bottom
              handlers.onDragOverVertical(e, columnTasks.length, 'IN_PROGRESS');
            }
          }}
          onDragLeave={handlers.onDragLeave}
          onDrop={(e) => dropIndicatorIndex ? handlers.onDropVertical(e, 'IN_PROGRESS') : handlers.onDrop(e, 'IN_PROGRESS')}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold">En cours ({tasksInProgress.length})</h4>
            <Button size="icon" onClick={() => { setCreateDefaultStatus('IN_PROGRESS'); setIsCreateModalOpen(true); }} className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col min-h-[60px]">
            {tasksInProgress.length === 0 && (
              <div className="p-8 text-xs text-foreground/60 bg-card/50 rounded-xl border-2 border-dashed border-border/50 text-center">
                <div className="mb-2">Aucune tâche</div>
                <div className="text-[10px] text-foreground/40">Glissez une tâche ici</div>
              </div>
            )}
            {tasksInProgress.map((task, index) => {
              const isDragging = draggedItemId === task.id;
              const showDropZone = dropIndicatorIndex?.column === 'IN_PROGRESS' && dropIndicatorIndex.index === index;
              
              return (
                <React.Fragment key={task.id}>
                  {showDropZone && !isDragging && (
                    <div className="relative h-0 mb-0">
                      <div className="absolute left-0 right-0 -top-1 h-1 bg-primary rounded-full shadow-lg shadow-primary/50 z-20" />
                    </div>
                  )}
                  <div 
                    draggable={true}
                    data-task-index={index}
                    data-task-column="IN_PROGRESS"
                    onDragStart={(e) => handlers.onDragStart(e, task)}
                    onDragOver={(e) => handlers.onDragOverVertical(e, index, 'IN_PROGRESS')}
                    onDrop={(e) => handlers.onDropVertical(e, 'IN_PROGRESS')}
                    onDragEnd={handlers.onDragEnd}
                    onTouchStart={(e) => handlers.onTouchStart(e, task)}
                    onTouchMove={handlers.onTouchMove}
                    onTouchEnd={handlers.onTouchEnd}
                    onTouchCancel={handlers.onTouchCancel}
                    className={`${index < tasksInProgress.length - 1 ? 'mb-2' : ''}`}
                    style={{
                      opacity: isDragging ? 0.3 : 1,
                      transform: isDragging ? 'scale(0.98)' : 'scale(1)',
                      filter: isDragging ? 'blur(2px)' : 'none',
                      transition: 'all 0.2s ease-in-out'
                    }}
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
                </React.Fragment>
              );
            })}
            {dropIndicatorIndex?.column === 'IN_PROGRESS' && dropIndicatorIndex.index === tasksInProgress.length && (
              <div className="relative h-4 mt-2">
                <div className="absolute left-0 right-0 top-1 h-1 bg-primary rounded-full shadow-lg shadow-primary/50" />
              </div>
            )}
          </div>
        </div>

        {/* Colonne Terminé */}
        {showDone && (
          <div
            className={`${isMobile ? 'w-[240px] flex-shrink-0 snap-center' : ''} p-3 bg-card/30 rounded-xl border ${dragOverStatus === 'DONE' && tasksDone.length === 0 ? 'border-primary' : 'border-border'} transition-smooth`}
            data-drop-zone="DONE"
            onDragOver={(e) => {
              handlers.onDragOver(e, 'DONE');
              // Also trigger vertical positioning check if we have tasks
              if (tasksDone.length > 0) {
                const columnTasks = Array.from(document.querySelectorAll('[data-task-column="DONE"]'));
                for (let i = 0; i < columnTasks.length; i++) {
                  const taskElement = columnTasks[i] as HTMLElement;
                  const rect = taskElement.getBoundingClientRect();
                  const midPoint = rect.top + rect.height / 2;
                  if (e.clientY < midPoint) {
                    handlers.onDragOverVertical(e, i, 'DONE');
                    return;
                  }
                }
                // If we're at the bottom
                handlers.onDragOverVertical(e, columnTasks.length, 'DONE');
              }
            }}
            onDragLeave={handlers.onDragLeave}
            onDrop={(e) => dropIndicatorIndex ? handlers.onDropVertical(e, 'DONE') : handlers.onDrop(e, 'DONE')}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold">Terminé ({tasksDone.length})</h4>
              <Button size="icon" onClick={() => { setCreateDefaultStatus('DONE'); setIsCreateModalOpen(true); }} className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-col min-h-[60px]">
              {tasksDone.length === 0 && (
                <div className="p-8 text-xs text-foreground/60 bg-card/50 rounded-xl border-2 border-dashed border-border/50 text-center">
                  <div className="mb-2">Aucune tâche</div>
                  <div className="text-[10px] text-foreground/40">Glissez une tâche ici</div>
                </div>
              )}
              {tasksDone.map((task, index) => {
                const isDragging = draggedItemId === task.id;
                const showDropZone = dropIndicatorIndex?.column === 'DONE' && dropIndicatorIndex.index === index;
                
                return (
                  <React.Fragment key={task.id}>
                    {showDropZone && !isDragging && (
                      <div className="relative h-0 mb-0">
                        <div className="absolute left-0 right-0 -top-1 h-1 bg-primary rounded-full shadow-lg shadow-primary/50 z-20" />
                      </div>
                    )}
                    <div 
                      draggable={true}
                      data-task-index={index}
                      data-task-column="DONE"
                      onDragStart={(e) => handlers.onDragStart(e, task)}
                      onDragOver={(e) => handlers.onDragOverVertical(e, index, 'DONE')}
                      onDrop={(e) => handlers.onDropVertical(e, 'DONE')}
                      onDragEnd={handlers.onDragEnd}
                      onTouchStart={(e) => handlers.onTouchStart(e, task)}
                      onTouchMove={handlers.onTouchMove}
                      onTouchEnd={handlers.onTouchEnd}
                      onTouchCancel={handlers.onTouchCancel}
                      className={`${index < tasksDone.length - 1 ? 'mb-2' : ''}`}
                      style={{
                        opacity: isDragging ? 0.3 : 1,
                        transform: isDragging ? 'scale(0.98)' : 'scale(1)',
                        filter: isDragging ? 'blur(2px)' : 'none',
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <TaskCard
                        task={task}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTaskClick}
                        onClick={handleTaskClick}
                        onAssignProject={handleAssignProject}
                      />
                    </div>
                  </React.Fragment>
                );
              })}
              {dropIndicatorIndex?.column === 'DONE' && dropIndicatorIndex.index === tasksDone.length && (
                <div className="relative h-4 mt-2">
                  <div className="absolute left-0 right-0 top-1 h-1 bg-primary rounded-full shadow-lg shadow-primary/50" />
                </div>
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
