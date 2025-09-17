import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_at?: string;
  project?: number;
  source_message?: number;
  source_provider_type?: string;
  user: number;
  created_by_ai: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CreateTaskData {
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_at?: string;
  project?: number;
}

export interface UpdateTaskData {
  id: number;
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_at?: string;
  project?: number | null;
}

export interface ReorderTaskData {
  id: number;
  target_position: number;
  target_status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

export interface TaskFilters {
  project?: number;
  status?: string;
  priority?: string;
  exclude_urgent?: boolean;
}

const TASKS_QUERY_KEY = 'tasks';

export const useTasks = (filters?: TaskFilters, options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [TASKS_QUERY_KEY, filters],
    queryFn: async (): Promise<PaginatedResponse<Task>> => {
      const params = new URLSearchParams();
      if (filters?.project) params.append('project', filters.project.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.exclude_urgent) params.append('exclude_urgent', 'true');
      
      const response = await axios.get(`/tasks/?${params.toString()}`);
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });

  // Extraire les tâches de la réponse paginée
  const tasks = data?.results || [];
  const totalCount = data?.count || 0;

  const createTask = useMutation({
    mutationFn: async (data: CreateTaskData): Promise<Task> => {
      const response = await axios.post('/tasks/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async (data: UpdateTaskData): Promise<Task> => {
      const response = await axios.patch(`/tasks/${data.id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await axios.delete(`/tasks/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });

  const reorderTask = useMutation({
    mutationFn: async (data: ReorderTaskData): Promise<Task> => {
      const response = await axios.patch(`/tasks/${data.id}/reorder/`, {
        target_position: data.target_position,
        target_status: data.target_status
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });

  // Fonction pour obtenir une tâche spécifique
  const getTask = (id: number) => {
    return tasks.find(task => task.id === id);
  };

  // Fonction pour filtrer les tâches par statut
  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  // Fonction pour filtrer les tâches par priorité
  const getTasksByPriority = (priority: Task['priority']) => {
    return tasks.filter(task => task.priority === priority);
  };

  // Fonction pour obtenir les tâches urgentes (priorité URGENT ou HIGH)
  const getUrgentTasks = () => {
    return tasks.filter(task => 
      task.priority === 'URGENT' || task.priority === 'HIGH'
    );
  };

  // Fonction pour obtenir les tâches très urgentes (priorité URGENT uniquement)
  const getVeryUrgentTasks = () => {
    return tasks.filter(task => task.priority === 'URGENT');
  };

  // Fonction pour obtenir les tâches avec échéance proche
  const getTasksWithNearDeadline = (daysAhead: number = 1) => {
    const now = new Date();
    const deadline = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => 
      task.due_at && 
      new Date(task.due_at) <= deadline && 
      task.status !== 'DONE'
    );
  };

  // Fonction pour obtenir les tâches en retard
  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter(task => 
      task.due_at && 
      new Date(task.due_at) < now && 
      task.status !== 'DONE'
    );
  };

  return {
    tasks,
    totalCount,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reorderTask,
    getTask,
    getTasksByStatus,
    getTasksByPriority,
    getUrgentTasks,
    getOverdueTasks,
  };
};
