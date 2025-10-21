import React, { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { ProjectOverview } from './ProjectOverview';
import { TasksGrid } from './TasksGrid';
import { UpcomingMeetings } from './UpcomingMeetings';
import { BottomNavigation } from './BottomNavigation';
import type { NavigationTab } from '@/types/navigation';

interface DashboardProps {
  className?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('accueil');

  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col ${className}`}>
      <DashboardHeader />

      <main className="flex-1 overflow-y-auto" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}>
        <div className="px-4 py-6 space-y-6">
          <ProjectOverview />
          <UpcomingMeetings />
          <TasksGrid
            urgentOnlyFilter={true}
            showToggles={true}
            includeUrgent={true}
            disableUrgentBackground={true}
          />
        </div>
      </main>
      
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};