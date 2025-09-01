  import React, { useState } from 'react';
import { User, LogOut, Plus, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useProjects } from '@/hooks/useProjects';
import { useProjectStore } from '@/stores/projectStore';
import { ProjectIcon } from '@/components/ProjectIcon';
import { ProjectModal } from '@/components/ProjectModal';

export const DashboardHeader = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { projects, createProject } = useProjects();
  const { selected, setSelected } = useProjectStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleProfileClick = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/step1');
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès.",
    });
    setIsOpen(false);
  };

  return (
    <>
    <header className="flex items-center justify-between p-4 bg-navy-card border-b border-border">
      {/* Logo */}
      <button 
        onClick={() => navigate('/')}
        className="w-10 h-10 rounded-full border-2 border-gold flex items-center justify-center bg-navy-deep hover:bg-navy-muted transition-smooth cursor-pointer"
      >
        <span className="text-gold font-bold text-lg">L</span>
      </button>
      
      {/* App Name + Project Picker */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">LIA</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 px-3 text-sm flex items-center gap-2">
                <div className="w-5 h-5">
                  {selected?.id ? (
                    <ProjectIcon icon={projects.find(p => p.id === selected.id)?.icon || 'briefcase'} size="sm" className="!w-5 !h-5" />
                  ) : (
                    <span>⭐</span>
                  )}
                </div>
                <span>{selected?.title || 'Tous les projets'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-navy-card border-border text-foreground min-w-[220px]">
              <DropdownMenuItem
                onClick={() => setSelected({ id: null, title: 'Tous les projets' })}
                className="cursor-pointer hover:bg-muted items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center bg-navy-deep">
                    <span className="text-sm">⭐</span>
                  </div>
                  <div className="text-sm font-medium">Tous les projets</div>
                </div>
              </DropdownMenuItem>
              {projects?.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => setSelected({ id: p.id, title: p.title })}
                  className="cursor-pointer hover:bg-muted items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center bg-navy-deep overflow-hidden">
                      <ProjectIcon icon={p.icon} size="sm" className="!w-7 !h-7" />
                    </div>
                    <div className="text-sm font-medium">{p.title}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="h-9 w-9 p-0 border border-gold bg-gold hover:bg-gold/90 text-primary-foreground" onClick={() => setIsCreateOpen(true)} aria-label="Créer un projet" title="Créer un projet">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Profile Menu */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-10 h-10 rounded-full border border-gold flex items-center justify-center hover:bg-navy-muted transition-smooth animate-press p-0"
          >
            <User className="w-5 h-5 text-gold" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent
          align="end"
          className="bg-navy-card border-border text-foreground w-48"
        >
          <DropdownMenuItem
            onClick={handleProfileClick}
            className="hover:bg-navy-muted focus:bg-navy-muted cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            Mon profil
          </DropdownMenuItem>
          
          <DropdownMenuItem
            className="hover:bg-navy-muted focus:bg-navy-muted cursor-pointer"
            onSelect={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between w-full" onClick={toggleTheme}>
              <div className="flex items-center">
                {theme === 'dark' ? (
                  <Moon className="mr-2 h-4 w-4" />
                ) : (
                  <Sun className="mr-2 h-4 w-4" />
                )}
                <span>Thème</span>
              </div>
              <Switch
                checked={theme === 'light'}
                onCheckedChange={toggleTheme}
                className="ml-2"
              />
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-border" />
          
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
    <ProjectModal
      isOpen={isCreateOpen}
      onClose={() => setIsCreateOpen(false)}
      project={null}
      onSubmit={async (data) => {
        try {
          const project = await createProject.mutateAsync(data);
          if (project?.id) {
            setSelected({ id: project.id, title: project.title });
          }
          setIsCreateOpen(false);
        } catch (e) {
          // laisser le hook gérer les erreurs/toasts en amont
        }
      }}
      isLoading={createProject.isPending}
    />
    </>
  );
};
