import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { useCreateContact, useUpdateContact, useContact } from '@/hooks/useContacts';
import type { ContactList, ContactCreate, ContactUpdate, ContactEmail, ContactPhone, ContactAddress } from '@/types/contact';

interface ContactFormProps {
  contact?: ContactList;
  onClose: () => void;
  onSuccess: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  contact,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!contact;
  const { data: fullContact } = useContact(contact?.id);
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  
  // Form state
  const [formData, setFormData] = useState<ContactCreate>({
    first_name: '',
    last_name: '',
    display_name: '',
    company: '',
    job_title: '',
    notes: '',
    birthday: null,
    anniversary: null,
    emails: [],
    phones: [],
    addresses: [],
  });
  
  // Load existing contact data when editing
  useEffect(() => {
    if (fullContact) {
      setFormData({
        first_name: fullContact.first_name || '',
        last_name: fullContact.last_name || '',
        display_name: fullContact.display_name || '',
        company: fullContact.company || '',
        job_title: fullContact.job_title || '',
        notes: fullContact.notes || '',
        birthday: fullContact.birthday,
        anniversary: fullContact.anniversary,
        emails: fullContact.emails || [],
        phones: fullContact.phones || [],
        addresses: fullContact.addresses || [],
      });
    }
  }, [fullContact]);
  
  // Update display name when first/last name changes
  useEffect(() => {
    if (!isEditing && (formData.first_name || formData.last_name)) {
      const displayName = `${formData.first_name} ${formData.last_name}`.trim();
      if (displayName && displayName !== formData.display_name) {
        setFormData(prev => ({ ...prev, display_name: displayName }));
      }
    }
  }, [formData.first_name, formData.last_name, isEditing]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && contact) {
        await updateMutation.mutateAsync({
          id: contact.id,
          data: formData as ContactUpdate,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };
  
  const addEmail = () => {
    setFormData(prev => ({
      ...prev,
      emails: [
        ...prev.emails!,
        {
          email: '',
          label: 'OTHER',
          is_primary: prev.emails!.length === 0,
          is_active: true,
        },
      ],
    }));
  };
  
  const removeEmail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails!.filter((_, i) => i !== index),
    }));
  };
  
  const updateEmail = (index: number, field: keyof ContactEmail, value: any) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails!.map((email, i) => 
        i === index ? { ...email, [field]: value } : email
      ),
    }));
  };
  
  const addPhone = () => {
    setFormData(prev => ({
      ...prev,
      phones: [
        ...prev.phones!,
        {
          phone: '',
          label: 'MOBILE',
          is_primary: prev.phones!.length === 0,
          is_active: true,
        },
      ],
    }));
  };
  
  const removePhone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      phones: prev.phones!.filter((_, i) => i !== index),
    }));
  };
  
  const updatePhone = (index: number, field: keyof ContactPhone, value: any) => {
    setFormData(prev => ({
      ...prev,
      phones: prev.phones!.map((phone, i) => 
        i === index ? { ...phone, [field]: value } : phone
      ),
    }));
  };
  
  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses!,
        {
          street: '',
          city: '',
          state: '',
          postal_code: '',
          country: '',
          label: 'HOME',
          is_primary: prev.addresses!.length === 0,
        },
      ],
    }));
  };
  
  const removeAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses!.filter((_, i) => i !== index),
    }));
  };
  
  const updateAddress = (index: number, field: keyof ContactAddress, value: any) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses!.map((address, i) => 
        i === index ? { ...address, [field]: value } : address
      ),
    }));
  };
  
  const setPrimaryEmail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails!.map((email, i) => ({
        ...email,
        is_primary: i === index,
      })),
    }));
  };
  
  const setPrimaryPhone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      phones: prev.phones!.map((phone, i) => ({
        ...phone,
        is_primary: i === index,
      })),
    }));
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le contact' : 'Nouveau contact'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="display_name">Nom d'affichage *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Entreprise</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="job_title">Poste</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          {/* Emails */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Emails
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addEmail}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.emails?.map((email, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  value={email.email}
                  onChange={(e) => updateEmail(index, 'email', e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Select
                    value={email.label}
                    onValueChange={(value) => updateEmail(index, 'label', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOME">Personnel</SelectItem>
                      <SelectItem value="WORK">Professionnel</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant={email.is_primary ? "default" : "outline"}
                    onClick={() => setPrimaryEmail(index)}
                    title="Définir comme principal"
                  >
                    ⭐
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeEmail(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Téléphones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Téléphones
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addPhone}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.phones?.map((phone, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="tel"
                  value={phone.phone}
                  onChange={(e) => updatePhone(index, 'phone', e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Select
                    value={phone.label}
                    onValueChange={(value) => updatePhone(index, 'label', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MOBILE">Mobile</SelectItem>
                      <SelectItem value="HOME">Domicile</SelectItem>
                      <SelectItem value="WORK">Bureau</SelectItem>
                      <SelectItem value="FAX">Fax</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant={phone.is_primary ? "default" : "outline"}
                    onClick={() => setPrimaryPhone(index)}
                    title="Définir comme principal"
                  >
                    ⭐
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removePhone(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Adresses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Adresses
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addAddress}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.addresses?.map((address, index) => (
              <div key={index} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Select
                    value={address.label}
                    onValueChange={(value) => updateAddress(index, 'label', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOME">Domicile</SelectItem>
                      <SelectItem value="WORK">Bureau</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAddress(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  value={address.street}
                  onChange={(e) => updateAddress(index, 'street', e.target.value)}
                  placeholder="Rue"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={address.city}
                    onChange={(e) => updateAddress(index, 'city', e.target.value)}
                    placeholder="Ville"
                  />
                  <Input
                    value={address.postal_code}
                    onChange={(e) => updateAddress(index, 'postal_code', e.target.value)}
                    placeholder="Code postal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={address.state}
                    onChange={(e) => updateAddress(index, 'state', e.target.value)}
                    placeholder="Région/État"
                  />
                  <Input
                    value={address.country}
                    onChange={(e) => updateAddress(index, 'country', e.target.value)}
                    placeholder="Pays"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
          
          {/* Dates importantes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthday">Date de naissance</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday || ''}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value || null })}
              />
            </div>
            <div>
              <Label htmlFor="anniversary">Anniversaire</Label>
              <Input
                id="anniversary"
                type="date"
                value={formData.anniversary || ''}
                onChange={(e) => setFormData({ ...formData, anniversary: e.target.value || null })}
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};