import React from 'react';
import { getIconByValue } from '../config/icons';
import { FolderOpen } from 'lucide-react';

interface ProjectIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProjectIcon: React.FC<ProjectIconProps> = ({
  icon,
  size = 'md',
  className = ''
}) => {
  const IconComponent = getIconByValue(icon);

  // Tailles adaptées pour les icônes vectorielles Lucide
  const sizeMap = {
    sm: 16,  // 16px pour les petites icônes
    md: 24,  // 24px pour les moyennes icônes
    lg: 32,  // 32px pour les grandes icônes
  };

  const iconSize = sizeMap[size];

  // Si l'icône n'existe pas, afficher une icône par défaut
  const Icon = IconComponent || FolderOpen;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Icon
        size={iconSize}
        className="text-foreground"
        strokeWidth={2}
      />
    </div>
  );
};
