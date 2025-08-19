
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/FormField';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, User, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';

const UserProfile = () => {
  const { user, loading, error, updating, updateUser } = useUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { toast } = useToast();

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
      <div className="min-h-screen bg-[#F9FAFB] p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-gray-600">Chargement du profil...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-6">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              Retour
            </Link>
          </div>
          <Card className="bg-white shadow-sm border-gray-200">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Réessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Retour
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-renovation-primary/10 rounded-lg">
              <User size={24} className="text-renovation-text" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
              <p className="text-gray-600">Gérez vos informations personnelles</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <Card className="bg-white shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Informations personnelles
              {loading && (
                <span className="ml-2 text-sm text-gray-500">
                  (Chargement...)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Link to="/">
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={updating || !firstName.trim() || !lastName.trim() || !user}
                  className="bg-renovation-primary hover:bg-renovation-primary/90 text-renovation-text"
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : !user ? (
                    'Chargement...'
                  ) : (
                    'Sauvegarder'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
