import React, { useState } from 'react';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { MainTitle } from './dashboard/MainTitle';
import { UrgentTasks } from './dashboard/UrgentTasks';
import { UpcomingMeetings } from './dashboard/UpcomingMeetings';
import { ProjectsGrid } from './dashboard/ProjectsGrid';
import { BottomNavigation } from './dashboard/BottomNavigation';
import { VoiceInput } from './VoiceInput';

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
          
          {/* Section des projets (aperçu) retirée */}
        </div>
      </div>

      {/* Floating Voice Input Button */}
      <div className="fixed bottom-24 right-4 z-50">
        <VoiceInput 
          onResult={(text) => console.log('Voice result:', text)}
        />
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};