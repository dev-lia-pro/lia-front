import React from 'react';
import { AlertTriangle, Eye, EyeOff, Hand } from 'lucide-react';

interface TasksGridHeaderProps {
  totalCount: number;
  urgentOnlyFilter: boolean;
  showToggles: boolean;
  urgentOnly: boolean;
  showDone: boolean;
  searchKeyword: string;
  manualOnly: boolean;
  onToggleUrgentOnly: () => void;
  onToggleShowDone: () => void;
  onSearchChange: (value: string) => void;
  onToggleManualOnly: () => void;
}

export const TasksGridHeader: React.FC<TasksGridHeaderProps> = ({
  totalCount,
  urgentOnlyFilter,
  showToggles,
  urgentOnly,
  showDone,
  searchKeyword,
  manualOnly,
  onToggleUrgentOnly,
  onToggleShowDone,
  onSearchChange,
  onToggleManualOnly
}) => {
  const title = urgentOnlyFilter && !showToggles ? 'Tâches urgentes' : 'Tâches';

  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">
          {title} ({totalCount})
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <input
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher..."
          className="bg-card border border-border rounded px-3 py-1.5 text-sm w-full sm:flex-1 lg:flex-none lg:w-1/3"
        />

        {showToggles && (
          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={onToggleManualOnly}
              className={`px-2 py-1 rounded border border-border text-xs inline-flex items-center gap-1 ${
                manualOnly ? 'bg-primary/10 hover:bg-primary/20' : 'bg-card hover:bg-card/80'
              } text-foreground`}
              title={manualOnly ? 'Afficher toutes les tâches' : 'Afficher uniquement les tâches manuelles'}
            >
              <Hand className={`w-4 h-4 ${manualOnly ? 'text-primary' : ''}`} />
              <span className="hidden sm:inline">Manuelles</span>
            </button>

            {!urgentOnlyFilter && (
              <button
                type="button"
                onClick={onToggleUrgentOnly}
                className={`px-2 py-1 rounded border border-border text-xs inline-flex items-center gap-1 ${
                  urgentOnly ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-card hover:bg-card/80'
                } text-foreground`}
                title={urgentOnly ? 'Afficher toutes les tâches' : 'Afficher uniquement les urgentes'}
              >
                <AlertTriangle className={`w-4 h-4 ${urgentOnly ? 'text-red-500' : ''}`} />
                <span className="hidden sm:inline">Urgentes</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleShowDone}
              className={`px-2 py-1 rounded border border-border text-xs inline-flex items-center gap-1 ${
                !showDone ? 'bg-yellow-500/10 hover:bg-yellow-500/20' : 'bg-card hover:bg-card/80'
              } text-foreground`}
              title={showDone ? 'Masquer les tâches terminées' : 'Afficher les tâches terminées'}
            >
              {showDone ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-yellow-500" />}
              <span className="hidden sm:inline">Non-terminées</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};