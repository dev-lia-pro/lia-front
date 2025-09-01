import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { UpcomingMeetings } from '@/components/UpcomingMeetings';
import { PageNavigation } from '@/components/PageNavigation';
import { BottomNavigation } from '@/components/BottomNavigation';
import type { NavigationTab } from '@/types/navigation';
import EventsCalendar from '@/components/EventsCalendar';

const EventsPage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('agenda');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-6">
          {/* Section des événements du jour et à venir */}
          <UpcomingMeetings />

          {/* Agenda complet */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Agenda</h2>
            <EventsCalendar />
          </div>
        </div>
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default EventsPage;
