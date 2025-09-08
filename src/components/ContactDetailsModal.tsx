import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Calendar,
  Edit2,
  ExternalLink
} from 'lucide-react';
import { useContact } from '@/hooks/useContacts';
import { Skeleton } from '@/components/ui/skeleton';
import type { Contact } from '@/types/contact';
import { ContactForm } from './ContactForm';

interface ContactDetailsModalProps {
  contactId: number | null;
  onClose: () => void;
}

export const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({
  contactId,
  onClose,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const { data: contact, isLoading, refetch } = useContact(contactId);
  
  if (!contactId) return null;
  
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  
  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  if (isEditing && contact) {
    return (
      <ContactForm
        contact={contact}
        onClose={() => setIsEditing(false)}
        onSuccess={() => {
          setIsEditing(false);
          refetch();
        }}
      />
    );
  }
  
  return (
    <Dialog open={!!contactId} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Détails du contact</span>
            {contact && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : contact ? (
          <div className="space-y-6">
            {/* En-tête du contact */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                {contact.avatar_url && (
                  <AvatarImage src={contact.avatar_url} />
                )}
                <AvatarFallback>
                  {getInitials(contact.display_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{contact.display_name}</h3>
                {(contact.first_name || contact.last_name) && (
                  <p className="text-sm text-muted-foreground">
                    {contact.first_name} {contact.last_name}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {contact.is_self && (
                    <Badge variant="secondary">Moi</Badge>
                  )}
                  {contact.source && (
                    <Badge variant="outline">{contact.source}</Badge>
                  )}
                  {!contact.is_person && (
                    <Badge variant="outline">Entité</Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Entreprise et poste */}
            {(contact.company || contact.job_title) && (
              <div className="space-y-2">
                {contact.company && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>{contact.company}</span>
                  </div>
                )}
                {contact.job_title && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{contact.job_title}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Emails */}
            {contact.emails && contact.emails.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Emails
                </h4>
                <div className="space-y-2">
                  {contact.emails.map((email) => (
                    <div key={email.id} className="flex items-center justify-between">
                      <a 
                        href={`mailto:${email.email}`}
                        className="text-sm text-primary hover:underline flex items-center gap-2"
                      >
                        {email.email}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {email.label}
                        </Badge>
                        {email.is_primary && (
                          <Badge variant="default" className="text-xs">
                            Principal
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Téléphones */}
            {contact.phones && contact.phones.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Téléphones
                </h4>
                <div className="space-y-2">
                  {contact.phones.map((phone) => (
                    <div key={phone.id} className="flex items-center justify-between">
                      <a 
                        href={`tel:${phone.phone}`}
                        className="text-sm text-primary hover:underline flex items-center gap-2"
                      >
                        {phone.phone}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {phone.label}
                        </Badge>
                        {phone.is_primary && (
                          <Badge variant="default" className="text-xs">
                            Principal
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Adresses */}
            {contact.addresses && contact.addresses.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresses
                </h4>
                <div className="space-y-3">
                  {contact.addresses.map((address) => (
                    <div key={address.id} className="text-sm space-y-1">
                      <Badge variant="outline" className="text-xs mb-1">
                        {address.label}
                      </Badge>
                      {address.street && <div>{address.street}</div>}
                      <div>
                        {[address.city, address.postal_code].filter(Boolean).join(' ')}
                      </div>
                      {(address.state || address.country) && (
                        <div>
                          {[address.state, address.country].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Dates importantes */}
            {(contact.birthday || contact.anniversary) && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Dates importantes
                </h4>
                <div className="space-y-2 text-sm">
                  {contact.birthday && (
                    <div>
                      <span className="text-muted-foreground">Anniversaire:</span>{' '}
                      {formatDate(contact.birthday)}
                    </div>
                  )}
                  {contact.anniversary && (
                    <div>
                      <span className="text-muted-foreground">Date anniversaire:</span>{' '}
                      {formatDate(contact.anniversary)}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Notes */}
            {contact.notes && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {contact.notes}
                </p>
              </div>
            )}
            
            {/* Métadonnées */}
            <div className="pt-4 border-t text-xs text-muted-foreground">
              <div>Créé le {formatDate(contact.created_at)}</div>
              {contact.last_modified && (
                <div>Modifié le {formatDate(contact.last_modified)}</div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Contact introuvable</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};