import React, { useState } from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export const DashboardHeader = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

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
    <header className="flex items-center justify-between p-4 bg-navy-card border-b border-border">
      {/* Logo */}
      <button 
        onClick={() => navigate('/')}
        className="w-10 h-10 rounded-full border-2 border-gold flex items-center justify-center bg-navy-deep hover:bg-navy-muted transition-smooth cursor-pointer"
      >
        <span className="text-gold font-bold text-lg">L</span>
      </button>
      
      {/* App Name */}
      <h1 className="text-xl font-semibold text-foreground">L-IA</h1>
      
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
  );
};