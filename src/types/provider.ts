export type ProviderType = 'GMAIL' | 'GOOGLE_CALENDAR' | 'GOOGLE_DRIVE_SMS' | 'GOOGLE_DRIVE' | 'GOOGLE_CONTACTS' | 'OUTLOOK_MAIL' | 'OUTLOOK_CALENDAR' | 'OUTLOOK_CONTACTS' | 'ICLOUD_MAIL' | 'ICLOUD_CALENDAR' | 'ICLOUD_CONTACTS';

export interface Provider {
  id: number;
  user: number;
  meta_provider: number;
  name: string;
  provider_type: ProviderType;
  provider_type_display: string;
  is_active: boolean;
  read_only: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
  display_name: string;
}

export interface ProviderCreate {
  meta_provider: number;
  name: string;
  provider_type: ProviderType;
  is_active: boolean;
  read_only?: boolean;
  config: Record<string, any>;
}

export interface ProviderUpdate {
  name?: string;
  is_active?: boolean;
  config?: Record<string, any>;
}

export interface ProviderTypeInfo {
  value: ProviderType;
  label: string;
  description: string;
}

// ProviderStats supprimé

export interface TestConnectionResult {
  success: boolean;
  message: string;
  provider_type?: ProviderType;
  provider_name?: string;
  error?: string;
}

