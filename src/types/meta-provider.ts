import type { Provider, ProviderType } from './provider';

export type CategoryType = 'GOOGLE' | 'MICROSOFT' | 'APPLE';

export interface MetaProvider {
  id: number;
  user: number;
  name: string;
  category: CategoryType;
  category_display: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
  provider_count: number;
  active_provider_count: number;
  providers: Provider[];
}

export interface MetaProviderList {
  id: number;
  name: string;
  category: CategoryType;
  category_display: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
  provider_count: number;
  active_provider_count: number;
}

export interface StartCategoryOAuth {
  name: string;
  category: CategoryType;
  services: ProviderType[];
  read_only?: boolean;
  service_names?: Record<string, string>;
}

export interface UpdateCategoryPermissions {
  services: ProviderType[];
  read_only?: boolean;
  service_names?: Record<string, string>;
}

export interface AppleAuth {
  name: string;
  services: ProviderType[];
  apple_id: string;
  app_password: string;
  read_only?: boolean;
  service_names?: Record<string, string>;
}

export interface OAuthResponse {
  auth_url: string;
}

export interface MetaProviderUpdate {
  name?: string;
  is_active?: boolean;
}

// Helper pour obtenir le label d'une catégorie
export const getCategoryLabel = (category: CategoryType): string => {
  const labels: Record<CategoryType, string> = {
    GOOGLE: 'Google',
    MICROSOFT: 'Microsoft',
    APPLE: 'Apple',
  };
  return labels[category] || category;
};

// Helper pour obtenir l'icône d'une catégorie
export const getCategoryIcon = (category: CategoryType): string => {
  switch (category) {
    case 'GOOGLE':
      return '🔵';
    case 'MICROSOFT':
      return '🟠';
    case 'APPLE':
      return '🍎';
    default:
      return '🔗';
  }
};

// Helper pour obtenir les couleurs d'une catégorie
export const getCategoryColors = (category: CategoryType) => {
  // Couleurs neutres uniformes pour toutes les catégories
  return {
    bg: 'from-muted to-muted',
    border: 'border-border',
    text: 'text-foreground',
    hover: 'hover:bg-muted',
  };
};

// Services disponibles par catégorie
export const CATEGORY_SERVICES: Record<CategoryType, ProviderType[]> = {
  GOOGLE: [
    'GMAIL',
    'GOOGLE_CALENDAR',
    'GOOGLE_CONTACTS',
    'GOOGLE_DRIVE',
    'GOOGLE_DRIVE_SMS',
  ],
  MICROSOFT: [
    'OUTLOOK_MAIL',
    'OUTLOOK_CALENDAR',
    'OUTLOOK_CONTACTS',
  ],
  APPLE: [
    'ICLOUD_MAIL',
    'ICLOUD_CALENDAR',
    'ICLOUD_CONTACTS',
  ],
};
