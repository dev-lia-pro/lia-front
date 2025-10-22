import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationCompactProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/**
 * Version compacte de la pagination pour les espaces restreints (comme la sidebar des conversations)
 * Affiche uniquement : Précédent | Page X/Y | Suivant
 */
export const PaginationCompact: React.FC<PaginationCompactProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}) => {
  // Calculer l'affichage "de X à Y"
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Bouton Précédent */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1.5 rounded border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Page précédente"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Compteur */}
      <div className="text-xs font-medium text-foreground min-w-[60px] text-center">
        {currentPage} sur {totalPages}
      </div>

      {/* Bouton Suivant */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Page suivante"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
