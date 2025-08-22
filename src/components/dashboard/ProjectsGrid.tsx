import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { ProjectModal } from './ProjectModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import ProjectDetailsModal from './ProjectDetailsModal';
import { ProjectIcon } from './ProjectIcon';
import { useProjects, Project, CreateProjectData, UpdateProjectData } from '../../hooks/useProjects';
import { useToast } from '../../hooks/use-toast';

export const ProjectsGrid = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects();
  const { toast } = useToast();

  const handleCreateProject = async (data: CreateProjectData) => {
    try {
      await createProject.mutateAsync(data);
      setIsCreateModalOpen(false);
      toast({
        title: "Projet créé",
        description: `Le projet "${data.title}" a été créé avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProject = async (data: UpdateProjectData) => {
    try {
      await updateProject.mutateAsync(data);
      setEditingProject(null);
      toast({
        title: "Projet modifié",
        description: `Le projet "${data.title}" a été modifié avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le projet. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    
    try {
      await deleteProject.mutateAsync(deletingProject.id);
      setDeletingProject(null);
      toast({
        title: "Projet supprimé",
        description: `Le projet "${deletingProject.title}" a été supprimé avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
  };

  const handleDeleteProjectClick = (project: Project) => {
    setDeletingProject(project);
  };

  if (isLoading) {
    return (
      <section className="animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Projets ({projects?.length || 0})</h3>
          <Button size="sm" className="h-9 w-9 p-0 border border-gold bg-gold text-primary-foreground" disabled>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-3 p-4 bg-navy-card rounded-xl border border-border animate-pulse"
            >
              <div className="w-12 h-12 rounded-full bg-border" />
              <div className="w-16 h-4 bg-border rounded" />
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
          Projets ({projects.length})
        </h3>
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="h-9 w-9 p-0 border border-gold bg-gold hover:bg-gold/90 text-primary-foreground" aria-label="Créer un projet" title="Créer un projet">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {projects.length === 0 ? (
        <div className="text-center py-8">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold border border-gold hover:bg-gold/90 flex items-center justify-center transition-all duration-200 cursor-pointer group active:scale-95"
            type="button"
          >
            <Plus className="w-8 h-8 text-primary-foreground transition-all duration-200" />
          </button>
          <p className="text-foreground/70 mb-2">Aucun projet pour le moment</p>
          <p className="text-sm text-foreground/50">Cliquez sur l'icône ci-dessus pour créer votre premier projet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative flex flex-col items-center gap-3 p-4 bg-navy-card rounded-xl border border-border hover:border-gold transition-smooth cursor-pointer active:scale-[0.98]"
              onClick={() => handleProjectClick(project)}
            >
              {/* Icône du projet */}
              <div className="w-12 h-12 rounded-full border-2 border-gold flex items-center justify-center bg-navy-deep overflow-hidden">
                <ProjectIcon icon={project.icon} size="sm" />
              </div>

              {/* Titre du projet */}
              <span className="text-sm text-foreground font-medium text-center">
                {project.title}
              </span>

              {/* Description du projet (optionnelle) */}
              {project.description && (
                <p className="text-xs text-foreground/70 text-center line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modale de création/modification */
      }
      <ProjectModal
        isOpen={isCreateModalOpen || !!editingProject}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
        isLoading={createProject.isPending || updateProject.isPending}
      />

      {/* Modale de détails */}
      <ProjectDetailsModal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
        showEdit={true}
        showDelete={true}
        onEdit={() => {
          if (selectedProject) {
            setEditingProject(selectedProject);
            setSelectedProject(null);
          }
        }}
        onDelete={() => {
          if (selectedProject) {
            setDeletingProject(selectedProject);
            setSelectedProject(null);
          }
        }}
      />

      {/* Modale de confirmation de suppression */}
      <DeleteConfirmModal
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDeleteProject}
        title="Supprimer le projet"
        message={`Êtes-vous sûr de vouloir supprimer le projet "${deletingProject?.title}" ? Cette action est irréversible.`}
        loading={deleteProject.isPending}
      />
    </section>
  );
};