export interface ContactEmail {
  id?: number;
  email: string;
  label: 'HOME' | 'WORK' | 'OTHER';
  is_primary: boolean;
  is_active: boolean;
  added_at?: string;
}

export interface ContactPhone {
  id?: number;
  phone: string;
  phone_normalized?: string;
  label: 'HOME' | 'WORK' | 'MOBILE' | 'FAX' | 'OTHER';
  is_primary: boolean;
  is_active: boolean;
  added_at?: string;
}

export interface ContactAddress {
  id?: number;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  label: 'HOME' | 'WORK' | 'OTHER';
  is_primary: boolean;
}

export interface Contact {
  id?: number;
  first_name: string;
  last_name: string;
  display_name: string;
  company: string;
  job_title: string;
  is_self: boolean;
  is_person: boolean;
  external_id: string;
  source: 'LOCAL' | 'GOOGLE';
  google_updated_at?: string | null;
  notes: string;
  avatar_url: string;
  birthday?: string | null;
  anniversary?: string | null;
  custom_fields: Record<string, any>;
  emails: ContactEmail[];
  phones: ContactPhone[];
  addresses: ContactAddress[];
  primary_email?: string | null;
  primary_phone?: string | null;
  message_count?: number;
  event_count?: number;
  last_interaction?: string | null;
  created_at?: string;
  updated_at?: string;
  last_synced_at?: string | null;
}

export interface ContactList {
  id: number;
  display_name: string;
  company: string;
  primary_email: string | null;
  primary_phone: string | null;
  is_self: boolean;
  source: 'LOCAL' | 'GOOGLE';
  avatar_url: string;
  created_at: string;
}

export interface ContactCreate {
  first_name?: string;
  last_name?: string;
  display_name: string;
  company?: string;
  job_title?: string;
  is_self?: boolean;
  is_person?: boolean;
  notes?: string;
  avatar_url?: string;
  birthday?: string | null;
  anniversary?: string | null;
  custom_fields?: Record<string, any>;
  emails?: Omit<ContactEmail, 'id' | 'added_at'>[];
  phones?: Omit<ContactPhone, 'id' | 'phone_normalized' | 'added_at'>[];
  addresses?: Omit<ContactAddress, 'id'>[];
}

export interface ContactUpdate extends Partial<ContactCreate> {
  emails?: ContactEmail[];
  phones?: ContactPhone[];
  addresses?: ContactAddress[];
}

export interface ContactMergeRequest {
  primary_contact_id: number;
  contacts_to_merge: number[];
}

export interface ContactDuplicate {
  contact: ContactList;
  potential_duplicates: ContactList[];
  confidence_scores: Record<number, number>;
}

export interface ContactStatistics {
  total: number;
  with_email: number;
  with_phone: number;
  from_google: number;
  from_icloud: number;
  from_outlook: number;
  local: number;
  persons: number;
  entities: number;
  with_messages: number;
  with_events: number;
}