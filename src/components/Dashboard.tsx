import React, { useState } from 'react';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { MainTitle } from './dashboard/MainTitle';
import { UrgentTasks } from './dashboard/UrgentTasks';
import { UpcomingMeetings } from './dashboard/UpcomingMeetings';
import { ProjectsGrid } from './dashboard/ProjectsGrid';
import { BottomNavigation } from './dashboard/BottomNavigation';

export type NavigationTab = 'accueil' | 'projets' | 'boite' | 'agenda' | 'taches' | 'parametres';

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
          
          {/* Section des projets (aperçu) */}
          <div className="mb-4">
            <ProjectsGrid />
          </div>
        </div>
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};