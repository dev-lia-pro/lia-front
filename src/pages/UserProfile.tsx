
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Globe, Edit2, Trash2, Plus } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BottomNavigation } from '@/components/BottomNavigation';
import { GROUPED_TIMEZONES } from '@/constants/timezones';
import type { NavigationTab } from '@/types/navigation';

const UserProfile = () => {
  const { user, loading, error, updating, updateUser } = useUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [timezone, setTimezone] = useState('Europe/Paris');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<NavigationTab>('accueil');
  
  // Memory management state
  const [memoryData, setMemoryData] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');

  // Mettre à jour les champs quand les données utilisateur sont chargées
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setTimezone(user.timezone || 'Europe/Paris');
      // Ensure memory_data is always an array
      const memoryArray = Array.isArray(user.memory_data) ? user.memory_data : [];
      setMemoryData(memoryArray);
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
      timezone: timezone,
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

  // Memory management functions
  const handleEditMemory = (index: number) => {
    setEditingIndex(index);
    setEditingText(memoryData[index]);
  };

  const handleSaveEdit = async () => {
    if (!editingText.trim()) return;
    
    const updatedMemory = [...memoryData];
    updatedMemory[editingIndex!] = editingText.trim();
    
    const success = await updateUser({
      memory_data: updatedMemory,
    });
    
    if (success) {
      setMemoryData(updatedMemory);
      setEditingIndex(null);
      setEditingText('');
      toast({
        title: "Mémoire mise à jour",
        description: "Votre mémoire a été modifiée avec succès.",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  const handleDeleteMemory = async (index: number) => {
    const updatedMemory = memoryData.filter((_, i) => i !== index);
    
    const success = await updateUser({
      memory_data: updatedMemory,
    });
    
    if (success) {
      setMemoryData(updatedMemory);
      toast({
        title: "Mémoire supprimée",
        description: "Votre mémoire a été supprimée avec succès.",
      });
    }
  };

  const handleAddNewMemory = async () => {
    if (!newMemoryText.trim()) return;
    
    const updatedMemory = [...memoryData, newMemoryText.trim()];
    
    const success = await updateUser({
      memory_data: updatedMemory,
    });
    
    if (success) {
      setMemoryData(updatedMemory);
      setNewMemoryText('');
      setIsAddingNew(false);
      toast({
        title: "Mémoire ajoutée",
        description: "Votre nouvelle mémoire a été ajoutée avec succès.",
      });
    }
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewMemoryText('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}>
          <div className="px-4 py-6">
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}>
          <div className="px-4 py-6">
            <Card className="bg-card border-border">
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />

      <div className="flex-1 overflow-y-auto pb-20 pt-16">
        <div className="px-4 py-6">
          {/* Profile Form */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                {/* Prénom, Nom et Timezone sur une ligne responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

                  {/* Timezone selector */}
                  <div className="space-y-2">
                    <label htmlFor="timezone" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Fuseau horaire
                    </label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="w-full bg-navy-muted border-border text-foreground">
                        <SelectValue placeholder="Sélectionnez votre fuseau horaire" />
                      </SelectTrigger>
                      <SelectContent className="bg-navy-card border-border max-h-[400px]">
                        {Object.entries(GROUPED_TIMEZONES).map(([region, timezones]) => (
                          <SelectGroup key={region}>
                            <SelectLabel className="text-muted-foreground font-semibold">{region}</SelectLabel>
                            {timezones.map((tz) => (
                              <SelectItem
                                key={tz.value}
                                value={tz.value}
                                className="text-foreground hover:bg-navy-muted cursor-pointer"
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span>{tz.label}</span>
                                  <span className="text-xs text-muted-foreground ml-4">{tz.offset}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Le fuseau horaire sera utilisé pour l'affichage de vos événements et rendez-vous.
                </p>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <div className="flex justify-end pt-6 border-t border-border">
                  <Button 
                    type="submit" 
                    disabled={updating || !firstName.trim() || !lastName.trim() || !user}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
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

          {/* Memory Data Card */}
          <Card className="bg-card border-border mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                Mémoires sauvegardées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {memoryData.length === 0 && !isAddingNew ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucune mémoire sauvegardée</p>
                  <Button
                    onClick={() => setIsAddingNew(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une mémoire
                  </Button>
                </div>
              ) : (
                <div className="space-y-0">
                  {memoryData.map((memory, index) => (
                    <div key={index} className="group">
                      {editingIndex === index ? (
                        <div className="flex items-center gap-2 py-3">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="flex-1 bg-navy-muted border border-border rounded px-3 py-2 text-foreground"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!editingText.trim()}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between py-3 group-hover:bg-navy-muted/50 transition-colors">
                          <p className="flex-1 text-foreground pr-4">{memory}</p>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditMemory(index)}
                              className="h-8 w-8 p-0 hover:bg-navy-muted"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteMemory(index)}
                              className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {index < memoryData.length - 1 && (
                        <div className="border-b border-border/50" />
                      )}
                    </div>
                  ))}
                  
                  {isAddingNew && (
                    <div className="flex items-center gap-2 py-3 border-t border-border/50">
                      <input
                        type="text"
                        value={newMemoryText}
                        onChange={(e) => setNewMemoryText(e.target.value)}
                        placeholder="Ajouter une nouvelle mémoire..."
                        className="flex-1 bg-navy-muted border border-border rounded px-3 py-2 text-foreground"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleAddNewMemory}
                        disabled={!newMemoryText.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelAdd}
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                  
                  {!isAddingNew && memoryData.length > 0 && (
                    <div className="pt-4 border-t border-border/50">
                      <Button
                        onClick={() => setIsAddingNew(true)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une mémoire
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default UserProfile;
