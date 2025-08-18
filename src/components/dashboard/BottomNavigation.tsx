import React from 'react';
import { 
  Home, 
  Briefcase, 
  Mail, 
  CheckSquare, 
  Settings 
} from 'lucide-react';
import { NavigationTab } from '../Dashboard';

interface BottomNavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

const navItems = [
  { id: 'accueil' as NavigationTab, label: 'Accueil', icon: Home },
  { id: 'projets' as NavigationTab, label: 'Projets', icon: Briefcase },
  { id: 'boite' as NavigationTab, label: 'Boîte de réception', icon: Mail },
  { id: 'taches' as NavigationTab, label: 'Tâches', icon: CheckSquare },
  { id: 'parametres' as NavigationTab, label: 'Paramètres', icon: Settings }
];

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-navy-card border-t border-border">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center gap-1 transition-smooth animate-press"
            >
              <IconComponent 
                className={`w-5 h-5 ${isActive ? 'text-gold' : 'text-muted-foreground'}`} 
              />
              <span 
                className={`text-xs font-medium ${
                  isActive ? 'text-gold' : 'text-muted-foreground'
                }`}
              >
                {item.label === 'Boîte de réception' ? 'Boîte' : item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};