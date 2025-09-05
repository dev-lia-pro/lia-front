import React from 'react';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface TasksGridHeaderProps {
  totalCount: number;
  urgentOnlyFilter: boolean;
  showToggles: boolean;
  urgentOnly: boolean;
  showDone: boolean;
  onToggleUrgentOnly: () => void;
  onToggleShowDone: () => void;
}

export const TasksGridHeader: React.FC<TasksGridHeaderProps> = ({
  totalCount,
  urgentOnlyFilter,
  showToggles,
  urgentOnly,
  showDone,
  onToggleUrgentOnly,
  onToggleShowDone
}) => {
  const title = urgentOnlyFilter && !showToggles ? 'Tâches urgentes' : 'Tâches';
  
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-semibold text-foreground">
        {title} ({totalCount})
      </h3>
      
      {showToggles && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleUrgentOnly}
            className="px-2 py-1 rounded border border-border bg-card hover:bg-card/80 text-foreground text-xs inline-flex items-center gap-1"
            title={urgentOnly ? 'Afficher toutes les tâches' : 'Afficher uniquement les urgentes'}
          >
            <AlertTriangle className={`w-4 h-4 ${urgentOnly ? 'text-red-500' : ''}`} />
            <span className="hidden sm:inline">Urgentes uniquement</span>
          </button>
          
          <button
            type="button"
            onClick={onToggleShowDone}
            className="px-2 py-1 rounded border border-border bg-card hover:bg-card/80 text-foreground text-xs inline-flex items-center gap-1"
            title={showDone ? 'Masquer Terminé' : 'Afficher Terminé'}
          >
            {showDone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {showDone ? 'Masquer terminés' : 'Afficher terminés'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};