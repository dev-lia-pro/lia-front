import React, { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { MainTitle } from './MainTitle';
import { UrgentTasks } from './UrgentTasks';
import { UpcomingMeetings } from './UpcomingMeetings';
import { BottomNavigation } from './BottomNavigation';
import type { NavigationTab } from '@/types/navigation';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('accueil');

  return (
    <div className="min-h-screen bg-navy-deep text-foreground flex flex-col">
      <DashboardHeader />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 space-y-6">
          <MainTitle />
          
          {/* Section des événements du jour et à venir */}
          <UpcomingMeetings />
          
          {/* Section des tâches urgentes */}
          <UrgentTasks />
          
          {/* Section des projets (aperçu) retirée */}
        </div>
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};