import React, { useState } from 'react';
import { Plus, Power, PowerOff, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectModal } from './ProjectModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import ProjectDetailsModal from './ProjectDetailsModal';
import { ProjectIcon } from './ProjectIcon';
import { useProjects, Project, CreateProjectData, UpdateProjectData } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';

export const ProjectsGrid = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { projects, isLoading, createProject, updateProject, deleteProject, toggleArchiveProject } = useProjects();
  const { toast } = useToast();

  // Séparer les projets actifs et archivés
  const activeProjects = projects.filter(p => !p.is_archived);
  const archivedProjects = projects.filter(p => p.is_archived);

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

  const handleToggleArchive = async (project: Project) => {
    try {
      await toggleArchiveProject.mutateAsync({
        id: project.id,
        isArchived: !project.is_archived,
      });
      toast({
        title: project.is_archived ? "Projet réactivé" : "Projet archivé",
        description: project.is_archived
          ? `Le projet "${project.title}" a été réactivé.`
          : `Le projet "${project.title}" a été archivé.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut du projet.",
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
          <h3 className="text-xl font-semibold text-foreground">Projets ({projects?.length || 0})</h3>
          <Button size="sm" className="h-9 w-9 p-0 border border-gold bg-gold text-primary-foreground" disabled>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-card rounded-lg border border-border animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-border" />
                <div className="w-32 h-4 bg-border rounded" />
              </div>
              <div className="w-20 h-8 bg-border rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-foreground">
          Projets ({activeProjects.length})
        </h3>
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="h-9 w-9 p-0 border border-gold bg-gold hover:bg-gold/90 text-primary-foreground" aria-label="Créer un projet" title="Créer un projet">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {activeProjects.length === 0 && archivedProjects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground/70 mb-2">Aucun projet pour le moment</p>
        </div>
      ) : (
        <>
          {/* Projets actifs */}
          <div className="space-y-3 mb-6">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-background rounded-lg border border-border gap-4"
              >
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleProjectClick(project)}>
                  <div className="w-12 h-12 rounded-full border-2 border-gold flex items-center justify-center bg-card overflow-hidden">
                    <ProjectIcon icon={project.icon} size="sm" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{project.title}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                        Actif
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-foreground/70 line-clamp-1">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditProject(project)}
                    className="border-border text-foreground hover:bg-muted"
                    aria-label="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleArchive(project)}
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    aria-label="Archiver"
                    title="Archiver le projet"
                  >
                    <Power className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteProjectClick(project)}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Projets archivés */}
          {archivedProjects.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-foreground mb-3">
                Projets archivés ({archivedProjects.length})
              </h4>
              <div className="space-y-3">
                {archivedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-background rounded-lg border border-border gap-4 opacity-60"
                  >
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleProjectClick(project)}>
                      <div className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center bg-card overflow-hidden">
                        <ProjectIcon icon={project.icon} size="sm" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{project.title}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">
                            Archivé
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-sm text-foreground/70 line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProject(project)}
                        className="border-border text-foreground hover:bg-muted"
                        aria-label="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleArchive(project)}
                        className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
                        aria-label="Réactiver"
                        title="Réactiver le projet"
                      >
                        <PowerOff className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProjectClick(project)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modale de création/modification */}
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
