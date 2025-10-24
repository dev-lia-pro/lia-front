import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NavigationTab } from '@/types/navigation';
import { ProjectsGrid } from '@/components/ProjectsGrid';
import { AssistantHistory } from '@/components/AssistantHistory';
import { ContactsSection } from '@/components/ContactsSection';
import { ProvidersPanel } from '@/components/ProvidersPanel';
import { NotificationPreferences } from '@/components/NotificationPreferences';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('accueil');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />

      <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}>
        <div className="px-4 py-6">
          {/* Section Projets */}
          <Card className="bg-card border-border mb-6">
            <CardContent className="pt-6">
              <ProjectsGrid />
            </CardContent>
          </Card>

          {/* Section des providers - NOUVEAU */}
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Fournisseurs de données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProvidersPanel />
            </CardContent>
          </Card>

          {/* Section Contacts */}
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContactsSection />
            </CardContent>
          </Card>

          {/* Section Historique de l'assistant */}
          <Card className="bg-card border-border mb-6 pt-6">
            <CardContent>
              <AssistantHistory />
            </CardContent>
          </Card>

          {/* Section des préférences de notifications */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Préférences de notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationPreferences />
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default SettingsPage;
