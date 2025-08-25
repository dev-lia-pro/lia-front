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
  
  // Récupérer les tâches (filtrées par projet sélectionné)
  const { selected } = useProjectStore();
  const { tasks, isLoading, updateTask, deleteTask, createTask } = useTasks({ project: selected.id ?? undefined });
  const { projects } = useProjects();
  const { toast } = useToast();
  
  // Filtrer: urgentes/hautes et non terminées
  const allUrgentTasks = tasks.filter(task => 
    (task.priority === 'URGENT' || task.priority === 'HIGH') && task.status !== 'DONE'
  );

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleEditTask = (task: Task) => {
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
          <h3 className="text-lg font-semibold text-foreground">
            Tâches urgentes
          </h3>
          <Button size="sm" className="border border-gold bg-gold hover:bg-gold/90 text-primary-foreground" disabled>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="p-4 bg-navy-card border border-border rounded-xl animate-pulse"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-border rounded" />
                <div className="w-8 h-8 bg-border rounded" />
              </div>
              <div className="w-full h-4 bg-border rounded mb-2" />
              <div className="w-3/4 h-3 bg-border rounded mb-2" />
              <div className="w-1/2 h-3 bg-border rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (allUrgentTasks.length === 0) {
    return (
      <section className="animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Tâches urgentes
          </h3>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="border border-gold bg-gold hover:bg-gold/90 text-primary-foreground">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <EmptyState
          title="Aucune tâche urgente pour le moment"
          description="Cliquez sur l'icône ci-dessus pour créer votre première tâche"
          onCreateClick={() => setIsCreateModalOpen(true)}
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
        />
      </section>
    );
  }

  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Tâches urgentes ({allUrgentTasks.length})
        </h3>
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="border border-gold bg-gold hover:bg-gold/90 text-primary-foreground">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allUrgentTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onClick={handleTaskClick}
            onMarkDone={handleMarkDone}
            onAssignProject={handleAssignProject}
          />
        ))}
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
      />
    </section>
  );
};