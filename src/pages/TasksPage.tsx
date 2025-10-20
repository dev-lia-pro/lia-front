import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TasksGrid } from '@/components/TasksGrid';
import { BottomNavigation } from '@/components/BottomNavigation';
import type { NavigationTab } from '@/types/navigation';
import { useSearchParams } from 'react-router-dom';

const TasksPage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('taches');
  const [searchParams] = useSearchParams();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />

      <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}>
        <div className="px-4 py-6">
          {/* Grille unifiée de toutes les tâches */}
          <TasksGrid includeUrgent={true} taskIdFromUrl={searchParams.get('task')} />
        </div>
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default TasksPage;
