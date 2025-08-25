import React from 'react';
import { Calendar, Mail, Globe } from 'lucide-react';

interface EventIconProps {
  provider: 'GOOGLE' | 'OUTLOOK' | 'ICAL';
  size?: 'sm' | 'md' | 'lg';
}

export const EventIcon = ({ provider, size = 'md' }: EventIconProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const getIcon = () => {
    switch (provider) {
      case 'GOOGLE':
        return <Calendar className={sizeClasses[size]} />;
      case 'OUTLOOK':
        return <Mail className={sizeClasses[size]} />;
      case 'ICAL':
        return <Globe className={sizeClasses[size]} />;
      default:
        return <Calendar className={sizeClasses[size]} />;
    }
  };

  const getColor = () => {
    switch (provider) {
      case 'GOOGLE':
        return 'text-blue-500';
      case 'OUTLOOK':
        return 'text-blue-600';
      case 'ICAL':
        return 'text-green-500';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className={`${getColor()} flex items-center justify-center`}>
      {getIcon()}
    </div>
  );
};
