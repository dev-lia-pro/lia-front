import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';

export interface Project {
  id: number;
  title: string;
  description: string;
  icon: string;
  user: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CreateProjectData {
  title: string;
  description: string;
  icon: string;
}

export interface UpdateProjectData extends CreateProjectData {
  id: number;
}

const PROJECTS_QUERY_KEY = 'projects';

export const useProjects = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [PROJECTS_QUERY_KEY],
    queryFn: async (): Promise<PaginatedResponse<Project>> => {
      const response = await axios.get('/projects/');
      return response.data;
    },
  });

  // Extraire les projets de la réponse paginée
  const projects = data?.results || [];
  const totalCount = data?.count || 0;

  const createProject = useMutation({
    mutationFn: async (data: CreateProjectData): Promise<Project> => {
      const response = await axios.post('/projects/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
    },
  });

  const updateProject = useMutation({
    mutationFn: async (data: UpdateProjectData): Promise<Project> => {
      const response = await axios.patch(`/projects/${data.id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await axios.delete(`/projects/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
    },
  });

  return {
    projects,
    totalCount,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
  };
};
