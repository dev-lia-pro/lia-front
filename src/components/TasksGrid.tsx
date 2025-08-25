import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskModal } from './TaskModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { TaskCard } from './TaskCard';
import TaskDetailsModal from './TaskDetailsModal';
import { useProjects } from '@/hooks/useProjects';
import { useTasks, Task, CreateTaskData, UpdateTaskData } from '@/hooks/useTasks';
import { useProjectStore } from '@/stores/projectStore';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from './EmptyState';

export const TasksGrid = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  
  const { projects } = useProjects();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<number | undefined>(undefined);
  const { selected } = useProjectStore();

  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    project: selected.id ?? projectFilter,
    exclude_urgent: true,
  });
  const { toast } = useToast();

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
          <h3 className="text-lg font-semibold text-foreground">Autres tâches ({tasks.length})</h3>
          <Button size="sm" className="border border-gold bg-gold hover:bg-gold/90 text-primary-foreground" disabled>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="p-4 bg-navy-card rounded-xl border border-border animate-pulse"
            >
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
      </section>
    );
  }

  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Autres tâches ({tasks.length})
        </h3>
        <div className="flex items-center gap-2">
          {/* Filtres */}
          <select
            className="bg-navy-card border border-border text-foreground text-sm rounded px-2 py-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous statuts</option>
            <option value="TODO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="DONE">Terminé</option>
          </select>
          <select
            className="bg-navy-card border border-border text-foreground text-sm rounded px-2 py-1"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">Toutes priorités</option>
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="URGENT">Urgente</option>
          </select>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="border border-gold bg-gold hover:bg-gold/90 text-primary-foreground">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {tasks.length === 0 ? (
        <EmptyState
          title="Aucune tâche pour le moment"
          description="Cliquez sur l'icône ci-dessus pour créer votre première tâche"
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTaskClick}
              onClick={handleTaskClick}
              onMarkDone={handleMarkDone}
              onAssignProject={handleAssignProject}
            />
          ))}
        </div>
      )}

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
