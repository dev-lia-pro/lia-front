import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PageNavigation } from '@/components/dashboard/PageNavigation';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import type { NavigationTab } from '@/types/navigation';

const MessagesPage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('boite');

  return (
    <div className="min-h-screen bg-navy-deep text-foreground flex flex-col">
      <DashboardHeader />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-6">
          {/* Titre de la page */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Boîte de réception</h3>
          </div>
          
          {/* Section des messages */}
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-navy-card border border-border flex items-center justify-center">
              <svg className="w-8 h-8 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-foreground/70 mb-2">Aucun message pour le moment</p>
            <p className="text-sm text-foreground/50">Vos messages apparaîtront ici</p>
          </div>
        </div>
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default MessagesPage;
