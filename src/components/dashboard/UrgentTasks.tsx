import React, { useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { useTasks, Task, CreateTaskData, UpdateTaskData } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { useToast } from '../../hooks/use-toast';

export const UrgentTasks = () => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Récupérer les tâches avec priorité URGENT ou HIGH
  const { tasks: urgentTasks, isLoading, updateTask, deleteTask, createTask } = useTasks({ priority: 'URGENT' });
  const { projects } = useProjects();
  const { toast } = useToast();
  
  // Filtrer pour inclure aussi les tâches URGENT
  const allUrgentTasks = urgentTasks.filter(task => 
    task.priority === 'URGENT' || task.priority === 'HIGH'
  );

  const handleTaskClick = (task: Task) => {
    // Ouvrir la vue détaillée de la tâche
    console.log('Opening urgent task:', task.title);
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
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Tâches urgentes
        </h3>
        
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
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Tâches urgentes
        </h3>
        
        <div className="text-center py-6">
          <AlertTriangle className="w-8 h-8 text-foreground/30 mx-auto mb-2" />
          <p className="text-foreground/50 text-sm">Aucune tâche urgente pour le moment</p>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Tâches urgentes ({allUrgentTasks.length})
        </h3>
        <Button
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gold hover:bg-gold/90 text-navy"
        >
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

      {/* Modale de confirmation de suppression */}
      <DeleteConfirmModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        projectName={deletingTask?.title || ''}
        onConfirm={handleDeleteTaskConfirm}
        isLoading={deleteTask.isPending}
        itemType="tâche"
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