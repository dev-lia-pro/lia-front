import React from 'react';
import { Button } from '@/components/ui/button';

interface ModalActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitText: string;
  cancelText?: string;
  isLoading?: boolean;
  isSubmitDisabled?: boolean;
  isEditMode?: boolean;
}

export const ModalActions = ({
  onCancel,
  onSubmit,
  submitText,
  cancelText = 'Annuler',
  isLoading = false,
  isSubmitDisabled = false,
  isEditMode = false
}: ModalActionsProps) => {
  const getSubmitText = () => {
    if (isLoading) {
      return isEditMode ? 'Modification...' : 'Création...';
    }
    return submitText;
  };

  const getLoadingSpinner = () => {
    if (!isLoading) return null;
    
    return (
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    );
  };

  return (
    <div className="flex gap-3 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
        className="flex-1 border-border text-foreground hover:bg-navy-muted"
      >
        {cancelText}
      </Button>
      
      <Button
        type="submit"
        disabled={isLoading || isSubmitDisabled}
        className={`flex-1 transition-all duration-200 ${
          isSubmitDisabled 
            ? 'bg-muted text-muted-foreground cursor-not-allowed' 
            : 'bg-gold hover:bg-gold-muted text-navy-deep'
        }`}
      >
        {getLoadingSpinner()}
        {getSubmitText()}
      </Button>
    </div>
  );
};
