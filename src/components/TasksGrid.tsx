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
 

export const TasksGrid = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<Task['status']>('TODO');
  
  const { projects } = useProjects();
  const { selected } = useProjectStore();

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
  const { toast } = useToast();

  // Drag & Drop
  const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: task.id, status: task.status, priority: task.priority }));
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: Task['status']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) setDragOverStatus(status);
  };
  const handleDragLeave = () => {
    setDragOverStatus(null);
  };
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStatus: Task['status']) => {
    e.preventDefault();
    setDragOverStatus(null);
    try {
      const payload = e.dataTransfer.getData('application/json');
      if (!payload) return;
      const { id, priority } = JSON.parse(payload) as { id: number; priority?: Task['priority'] };
      // Si la tâche provient de la section urgente (priority URGENT ou HIGH) et est déposée ici,
      // on rétrograde la priorité à MEDIUM.
      const updatePayload: UpdateTaskData = { id, status: targetStatus };
      if (priority === 'URGENT' || priority === 'HIGH') {
        updatePayload.priority = 'MEDIUM';
      }
      await updateTask.mutateAsync(updatePayload);
      const statusLabel = targetStatus === 'TODO' ? 'À faire' : targetStatus === 'IN_PROGRESS' ? 'En cours' : 'Terminé';
      toast({ title: 'Tâche déplacée', description: `La tâche a été déplacée vers "${statusLabel}".` });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de déplacer la tâche.', variant: 'destructive' });
    }
  };

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
          <h3 className="text-lg font-semibold text-foreground">Tâches ({totalCount})</h3>
          <Button size="sm" className="border border-gold bg-gold hover:bg-gold/90 text-primary-foreground" disabled>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["À faire", "En cours", "Terminé"].map((title, index) => (
            <div key={index} className="p-4 bg-navy-card/30 rounded-xl border border-border">
              <div className="h-5 w-24 bg-border rounded mb-4 animate-pulse" />
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-4 bg-navy-card rounded-xl border border-border animate-pulse mb-3">
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
        <h3 className="text-lg font-semibold text-foreground">Tâches ({totalCount})</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="px-2 py-1 rounded border border-border bg-navy-card hover:bg-navy-card/80 text-foreground text-xs inline-flex items-center gap-1"
            title={showDone ? 'Masquer Terminé' : 'Afficher Terminé'}
          >
            {showDone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">{showDone ? 'Masquer terminés' : 'Afficher terminés'}</span>
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${showDone ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
        {/* Colonne À faire */}
        <div
          className={`p-4 bg-navy-card/30 rounded-xl border ${dragOverStatus === 'TODO' ? 'border-gold' : 'border-border'} transition-smooth`}
          onDragOver={(e) => handleDragOver(e, 'TODO')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'TODO')}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">À faire ({tasksTodo.length})</h4>
            <Button size="icon" onClick={() => { setCreateDefaultStatus('TODO'); setIsCreateModalOpen(true); }} className="border border-gold bg-gold hover:bg-gold/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-3 min-h-[60px]">
            {tasksTodo.length === 0 && (
              <div className="p-3 text-xs text-foreground/60 bg-navy-card rounded border border-border text-center">
                Aucune tâche pour le moment
              </div>
            )}
            {tasksTodo.map((task) => (
              <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task)}>
                <TaskCard
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTaskClick}
                  onClick={handleTaskClick}
                  onMarkDone={handleMarkDone}
                  onAssignProject={handleAssignProject}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Colonne En cours */}
        <div
          className={`p-4 bg-navy-card/30 rounded-xl border ${dragOverStatus === 'IN_PROGRESS' ? 'border-gold' : 'border-border'} transition-smooth`}
          onDragOver={(e) => handleDragOver(e, 'IN_PROGRESS')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">En cours ({tasksInProgress.length})</h4>
            <Button size="icon" onClick={() => { setCreateDefaultStatus('IN_PROGRESS'); setIsCreateModalOpen(true); }} className="border border-gold bg-gold hover:bg-gold/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-3 min-h-[60px]">
            {tasksInProgress.length === 0 && (
              <div className="p-3 text-xs text-foreground/60 bg-navy-card rounded border border-border text-center">
                Aucune tâche pour le moment
              </div>
            )}
            {tasksInProgress.map((task) => (
              <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task)}>
                <TaskCard
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTaskClick}
                  onClick={handleTaskClick}
                  onMarkDone={handleMarkDone}
                  onAssignProject={handleAssignProject}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Colonne Terminé */}
        {showDone && (
          <div
            className={`p-4 bg-navy-card/30 rounded-xl border ${dragOverStatus === 'DONE' ? 'border-gold' : 'border-border'} transition-smooth`}
            onDragOver={(e) => handleDragOver(e, 'DONE')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'DONE')}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Terminé ({tasksDone.length})</h4>
              <Button size="icon" onClick={() => { setCreateDefaultStatus('DONE'); setIsCreateModalOpen(true); }} className="border border-gold bg-gold hover:bg-gold/90 text-primary-foreground">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-3 min-h-[60px]">
              {tasksDone.length === 0 && (
                <div className="p-3 text-xs text-foreground/60 bg-navy-card rounded border border-border text-center">
                  Aucune tâche pour le moment
                </div>
              )}
              {tasksDone.map((task) => (
                <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task)}>
                  <TaskCard
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTaskClick}
                    onClick={handleTaskClick}
                    onAssignProject={handleAssignProject}
                  />
                </div>
              ))}
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
