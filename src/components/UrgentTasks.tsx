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

export const UrgentTasks = () => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Statut de création par défaut (selon la colonne +)
  const [createDefaultStatus, setCreateDefaultStatus] = useState<'TODO' | 'IN_PROGRESS'>('TODO');
  
  // Récupérer les tâches (filtrées par projet sélectionné)
  const { selected } = useProjectStore();
  
  // Deux requêtes séparées pour les tâches urgentes
  const { tasks: urgentTodo, isLoading: isLoadingTodo, updateTask, deleteTask, createTask } = useTasks({ 
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

  // Drag & Drop
  const [dragOverUrgent, setDragOverUrgent] = useState<Task['status'] | null>(null);
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: task.id, status: task.status, priority: task.priority }));
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: Task['status']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverUrgent !== status) setDragOverUrgent(status);
  };
  const handleDragLeave = () => setDragOverUrgent(null);
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStatus: Extract<Task['status'], 'TODO' | 'IN_PROGRESS'>) => {
    e.preventDefault();
    setDragOverUrgent(null);
    try {
      const payload = e.dataTransfer.getData('application/json');
      if (!payload) return;
      const { id } = JSON.parse(payload) as { id: number };
      const updatePayload: UpdateTaskData = { id, status: targetStatus, priority: 'URGENT' };
      await updateTask.mutateAsync(updatePayload);
    } catch (error) {
      // silencieux
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="p-4 bg-card/30 border border-border rounded-xl animate-pulse">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Urgent - À faire */}
        <div
          className={`p-4 bg-card/30 rounded-xl border ${dragOverUrgent === 'TODO' ? 'border-primary' : 'border-border'} transition-smooth`}
          onDragOver={(e) => handleDragOver(e, 'TODO')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'TODO')}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold">À faire ({urgentTodo.length})</h4>
            <Button size="icon" onClick={() => { setCreateDefaultStatus('TODO'); setIsCreateModalOpen(true); }} className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-3 min-h-[60px]">
            {urgentTodo.length === 0 && (
              <div className="p-3 text-xs text-foreground/60 bg-card rounded border border-border text-center">
                Aucune tâche urgente pour le moment
              </div>
            )}
            {urgentTodo.map((task) => (
              <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task)}>
                <TaskCard
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onClick={handleTaskClick}
                  onMarkDone={handleMarkDone}
                  onAssignProject={handleAssignProject}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Urgent - En cours */}
        <div
          className={`p-4 bg-card/30 rounded-xl border ${dragOverUrgent === 'IN_PROGRESS' ? 'border-primary' : 'border-border'} transition-smooth`}
          onDragOver={(e) => handleDragOver(e, 'IN_PROGRESS')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold">En cours ({urgentInProgress.length})</h4>
            <Button size="icon" onClick={() => { setCreateDefaultStatus('IN_PROGRESS'); setIsCreateModalOpen(true); }} className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-3 min-h-[60px]">
            {urgentInProgress.length === 0 && (
              <div className="p-3 text-xs text-foreground/60 bg-card rounded border border-border text-center">
                Aucune tâche urgente pour le moment
              </div>
            )}
            {urgentInProgress.map((task) => (
              <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task)}>
                <TaskCard
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onClick={handleTaskClick}
                  onMarkDone={handleMarkDone}
                  onAssignProject={handleAssignProject}
                />
              </div>
            ))}
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