// Configuration OAuth Google
// Ces valeurs doivent être configurées selon votre environnement

export const OAUTH_CONFIG = {
  // Client IDs pour Google OAuth (publics, côté frontend)
  GMAIL_CLIENT_ID: '145363480837-5asdvubs09jvie95lj2f3kdoaq1cg1ba.apps.googleusercontent.com',
  CALENDAR_CLIENT_ID: '145363480837-5asdvubs09jvie95lj2f3kdoaq1cg1ba.apps.googleusercontent.com', 
  DRIVE_CLIENT_ID: '145363480837-5asdvubs09jvie95lj2f3kdoaq1cg1ba.apps.googleusercontent.com',
  
  // URL de redirection OAuth vers le BACKEND (pas le frontend)
  REDIRECT_URI: 'http://localhost:8000/api/oauth/callback',
  
  // Scopes OAuth
  SCOPES: {
    GMAIL: ['https://www.googleapis.com/auth/gmail.readonly'],
    GOOGLE_CALENDAR: ['https://www.googleapis.com/auth/calendar.readonly'],
    GOOGLE_DRIVE_SMS: ['https://www.googleapis.com/auth/drive.readonly'],
    GOOGLE_DRIVE: ['https://www.googleapis.com/auth/drive.file'],
  }
};

// Fonction pour obtenir le Client ID selon le type de provider
export const getOAuthClientId = (providerType: string): string => {
  switch (providerType) {
    case 'GMAIL':
      return OAUTH_CONFIG.GMAIL_CLIENT_ID;
    case 'GOOGLE_CALENDAR':
      return OAUTH_CONFIG.CALENDAR_CLIENT_ID;
    case 'GOOGLE_DRIVE_SMS':
      return OAUTH_CONFIG.DRIVE_CLIENT_ID;
    case 'GOOGLE_DRIVE':
      return OAUTH_CONFIG.DRIVE_CLIENT_ID;
    default:
      return '';
  }
};

// Fonction pour obtenir les scopes selon le type de provider
export const getOAuthScopes = (providerType: string): string[] => {
  switch (providerType) {
    case 'GMAIL':
      return OAUTH_CONFIG.SCOPES.GMAIL;
    case 'GOOGLE_CALENDAR':
      return OAUTH_CONFIG.SCOPES.GOOGLE_CALENDAR;
    case 'GOOGLE_DRIVE_SMS':
      return OAUTH_CONFIG.SCOPES.GOOGLE_DRIVE_SMS;
    case 'GOOGLE_DRIVE':
      return OAUTH_CONFIG.SCOPES.GOOGLE_DRIVE;
    default:
      return [];
  }
};

