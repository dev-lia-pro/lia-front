import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X, User, Mail, Phone, Building2, MapPin } from 'lucide-react';
import { useContacts, useMergeContacts } from '@/hooks/useContacts';
import type { Contact, ContactMergeRequest } from '@/types/contact';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ContactMergeModalProps {
  contactIds: number[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ContactMergeModal: React.FC<ContactMergeModalProps> = ({
  contactIds,
  onClose,
  onSuccess,
}) => {
  const [selectedPrimary, setSelectedPrimary] = useState<number | null>(null);
  const [fieldChoices, setFieldChoices] = useState<Record<string, any>>({});
  const [emailChoices, setEmailChoices] = useState<Record<string, boolean>>({});
  const [phoneChoices, setPhoneChoices] = useState<Record<string, boolean>>({});
  const [addressChoices, setAddressChoices] = useState<Record<string, boolean>>({});
  
  const mergeMutation = useMergeContacts();
  
  // Charger les détails complets de chaque contact
  const contactQueries = contactIds.map(id => 
    useContacts({ ids: [id] })
  );
  
  const allLoaded = contactQueries.every(q => !q.isLoading);
  const contacts = contactQueries
    .map(q => q.data?.results?.[0])
    .filter((c): c is Contact => !!c);
  
  // Initialiser le contact principal et les choix de champs
  useEffect(() => {
    if (contacts.length > 0 && !selectedPrimary) {
      // Choisir le contact avec le plus d'informations comme principal par défaut
      const primaryContact = contacts.reduce((best, current) => {
        const bestScore = (best.emails?.length || 0) + (best.phones?.length || 0) + 
                         (best.addresses?.length || 0) + (best.company ? 1 : 0);
        const currentScore = (current.emails?.length || 0) + (current.phones?.length || 0) + 
                           (current.addresses?.length || 0) + (current.company ? 1 : 0);
        return currentScore > bestScore ? current : best;
      });
      
      setSelectedPrimary(primaryContact.id);
      
      // Initialiser les choix de champs avec les valeurs du contact principal
      const initialChoices: Record<string, any> = {
        first_name: primaryContact.first_name || '',
        last_name: primaryContact.last_name || '',
        display_name: primaryContact.display_name,
        company: primaryContact.company || '',
        job_title: primaryContact.job_title || '',
        notes: primaryContact.notes || '',
        birthday: primaryContact.birthday,
        anniversary: primaryContact.anniversary,
      };
      setFieldChoices(initialChoices);
      
      // Initialiser les choix d'emails (tous sélectionnés par défaut)
      const emailMap: Record<string, boolean> = {};
      contacts.forEach(contact => {
        contact.emails?.forEach(email => {
          emailMap[`${contact.id}-${email.id}`] = true;
        });
      });
      setEmailChoices(emailMap);
      
      // Initialiser les choix de téléphones
      const phoneMap: Record<string, boolean> = {};
      contacts.forEach(contact => {
        contact.phones?.forEach(phone => {
          phoneMap[`${contact.id}-${phone.id}`] = true;
        });
      });
      setPhoneChoices(phoneMap);
      
      // Initialiser les choix d'adresses
      const addressMap: Record<string, boolean> = {};
      contacts.forEach(contact => {
        contact.addresses?.forEach(address => {
          addressMap[`${contact.id}-${address.id}`] = true;
        });
      });
      setAddressChoices(addressMap);
    }
  }, [contacts, selectedPrimary]);
  
  const handleMerge = async () => {
    if (!selectedPrimary) return;
    
    // Construire la requête de fusion
    const mergeRequest: ContactMergeRequest = {
      primary_id: selectedPrimary,
      contact_ids: contactIds.filter(id => id !== selectedPrimary),
      field_choices: fieldChoices,
      keep_emails: Object.entries(emailChoices)
        .filter(([_, keep]) => keep)
        .map(([key]) => {
          const [contactId, emailId] = key.split('-').map(Number);
          return emailId;
        }),
      keep_phones: Object.entries(phoneChoices)
        .filter(([_, keep]) => keep)
        .map(([key]) => {
          const [contactId, phoneId] = key.split('-').map(Number);
          return phoneId;
        }),
      keep_addresses: Object.entries(addressChoices)
        .filter(([_, keep]) => keep)
        .map(([key]) => {
          const [contactId, addressId] = key.split('-').map(Number);
          return addressId;
        }),
    };
    
    try {
      await mergeMutation.mutateAsync(mergeRequest);
      onSuccess();
    } catch (error) {
      console.error('Error merging contacts:', error);
    }
  };
  
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  
  const getFieldValue = (contact: Contact, field: string) => {
    return (contact as any)[field];
  };
  
  const getUniqueFieldValues = (field: string) => {
    const values = new Set<string>();
    contacts.forEach(contact => {
      const value = getFieldValue(contact, field);
      if (value) values.add(value);
    });
    return Array.from(values);
  };
  
  if (!allLoaded) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Fusionner les contacts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (contacts.length < 2) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erreur</DialogTitle>
            <DialogDescription>
              Impossible de charger les contacts sélectionnés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fusionner {contacts.length} contacts</DialogTitle>
          <DialogDescription>
            Sélectionnez le contact principal et choisissez les informations à conserver.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Sélection du contact principal */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Contact principal après fusion
            </Label>
            <RadioGroup 
              value={selectedPrimary?.toString() || ''} 
              onValueChange={(value) => setSelectedPrimary(Number(value))}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {contacts.map(contact => (
                  <div 
                    key={contact.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPrimary === contact.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedPrimary(contact.id)}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={contact.id.toString()} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-8 w-8">
                            {contact.avatar_url && (
                              <AvatarImage src={contact.avatar_url} />
                            )}
                            <AvatarFallback>
                              {getInitials(contact.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{contact.display_name}</div>
                            {contact.source && (
                              <Badge variant="secondary" className="text-xs">
                                {contact.source}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {contact.company && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {contact.company}
                          </div>
                        )}
                        
                        {contact.primary_email && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {contact.primary_email}
                          </div>
                        )}
                        
                        {contact.primary_phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {contact.primary_phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
          
          {/* Choix des champs à conserver */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Informations à conserver</Label>
            
            {/* Champs texte avec valeurs différentes */}
            {['first_name', 'last_name', 'display_name', 'company', 'job_title'].map(field => {
              const uniqueValues = getUniqueFieldValues(field);
              if (uniqueValues.length <= 1) return null;
              
              const fieldLabels: Record<string, string> = {
                first_name: 'Prénom',
                last_name: 'Nom',
                display_name: "Nom d'affichage",
                company: 'Entreprise',
                job_title: 'Poste',
              };
              
              return (
                <div key={field}>
                  <Label className="text-sm">{fieldLabels[field]}</Label>
                  <Select
                    value={fieldChoices[field] || ''}
                    onValueChange={(value) => setFieldChoices({
                      ...fieldChoices,
                      [field]: value,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueValues.map(value => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
            
            {/* Emails */}
            {contacts.some(c => c.emails && c.emails.length > 0) && (
              <div>
                <Label className="text-sm mb-2 block">Emails</Label>
                <div className="space-y-2">
                  {contacts.map(contact => 
                    contact.emails?.map(email => (
                      <div 
                        key={`${contact.id}-${email.id}`}
                        className="flex items-center gap-2 p-2 border rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={emailChoices[`${contact.id}-${email.id}`] || false}
                          onChange={(e) => setEmailChoices({
                            ...emailChoices,
                            [`${contact.id}-${email.id}`]: e.target.checked,
                          })}
                          className="rounded border-gray-300"
                        />
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1">{email.email}</span>
                        <Badge variant="outline" className="text-xs">
                          {email.label}
                        </Badge>
                        {email.is_primary && (
                          <Badge variant="default" className="text-xs">
                            Principal
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {/* Téléphones */}
            {contacts.some(c => c.phones && c.phones.length > 0) && (
              <div>
                <Label className="text-sm mb-2 block">Téléphones</Label>
                <div className="space-y-2">
                  {contacts.map(contact => 
                    contact.phones?.map(phone => (
                      <div 
                        key={`${contact.id}-${phone.id}`}
                        className="flex items-center gap-2 p-2 border rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={phoneChoices[`${contact.id}-${phone.id}`] || false}
                          onChange={(e) => setPhoneChoices({
                            ...phoneChoices,
                            [`${contact.id}-${phone.id}`]: e.target.checked,
                          })}
                          className="rounded border-gray-300"
                        />
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1">{phone.phone}</span>
                        <Badge variant="outline" className="text-xs">
                          {phone.label}
                        </Badge>
                        {phone.is_primary && (
                          <Badge variant="default" className="text-xs">
                            Principal
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {/* Adresses */}
            {contacts.some(c => c.addresses && c.addresses.length > 0) && (
              <div>
                <Label className="text-sm mb-2 block">Adresses</Label>
                <div className="space-y-2">
                  {contacts.map(contact => 
                    contact.addresses?.map(address => (
                      <div 
                        key={`${contact.id}-${address.id}`}
                        className="flex items-center gap-2 p-2 border rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={addressChoices[`${contact.id}-${address.id}`] || false}
                          onChange={(e) => setAddressChoices({
                            ...addressChoices,
                            [`${contact.id}-${address.id}`]: e.target.checked,
                          })}
                          className="rounded border-gray-300"
                        />
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="text-sm">
                            {[address.street, address.city, address.postal_code, address.country]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {address.label}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleMerge}
            disabled={!selectedPrimary || mergeMutation.isPending}
          >
            {mergeMutation.isPending ? 'Fusion en cours...' : `Fusionner ${contacts.length} contacts`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};