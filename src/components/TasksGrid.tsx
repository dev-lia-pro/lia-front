import React, { useState, useCallback, useEffect } from 'react';
import { TaskModal } from './TaskModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import TaskDetailsModal from './TaskDetailsModal';
import { TaskColumn } from './TaskColumn';
import { TasksGridHeader } from './TasksGridHeader';
import { TasksGridSkeleton } from './TasksGridSkeleton';
import { useTasksGrid } from '@/hooks/useTasksGrid';
import { useProjects } from '@/hooks/useProjects';
import { useTasks, Task, CreateTaskData, UpdateTaskData } from '@/hooks/useTasks';
import { useProjectStore } from '@/stores/projectStore';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useSearchParams } from 'react-router-dom';


interface TasksGridProps {
  includeUrgent?: boolean;
  urgentOnlyFilter?: boolean; // Force le filtre urgent
  showToggles?: boolean; // Affiche les toggles (défaut: true)
  disableUrgentBackground?: boolean; // Désactive le fond rouge des tâches urgentes
  taskIdFromUrl?: string | null; // ID de la tâche à ouvrir depuis l'URL
}

export const TasksGrid: React.FC<TasksGridProps> = ({
  includeUrgent = false,
  urgentOnlyFilter = false,
  showToggles = true,
  disableUrgentBackground = false,
  taskIdFromUrl = null
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<Task['status']>('TODO');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { projects } = useProjects();
  const { selected } = useProjectStore();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showDone, setShowDone] = useState(true);
  const [urgentOnly, setUrgentOnly] = useState(urgentOnlyFilter);

  const todo = useTasks({ status: 'TODO', project: selected.id ?? undefined, exclude_urgent: !includeUrgent });
  const inProgress = useTasks({ status: 'IN_PROGRESS', project: selected.id ?? undefined, exclude_urgent: !includeUrgent });
  const done = useTasks({ status: 'DONE', project: selected.id ?? undefined, exclude_urgent: !includeUrgent }, { enabled: showDone });

  const filterTasksByPriority = useCallback((tasks: Task[]) => {
    return urgentOnly ? tasks.filter(t => t.priority === 'URGENT') : tasks;
  }, [urgentOnly]);

  const tasksTodo = filterTasksByPriority(todo.tasks);
  const tasksInProgress = filterTasksByPriority(inProgress.tasks);
  const tasksDone = filterTasksByPriority(done.tasks);
  const isLoading = todo.isLoading || inProgress.isLoading || done.isLoading;
  const totalCount = tasksTodo.length + tasksInProgress.length + (showDone ? tasksDone.length : 0);

  const createTask = todo.createTask;
  const updateTask = todo.updateTask;
  const deleteTask = todo.deleteTask;
  const reorderTask = todo.reorderTask;
  const { toast } = useToast();
  const { handleDropSimple, handleDropWithPosition } = useTasksGrid({ updateTask, reorderTask });


  const { draggedItemId, dragOverStatus, dropIndicatorIndex, handlers } = useDragAndDrop({
    onDrop: handleDropSimple,
    onDropVertical: handleDropWithPosition
  });

  const handleCreateTask = useCallback(async (data: CreateTaskData) => {
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
  }, [createTask, toast]);

  const handleUpdateTask = useCallback(async (data: UpdateTaskData) => {
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
  }, [updateTask, toast]);

  const handleDeleteTask = useCallback(async () => {
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
  }, [deletingTask, deleteTask, toast]);

  const handleMarkDone = useCallback(async (task: Task) => {
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
  }, [updateTask, toast]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  const handleDeleteTaskClick = useCallback((task: Task) => {
    setDeletingTask(task);
  }, []);

  // Ouvrir la tâche spécifiée dans les query params
  useEffect(() => {
    if (taskIdFromUrl) {
      const allTasks = [...tasksTodo, ...tasksInProgress, ...tasksDone];
      const task = allTasks.find(t => t.id === parseInt(taskIdFromUrl));
      if (task) {
        setSelectedTask(task);
        // Nettoyer le query param après ouverture
        setSearchParams({});
      }
    }
  }, [taskIdFromUrl, tasksTodo, tasksInProgress, tasksDone, setSearchParams]);

  const handleAssignProject = useCallback(async (taskId: number, projectId: number | '') => {
    try {
      await updateTask.mutateAsync({ id: taskId, project: projectId === '' ? null : (projectId as number) });
    } catch (error) {
      // silencieux
    }
  }, [updateTask]);

  const handleOpenCreateModal = useCallback((status: Task['status']) => {
    setCreateDefaultStatus(status);
    setIsCreateModalOpen(true);
  }, []);

  if (isLoading) {
    return <TasksGridSkeleton totalCount={totalCount} />;
  }

  const columns = [
    { title: 'À faire', status: 'TODO' as Task['status'], tasks: tasksTodo },
    { title: 'En cours', status: 'IN_PROGRESS' as Task['status'], tasks: tasksInProgress },
    ...(showDone ? [{ title: 'Terminé', status: 'DONE' as Task['status'], tasks: tasksDone }] : [])
  ];

  return (
    <section className="animate-slide-up">
      <TasksGridHeader
        totalCount={totalCount}
        urgentOnlyFilter={urgentOnlyFilter}
        showToggles={showToggles}
        urgentOnly={urgentOnly}
        showDone={showDone}
        onToggleUrgentOnly={() => setUrgentOnly((v) => !v)}
        onToggleShowDone={() => setShowDone((v) => !v)}
      />

      <div className={`${isMobile ? 'flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4' : `grid grid-cols-1 ${showDone ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}`}>
        {columns.map((column) => (
          <TaskColumn
            key={column.status}
            title={column.title}
            status={column.status}
            tasks={column.tasks}
            draggedItemId={draggedItemId}
            dragOverStatus={dragOverStatus}
            dropIndicatorIndex={dropIndicatorIndex}
            onCreateClick={handleOpenCreateModal}
            onTaskEdit={handleEditTask}
            onTaskDelete={handleDeleteTaskClick}
            onTaskClick={handleTaskClick}
            onTaskMarkDone={column.status !== 'DONE' ? handleMarkDone : undefined}
            onAssignProject={handleAssignProject}
            handlers={handlers}
            disableUrgentBackground={disableUrgentBackground}
          />
        ))}
      </div>

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
        defaultPriority={urgentOnlyFilter ? 'URGENT' : undefined}
        defaultStatus={createDefaultStatus}
      />

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

      <DeleteConfirmModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteTask}
        title="Supprimer la tâche"
        description={`Êtes-vous sûr de vouloir supprimer la tâche "${deletingTask?.title}" ? Cette action est irréversible.`}
      />
    </section>
  );
};
