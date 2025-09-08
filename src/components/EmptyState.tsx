import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  onCreateClick: () => void;
  buttonText?: string;
}

export const EmptyState = ({ 
  title, 
  description, 
  onCreateClick, 
  buttonText = "Créer" 
}: EmptyStateProps) => {
  return (
    <div className="text-center py-8">
      <p className="text-base text-foreground/70 mb-2">{title}</p>
    </div>
  );
};
