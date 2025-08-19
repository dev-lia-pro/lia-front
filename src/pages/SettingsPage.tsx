import React, { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PageNavigation } from '@/components/dashboard/PageNavigation';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  MessageSquare, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit,
  Check,
  X
} from 'lucide-react';
import type { NavigationTab } from '@/types/navigation';

interface Account {
  id: string;
  type: 'email' | 'sms' | 'agenda';
  name: string;
  identifier: string;
  isConnected: boolean;
}

const SettingsPage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('parametres');
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      type: 'email',
      name: 'Gmail',
      identifier: 'user@gmail.com',
      isConnected: true
    },
    {
      id: '2',
      type: 'agenda',
      name: 'Google Calendar',
      identifier: 'user@gmail.com',
      isConnected: true
    }
  ]);

  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [newAccount, setNewAccount] = useState({
    type: 'email' as 'email' | 'sms' | 'agenda',
    name: '',
    identifier: ''
  });

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5" />;
      case 'agenda':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Mail className="w-5 h-5" />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'sms':
        return 'SMS';
      case 'agenda':
        return 'Agenda';
      default:
        return type;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'text-blue-400';
      case 'sms':
        return 'text-green-400';
      case 'agenda':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleAddAccount = () => {
    if (newAccount.name.trim() && newAccount.identifier.trim()) {
      const account: Account = {
        id: Date.now().toString(),
        type: newAccount.type,
        name: newAccount.name.trim(),
        identifier: newAccount.identifier.trim(),
        isConnected: false
      };
      setAccounts([...accounts, account]);
      setNewAccount({ type: 'email', name: '', identifier: '' });
      setIsAddingAccount(false);
    }
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setNewAccount({
      type: account.type,
      name: account.name,
      identifier: account.identifier
    });
  };

  const handleSaveEdit = () => {
    if (editingAccount && newAccount.name.trim() && newAccount.identifier.trim()) {
      setAccounts(accounts.map(acc => 
        acc.id === editingAccount.id 
          ? { ...acc, name: newAccount.name.trim(), identifier: newAccount.identifier.trim() }
          : acc
      ));
      setEditingAccount(null);
      setNewAccount({ type: 'email', name: '', identifier: '' });
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    setAccounts(accounts.filter(acc => acc.id !== accountId));
  };

  const handleConnectAccount = (accountId: string) => {
    setAccounts(accounts.map(acc => 
      acc.id === accountId 
        ? { ...acc, isConnected: !acc.isConnected }
        : acc
    ));
  };

  return (
    <div className="min-h-screen bg-navy-deep text-foreground flex flex-col">
      <DashboardHeader />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-6">
          {/* Section des comptes */}
          <Card className="bg-navy-card border-border mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Comptes connectés
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setIsAddingAccount(true)}
                  className="bg-gold hover:bg-gold/90 text-navy"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un compte
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Formulaire d'ajout/édition */}
              {(isAddingAccount || editingAccount) && (
                <div className="mb-6 p-4 bg-navy-deep rounded-lg border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label htmlFor="accountType" className="text-sm text-foreground/70">
                        Type de compte
                      </Label>
                      <select
                        id="accountType"
                        value={newAccount.type}
                        onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as 'email' | 'sms' | 'agenda' })}
                        className="w-full mt-1 p-2 bg-navy-card border border-border rounded-md text-foreground"
                      >
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="agenda">Agenda</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="accountName" className="text-sm text-foreground/70">
                        Nom du compte
                      </Label>
                      <Input
                        id="accountName"
                        value={newAccount.name}
                        onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                        placeholder="Ex: Gmail, Outlook..."
                        className="mt-1 bg-navy-card border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountIdentifier" className="text-sm text-foreground/70">
                        Identifiant
                      </Label>
                      <Input
                        id="accountIdentifier"
                        value={newAccount.identifier}
                        onChange={(e) => setNewAccount({ ...newAccount, identifier: e.target.value })}
                        placeholder="user@example.com"
                        className="mt-1 bg-navy-card border-border text-foreground"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={editingAccount ? handleSaveEdit : handleAddAccount}
                      disabled={!newAccount.name.trim() || !newAccount.identifier.trim()}
                      className="bg-gold hover:bg-gold/90 text-navy"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {editingAccount ? 'Sauvegarder' : 'Ajouter'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingAccount(false);
                        setEditingAccount(null);
                        setNewAccount({ type: 'email', name: '', identifier: '' });
                      }}
                      className="border-border text-foreground hover:bg-navy-muted"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                </div>
              )}

              {/* Liste des comptes */}
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 bg-navy-deep rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-navy-card ${getAccountTypeColor(account.type)}`}>
                        {getAccountIcon(account.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{account.name}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-navy-card text-foreground/70">
                            {getAccountTypeLabel(account.type)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/70">{account.identifier}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={account.isConnected ? "outline" : "default"}
                        onClick={() => handleConnectAccount(account.id)}
                        className={account.isConnected 
                          ? "border-green-500/30 text-green-400 hover:bg-green-500/10" 
                          : "bg-green-500 hover:bg-green-600 text-white"
                        }
                      >
                        {account.isConnected ? 'Connecté' : 'Connecter'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditAccount(account)}
                        className="border-border text-foreground hover:bg-navy-muted"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAccount(account.id)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {accounts.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-navy-card border border-border flex items-center justify-center">
                      <Plus className="w-8 h-8 text-foreground/50" />
                    </div>
                    <p className="text-foreground/70 mb-2">Aucun compte configuré</p>
                    <p className="text-sm text-foreground/50">Ajoutez votre premier compte pour commencer</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section des préférences (mock) */}
          <Card className="bg-navy-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Préférences générales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Notifications push</Label>
                    <p className="text-sm text-foreground/70">Recevoir des notifications sur votre appareil</p>
                  </div>
                  <Button variant="outline" disabled className="border-border text-foreground/50">
                    Bientôt disponible
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Mode sombre</Label>
                    <p className="text-sm text-foreground/70">Activer le thème sombre</p>
                  </div>
                  <Button variant="outline" disabled className="border-border text-foreground/50">
                    Bientôt disponible
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Synchronisation automatique</Label>
                    <p className="text-sm text-foreground/70">Synchroniser vos données en arrière-plan</p>
                  </div>
                  <Button variant="outline" disabled className="border-border text-foreground/50">
                    Bientôt disponible
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default SettingsPage;
