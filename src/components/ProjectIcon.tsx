import React from 'react';
import { getIconByValue } from '../config/icons';

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
  const iconEmoji = getIconByValue(icon);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg flex-shrink-0',
    md: 'w-12 h-12 text-2xl flex-shrink-0',
    lg: 'w-16 h-16 text-3xl flex-shrink-0',
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center leading-none text-center`}>
      <span className="inline-block align-middle">{iconEmoji}</span>
    </div>
  );
};
