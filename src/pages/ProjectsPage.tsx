import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { ProjectsGrid } from '@/components/ProjectsGrid';
import { BottomNavigation } from '@/components/BottomNavigation';
import type { NavigationTab } from '@/types/navigation';

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('projets');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />

      <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}>
        <div className="px-4 py-6">
          {/* Section des projets */}
          <ProjectsGrid />
        </div>
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default ProjectsPage;
