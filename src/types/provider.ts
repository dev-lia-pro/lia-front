export type ProviderType = 'GMAIL' | 'GOOGLE_CALENDAR' | 'GOOGLE_DRIVE_SMS' | 'GOOGLE_DRIVE' | 'GOOGLE_CONTACTS';

export interface Provider {
  id: number;
  user: number;
  name: string;
  provider_type: ProviderType;
  provider_type_display: string;
  is_active: boolean;
  credentials_json: Record<string, any>;
  token_json: Record<string, any>;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
  display_name: string;
}

export interface ProviderCreate {
  name: string;
  provider_type: ProviderType;
  is_active: boolean;
  credentials_json: Record<string, any>;
  token_json: Record<string, any>;
  config: Record<string, any>;
}

export interface ProviderUpdate {
  name?: string;
  is_active?: boolean;
  credentials_json?: Record<string, any>;
  token_json?: Record<string, any>;
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

