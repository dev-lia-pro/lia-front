import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  User,
  Mail,
  Phone,
  Building2,
  Download,
  Upload,
  GitMerge,
  RefreshCw,
  Trash2,
  Edit,
  ChevronRight
} from 'lucide-react';
import { useContacts, useExtractContactsFromMessages, useContactStatistics, useDeleteContact } from '@/hooks/useContacts';
import { ContactForm } from './ContactForm';
import { ContactMergeModal } from './ContactMergeModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import type { Contact, ContactList } from '@/types/contact';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pagination } from './Pagination';
import { PAGE_SIZE } from '@/config/pagination';

export const ContactsSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactList | null>(null);
  const [deletingContact, setDeletingContact] = useState<ContactList | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());

  const { toast } = useToast();

  // Hooks pour les données
  const { data: contactsData, isLoading, refetch } = useContacts({
    search: searchQuery || undefined,
    page: currentPage,
    page_size: PAGE_SIZE
  });

  // Réinitialiser la page à 1 quand la recherche change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  
  const { data: statistics, refetch: refetchStatistics } = useContactStatistics();
  const extractMutation = useExtractContactsFromMessages();
  const deleteMutation = useDeleteContact();
  
  const contacts = contactsData?.results || [];
  
  const handleExtractContacts = async () => {
    try {
      await extractMutation.mutateAsync();
      toast({
        title: "Extraction lancée",
        description: "L'extraction des contacts depuis vos messages a été lancée en arrière-plan.",
      });
      // Rafraîchir après quelques secondes
      setTimeout(() => refetch(), 3000);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de lancer l'extraction des contacts.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteContact = async (contact: ContactList) => {
    // Cette fonction sera appelée depuis le DeleteConfirmModal
    await deleteMutation.mutateAsync(contact.id);
    
    // Rafraîchir les listes et statistiques
    await Promise.all([
      refetch(),
      refetchStatistics()
    ]);
    
    toast({
      title: "Contact supprimé",
      description: `${contact.display_name} a été supprimé avec succès.`,
    });
  };
  
  const toggleContactSelection = (contactId: number) => {
    const newSelection = new Set(selectedContacts);
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId);
    } else {
      newSelection.add(contactId);
    }
    setSelectedContacts(newSelection);
  };
  
  const handleMergeContacts = () => {
    if (selectedContacts.size < 2) {
      toast({
        title: "Sélection insuffisante",
        description: "Veuillez sélectionner au moins 2 contacts à fusionner.",
        variant: "destructive",
      });
      return;
    }
    setShowMergeModal(true);
  };
  
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  
  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Rechercher des contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          {selectedContacts.size > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMergeContacts}
            >
              <GitMerge className="w-4 h-4 mr-1" />
              Fusionner ({selectedContacts.size})
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExtractContacts}
            disabled={extractMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${extractMutation.isPending ? 'animate-spin' : ''}`} />
            Extraire
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddingContact(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Nouveau
          </Button>
        </div>
      </div>
      
      {/* Statistiques */}
      {statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{statistics.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{statistics.with_email}</div>
            <div className="text-xs text-muted-foreground">Avec email</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{statistics.with_phone}</div>
            <div className="text-xs text-muted-foreground">Avec téléphone</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{statistics.from_google}</div>
            <div className="text-xs text-muted-foreground">Google</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{statistics.from_icloud}</div>
            <div className="text-xs text-muted-foreground">iCloud</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{statistics.from_outlook}</div>
            <div className="text-xs text-muted-foreground">Outlook</div>
          </div>
        </div>
      )}
      
      {/* Tableau des contacts - Desktop */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={selectedContacts.size === contacts.length && contacts.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedContacts(new Set(contacts.map(c => c.id)));
                    } else {
                      setSelectedContacts(new Set());
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <div className="text-muted-foreground">Chargement des contacts...</div>
                </TableCell>
              </TableRow>
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-muted-foreground">Aucun contact trouvé</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={handleExtractContacts}
                  >
                    Extraire depuis les messages
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(contact.id)}
                      onChange={() => toggleContactSelection(contact.id)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {contact.avatar_url ? (
                          <AvatarImage src={contact.avatar_url} alt={contact.display_name} />
                        ) : null}
                        <AvatarFallback>{getInitials(contact.display_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{contact.display_name}</div>
                        {contact.is_self && (
                          <Badge variant="secondary" className="text-xs">Moi</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.primary_email ? (
                      <a href={`mailto:${contact.primary_email}`} className="text-primary hover:underline flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {contact.primary_email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.primary_phone ? (
                      <a href={`tel:${contact.primary_phone}`} className="text-primary hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {contact.primary_phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.company ? (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        {contact.company}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={contact.source === 'GOOGLE' ? 'default' : 'secondary'}>
                      {contact.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingContact(contact)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingContact(contact)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Vue mobile - Cartes */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <div className="text-muted-foreground">Chargement des contacts...</div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <div className="text-muted-foreground">Aucun contact trouvé</div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={handleExtractContacts}
            >
              Extraire depuis les messages
            </Button>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedContacts.has(contact.id)}
                    onChange={() => toggleContactSelection(contact.id)}
                    className="rounded border-gray-300 mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {contact.avatar_url && (
                          <AvatarImage src={contact.avatar_url} alt={contact.display_name} />
                        )}
                        <AvatarFallback>{getInitials(contact.display_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{contact.display_name}</div>
                        {contact.is_self && (
                          <Badge variant="secondary" className="text-xs">Moi</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingContact(contact)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingContact(contact)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                {contact.primary_email && (
                  <a href={`mailto:${contact.primary_email}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{contact.primary_email}</span>
                  </a>
                )}
                {contact.primary_phone && (
                  <a href={`tel:${contact.primary_phone}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Phone className="w-3 h-3" />
                    <span>{contact.primary_phone}</span>
                  </a>
                )}
                {contact.company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-3 h-3" />
                    <span>{contact.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant={contact.source === 'GOOGLE' ? 'default' : 'secondary'}>
                    {contact.source}
                  </Badge>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Pagination */}
      {contactsData && contactsData.count > PAGE_SIZE && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(contactsData.count / PAGE_SIZE)}
          totalCount={contactsData.count}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}
      
      {/* Modals */}
      {isAddingContact && (
        <ContactForm
          onClose={() => setIsAddingContact(false)}
          onSuccess={async () => {
            setIsAddingContact(false);
            // Rafraîchir les listes et statistiques
            await Promise.all([
              refetch(),
              refetchStatistics()
            ]);
            toast({
              title: "Contact créé",
              description: "Le contact a été créé avec succès.",
            });
          }}
        />
      )}
      
      {editingContact && (
        <ContactForm
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSuccess={async () => {
            setEditingContact(null);
            // Rafraîchir les listes et statistiques
            await Promise.all([
              refetch(),
              refetchStatistics()
            ]);
            toast({
              title: "Contact modifié",
              description: "Le contact a été modifié avec succès.",
            });
          }}
        />
      )}
      
      {deletingContact && (
        <DeleteConfirmModal
          isOpen={!!deletingContact}
          onClose={() => setDeletingContact(null)}
          onConfirm={() => handleDeleteContact(deletingContact)}
          title="Supprimer le contact"
          description={`Êtes-vous sûr de vouloir supprimer ${deletingContact.display_name} ? Cette action est irréversible.`}
        />
      )}
      
      {showMergeModal && (
        <ContactMergeModal
          contactIds={Array.from(selectedContacts)}
          onClose={() => {
            setShowMergeModal(false);
            setSelectedContacts(new Set());
          }}
          onSuccess={() => {
            setShowMergeModal(false);
            setSelectedContacts(new Set());
            refetch();
            toast({
              title: "Contacts fusionnés",
              description: "Les contacts ont été fusionnés avec succès.",
            });
          }}
        />
      )}
    </div>
  );
};