import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ModalActions } from './ModalActions';
import { Project, CreateProjectData, UpdateProjectData } from '../hooks/useProjects';
import { ICON_PACK, ICON_CATEGORIES, type IconCategory } from '../config/icons';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  onSubmit: (data: CreateProjectData | UpdateProjectData) => void;
  isLoading?: boolean;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSubmit,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IconCategory>('all');

  const isEditing = !!project;

  useEffect(() => {
    if (project) {
      // Mode édition : pré-remplir avec les données du projet
      setTitle(project.title);
      setDescription(project.description);
      setSelectedIcon(project.icon);
    } else {
      // Mode création : champs vides
      setTitle('');
      setDescription('');
      setSelectedIcon('');
    }
    // Réinitialiser la recherche à chaque ouverture
    setSearchQuery('');
    setSelectedCategory('all');
  }, [project, isOpen]);

  // Filtrer les icônes selon la recherche et la catégorie
  const filteredIcons = useMemo(() => {
    return ICON_PACK.filter(icon => {
      // Filtrer par catégorie
      const matchesCategory = selectedCategory === 'all' || icon.category === selectedCategory;

      // Filtrer par recherche (nom, value, keywords)
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch = searchLower === '' ||
        icon.name.toLowerCase().includes(searchLower) ||
        icon.value.toLowerCase().includes(searchLower) ||
        icon.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !selectedIcon) {
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim(),
      icon: selectedIcon,
    };

    if (isEditing && project) {
      onSubmit({ ...data, id: project.id } as UpdateProjectData);
    } else {
      onSubmit(data);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Réinitialiser les champs quand on ferme la modale
      if (!project) {
        setTitle('');
        setDescription('');
        setSelectedIcon('');
      }
      setSearchQuery('');
      setSelectedCategory('all');
      onClose();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>Modifier le projet</>
            ) : (
              <>
                <Plus className="w-5 h-5 text-gold" />
                Créer un nouveau projet
              </>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing
              ? 'Modifier les paramètres du projet : titre, description et icône'
              : 'Créer un nouveau projet en définissant un titre, une description optionnelle et en choisissant une icône'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto px-1 py-1">
          {/* Titre */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Titre *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom du projet"
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du projet (optionnel)"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Sélecteur d'icône */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Icône *
            </label>

            {/* Barre de recherche */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher une icône..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
                disabled={isLoading}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtres par catégorie */}
            <div className="flex flex-wrap gap-2">
              {ICON_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    selectedCategory === category.value
                      ? 'bg-gold/10 border-gold text-gold'
                      : 'border-border hover:border-gold/50 text-foreground/70 hover:text-foreground'
                  }`}
                  disabled={isLoading}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Compteur de résultats */}
            <div className="text-xs text-muted-foreground">
              {filteredIcons.length} icône{filteredIcons.length > 1 ? 's' : ''} trouvée{filteredIcons.length > 1 ? 's' : ''}
            </div>

            {/* Grille d'icônes */}
            <div className="grid grid-cols-10 gap-2 max-h-80 overflow-y-auto overflow-x-hidden pt-2 pr-2">
              {filteredIcons.map((iconOption) => {
                const IconComponent = iconOption.icon;
                return (
                  <button
                    key={iconOption.value}
                    type="button"
                    onClick={() => setSelectedIcon(iconOption.value)}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-200 hover:scale-105 transform-gpu will-change-transform ${
                      selectedIcon === iconOption.value
                        ? 'border-gold bg-gold/10'
                        : 'border-border hover:border-gold/50'
                    }`}
                    disabled={isLoading}
                    title={iconOption.name}
                  >
                    <IconComponent size={20} strokeWidth={2} className="text-foreground" />
                  </button>
                );
              })}
            </div>

            {filteredIcons.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune icône trouvée pour "{searchQuery}"
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <ModalActions
            onCancel={handleClose}
            onSubmit={() => handleSubmit({} as React.FormEvent)}
            submitText={isEditing ? 'Modifier' : 'Créer'}
            isLoading={isLoading}
            isSubmitDisabled={!title.trim() || !selectedIcon}
            isEditMode={isEditing}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
