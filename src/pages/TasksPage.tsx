import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { UrgentTasks } from '@/components/UrgentTasks';
import { TasksGrid } from '@/components/TasksGrid';
import { BottomNavigation } from '@/components/BottomNavigation';
import type { NavigationTab } from '@/types/navigation';

const TasksPage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('taches');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-6">
          {/* Section des tâches urgentes */}
          <div className="mb-8">
            <UrgentTasks />
          </div>
          
          {/* Section de toutes les tâches */}
          <TasksGrid />
        </div>
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default TasksPage;
