import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cascade?: boolean) => void | Promise<void>;
  title: string;
  description: string;
  showCascadeOption?: boolean;
  cascadeDescription?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  showCascadeOption = false,
  cascadeDescription,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [cascadeDeletion, setCascadeDeletion] = useState(true);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(showCascadeOption ? cascadeDeletion : undefined);
      // Si onConfirm réussit, on ferme la modal
      setIsDeleting(false);
      onClose();
    } catch (error) {
      // En cas d'erreur, on réinitialise l'état pour permettre de réessayer
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={isDeleting ? undefined : onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {showCascadeOption && (
          <div className="py-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="cascade-deletion"
                checked={cascadeDeletion}
                onCheckedChange={(checked) => setCascadeDeletion(checked as boolean)}
                disabled={isDeleting}
              />
              <label
                htmlFor="cascade-deletion"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <span className="block">Supprimer les données associées</span>
                {cascadeDescription && (
                  <span className="block mt-1 text-xs text-muted-foreground">
                    {cascadeDescription}
                  </span>
                )}
              </label>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting}
            variant="destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};