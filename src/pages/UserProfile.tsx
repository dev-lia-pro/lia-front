
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/FormField';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import type { NavigationTab } from '@/types/navigation';

const UserProfile = () => {
  const { user, loading, error, updating, updateUser } = useUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<NavigationTab>('parametres');

  // Mettre à jour les champs quand les données utilisateur sont chargées
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Saving user profile...');
    console.log('User:', user);
    console.log('First name:', firstName);
    console.log('Last name:', lastName);
    
    if (!user) {
      console.error('No user data available');
      return;
    }

    const success = await updateUser({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    });

    console.log('Update success:', success);

    if (success) {
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
    } else {
      toast({
        title: "Erreur",
        description: error || "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-deep text-foreground flex flex-col">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="px-4 py-6">
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
                <span className="text-foreground">Chargement...</span>
              </div>
            </div>
          </div>
        </div>
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-navy-deep text-foreground flex flex-col">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="px-4 py-6">
            <Card className="bg-navy-card border-border">
              <CardContent className="p-8 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-deep text-foreground flex flex-col">
      <DashboardHeader />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-6">
          {/* Profile Form */}
          <Card className="bg-navy-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    id="firstName"
                    label="Prénom"
                    required
                    type="input"
                    inputProps={{
                      value: firstName,
                      onChange: (e) => setFirstName(e.target.value),
                      placeholder: "Votre prénom"
                    }}
                  />
                  <FormField
                    id="lastName"
                    label="Nom"
                    required
                    type="input"
                    inputProps={{
                      value: lastName,
                      onChange: (e) => setLastName(e.target.value),
                      placeholder: "Votre nom"
                    }}
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <div className="flex justify-end pt-6 border-t border-border">
                  <Button 
                    type="submit" 
                    disabled={updating || !firstName.trim() || !lastName.trim() || !user}
                    className="bg-gold hover:bg-gold/90 text-navy px-8"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : !user ? (
                      'Chargement...'
                    ) : (
                      'Sauvegarde'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default UserProfile;
