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
      <button
        onClick={onCreateClick}
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold border border-gold hover:bg-gold/90 flex items-center justify-center transition-all duration-200 cursor-pointer group active:scale-95"
        type="button"
      >
        <Plus className="w-8 h-8 text-primary-foreground transition-all duration-200" />
      </button>
      <p className="text-base text-foreground/70 mb-2">{title}</p>
      <p className="text-base text-foreground/50">{description}</p>
    </div>
  );
};
