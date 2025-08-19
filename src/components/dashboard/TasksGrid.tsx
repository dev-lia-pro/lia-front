import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { TaskModal } from './TaskModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { TaskCard } from './TaskCard';
import { useProjects } from '../../hooks/useProjects';
import { useTasks, Task, CreateTaskData, UpdateTaskData } from '../../hooks/useTasks';
import { useToast } from '../../hooks/use-toast';

export const TasksGrid = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  
  const { projects } = useProjects();
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
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

  const handleTaskClick = (task: Task) => {
    // Ouvrir la vue détaillée de la tâche
    console.log('Opening task:', task.title);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleDeleteTaskClick = (task: Task) => {
    setDeletingTask(task);
  };

  if (isLoading) {
    return (
      <section className="animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Tâches ({tasks.length})</h3>
          <Button
            size="sm"
            className="bg-gold hover:bg-gold/90 text-navy"
            disabled
          >
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
          Tâches ({tasks.length})
        </h3>
        <Button
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gold hover:bg-gold/90 text-navy"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-navy-card border border-border hover:border-gold hover:bg-navy-card/80 flex items-center justify-center transition-all duration-200 cursor-pointer group active:scale-95"
            type="button"
          >
            <Plus className="w-8 h-8 text-foreground/50 group-hover:text-gold transition-all duration-200" />
          </button>
          <p className="text-foreground/70 mb-2">Aucune tâche pour le moment</p>
          <p className="text-sm text-foreground/50">Cliquez sur l'icône ci-dessus pour créer votre première tâche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTaskClick}
              onClick={handleTaskClick}
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

      {/* Modale de confirmation de suppression */}
      <DeleteConfirmModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        projectName={deletingTask?.title || ''}
        onConfirm={handleDeleteTask}
        isLoading={deleteTask.isPending}
        itemType="tâche"
      />
    </section>
  );
};
