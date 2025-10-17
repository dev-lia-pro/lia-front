import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Mail,
  Calendar,
  CheckSquare,
  Cloud,
  Settings
} from 'lucide-react';
import type { NavigationTab } from '@/types/navigation';

interface BottomNavigationProps {
  activeTab?: NavigationTab;
  onTabChange?: (tab: NavigationTab) => void;
}

const navItems = [
  { id: 'accueil' as NavigationTab, label: 'Accueil', icon: Home, path: '/' },
  { id: 'boite' as NavigationTab, label: 'Boîte', icon: Mail, path: '/messages' },
  { id: 'agenda' as NavigationTab, label: 'Agenda', icon: Calendar, path: '/events' },
  { id: 'taches' as NavigationTab, label: 'Tâches', icon: CheckSquare, path: '/tasks' },
  { id: 'drive' as NavigationTab, label: 'Fichiers', icon: Cloud, path: '/drive' }
];

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabClick = (e: React.MouseEvent, tab: NavigationTab, path: string) => {
    e.preventDefault();
    console.log('Navigation clicked:', tab, path);

    // Navigation directe
    if (path !== location.pathname) {
      navigate(path);
    }

    // Callback optionnel
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Déterminer l'onglet actif basé sur l'URL actuelle
  const currentTab = navItems.find(item => item.path === location.pathname)?.id || activeTab || 'accueil';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={(e) => handleTabClick(e, item.id, item.path)}
              className="flex flex-col items-center justify-center gap-1 transition-smooth animate-press sm:flex-col relative cursor-pointer"
              type="button"
            >
              <IconComponent
                className={`w-6 h-6 sm:w-5 sm:h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span
                className={`hidden sm:block text-sm font-medium ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};