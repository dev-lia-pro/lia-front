import React from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useProjects } from '@/hooks/useProjects';
import { ProjectIcon } from './ProjectIcon';

export const ProjectOverview: React.FC = () => {
  const { selected } = useProjectStore();
  const { projects } = useProjects();

  // Only show if a specific project is selected (not "Tous les projets")
  if (!selected?.id) {
    return null;
  }

  // Find the selected project
  const project = projects.find(p => p.id === selected.id);
  
  // Don't show if project not found or no overview
  if (!project || !project.overview) {
    return null;
  }

  return (
    <div className="bg-navy-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-secondary">
          <ProjectIcon icon={project.icon} size="sm" className="!w-5 !h-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Overview</h2>
      </div>
      
      <div className="text-foreground/80 text-sm leading-relaxed">
        {project.overview}
      </div>
    </div>
  );
};
