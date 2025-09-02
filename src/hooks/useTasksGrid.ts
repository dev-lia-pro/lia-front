import { useState, useCallback } from 'react';
import { Task, UpdateTaskData } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';

interface UseTasksGridProps {
  updateTask: any;
  reorderTask: any;
}

export const useTasksGrid = ({ updateTask, reorderTask }: UseTasksGridProps) => {
  const { toast } = useToast();
  
  const handleDropSimple = useCallback(async (data: any, targetStatus: Task['status']) => {
    try {
      const { id, status: sourceStatus } = data;
      
      if (sourceStatus === targetStatus) return;
      
      const updatePayload: UpdateTaskData = { id, status: targetStatus };
      
      await updateTask.mutateAsync(updatePayload);
      
      await reorderTask.mutateAsync({
        id: id,
        target_index: 0
      });
      
      const statusLabel = targetStatus === 'TODO' ? 'À faire' : targetStatus === 'IN_PROGRESS' ? 'En cours' : 'Terminé';
      toast({ 
        title: 'Tâche déplacée', 
        description: `La tâche a été déplacée en haut de la colonne "${statusLabel}".` 
      });
    } catch {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de déplacer la tâche.', 
        variant: 'destructive' 
      });
    }
  }, [updateTask, reorderTask, toast]);

  const handleDropWithPosition = useCallback(async (data: any, targetIndex: number, targetStatus: Task['status']) => {
    try {
      await reorderTask.mutateAsync({
        id: data.id,
        target_position: targetIndex,
        target_status: targetStatus
      });
      
      const statusLabel = targetStatus === 'TODO' ? 'À faire' : targetStatus === 'IN_PROGRESS' ? 'En cours' : 'Terminé';
      
      if (data.status !== targetStatus) {
        toast({ 
          title: 'Tâche déplacée', 
          description: `La tâche a été déplacée vers "${statusLabel}".` 
        });
      } else {
        toast({ 
          title: 'Tâche réordonnée', 
          description: 'La position de la tâche a été mise à jour.' 
        });
      }
    } catch {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de déplacer la tâche.', 
        variant: 'destructive' 
      });
    }
  }, [reorderTask, toast]);

  return {
    handleDropSimple,
    handleDropWithPosition
  };
};