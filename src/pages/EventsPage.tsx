import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { UpcomingMeetings } from '@/components/dashboard/UpcomingMeetings';
import { PageNavigation } from '@/components/dashboard/PageNavigation';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import type { NavigationTab } from '@/types/navigation';

const EventsPage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('agenda');

  return (
    <div className="min-h-screen bg-navy-deep text-foreground flex flex-col">
      <DashboardHeader />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-6">
          {/* Section des événements du jour et à venir */}
          <UpcomingMeetings />
        </div>
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default EventsPage;
