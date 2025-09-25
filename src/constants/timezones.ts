export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

export const TIMEZONES: TimezoneOption[] = [
  // Europe
  { value: 'Europe/Paris', label: 'Paris', offset: 'UTC+1/+2' },
  { value: 'Europe/London', label: 'Londres', offset: 'UTC+0/+1' },
  { value: 'Europe/Berlin', label: 'Berlin', offset: 'UTC+1/+2' },
  { value: 'Europe/Madrid', label: 'Madrid', offset: 'UTC+1/+2' },
  { value: 'Europe/Rome', label: 'Rome', offset: 'UTC+1/+2' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam', offset: 'UTC+1/+2' },
  { value: 'Europe/Brussels', label: 'Bruxelles', offset: 'UTC+1/+2' },
  { value: 'Europe/Zurich', label: 'Zurich', offset: 'UTC+1/+2' },
  { value: 'Europe/Vienna', label: 'Vienne', offset: 'UTC+1/+2' },
  { value: 'Europe/Stockholm', label: 'Stockholm', offset: 'UTC+1/+2' },
  { value: 'Europe/Moscow', label: 'Moscou', offset: 'UTC+3' },
  { value: 'Europe/Athens', label: 'Athènes', offset: 'UTC+2/+3' },

  // Amérique du Nord
  { value: 'America/New_York', label: 'New York', offset: 'UTC-5/-4' },
  { value: 'America/Chicago', label: 'Chicago', offset: 'UTC-6/-5' },
  { value: 'America/Denver', label: 'Denver', offset: 'UTC-7/-6' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', offset: 'UTC-8/-7' },
  { value: 'America/Toronto', label: 'Toronto', offset: 'UTC-5/-4' },
  { value: 'America/Montreal', label: 'Montréal', offset: 'UTC-5/-4' },
  { value: 'America/Vancouver', label: 'Vancouver', offset: 'UTC-8/-7' },

  // Amérique du Sud
  { value: 'America/Sao_Paulo', label: 'São Paulo', offset: 'UTC-3' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', offset: 'UTC-3' },
  { value: 'America/Lima', label: 'Lima', offset: 'UTC-5' },
  { value: 'America/Bogota', label: 'Bogota', offset: 'UTC-5' },
  { value: 'America/Mexico_City', label: 'Mexico', offset: 'UTC-6/-5' },

  // Asie
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: 'UTC+9' },
  { value: 'Asia/Shanghai', label: 'Shanghai', offset: 'UTC+8' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', offset: 'UTC+8' },
  { value: 'Asia/Singapore', label: 'Singapour', offset: 'UTC+8' },
  { value: 'Asia/Seoul', label: 'Séoul', offset: 'UTC+9' },
  { value: 'Asia/Bangkok', label: 'Bangkok', offset: 'UTC+7' },
  { value: 'Asia/Dubai', label: 'Dubaï', offset: 'UTC+4' },
  { value: 'Asia/Mumbai', label: 'Mumbai', offset: 'UTC+5:30' },
  { value: 'Asia/Delhi', label: 'New Delhi', offset: 'UTC+5:30' },

  // Océanie
  { value: 'Australia/Sydney', label: 'Sydney', offset: 'UTC+10/+11' },
  { value: 'Australia/Melbourne', label: 'Melbourne', offset: 'UTC+10/+11' },
  { value: 'Australia/Brisbane', label: 'Brisbane', offset: 'UTC+10' },
  { value: 'Australia/Perth', label: 'Perth', offset: 'UTC+8' },
  { value: 'Pacific/Auckland', label: 'Auckland', offset: 'UTC+12/+13' },

  // Afrique
  { value: 'Africa/Cairo', label: 'Le Caire', offset: 'UTC+2' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg', offset: 'UTC+2' },
  { value: 'Africa/Lagos', label: 'Lagos', offset: 'UTC+1' },
  { value: 'Africa/Casablanca', label: 'Casablanca', offset: 'UTC+0/+1' },
  { value: 'Africa/Algiers', label: 'Alger', offset: 'UTC+1' },
  { value: 'Africa/Tunis', label: 'Tunis', offset: 'UTC+1' },

  // Autres
  { value: 'UTC', label: 'UTC', offset: 'UTC+0' },
  { value: 'Atlantic/Reykjavik', label: 'Reykjavík', offset: 'UTC+0' },
  { value: 'Indian/Reunion', label: 'La Réunion', offset: 'UTC+4' },
  { value: 'America/Martinique', label: 'Martinique', offset: 'UTC-4' },
  { value: 'America/Guadeloupe', label: 'Guadeloupe', offset: 'UTC-4' },
  { value: 'Pacific/Noumea', label: 'Nouméa', offset: 'UTC+11' },
  { value: 'Pacific/Tahiti', label: 'Tahiti', offset: 'UTC-10' },
];

// Grouper par région pour une meilleure UX
export const GROUPED_TIMEZONES = {
  'Europe': TIMEZONES.filter(tz => tz.value.startsWith('Europe/')),
  'Amérique du Nord': TIMEZONES.filter(tz =>
    tz.value.startsWith('America/') &&
    ['New_York', 'Chicago', 'Denver', 'Los_Angeles', 'Toronto', 'Montreal', 'Vancouver', 'Mexico_City'].some(city => tz.value.includes(city))
  ),
  'Amérique du Sud': TIMEZONES.filter(tz =>
    tz.value.startsWith('America/') &&
    ['Sao_Paulo', 'Buenos_Aires', 'Lima', 'Bogota'].some(city => tz.value.includes(city))
  ),
  'Asie': TIMEZONES.filter(tz => tz.value.startsWith('Asia/')),
  'Océanie': TIMEZONES.filter(tz => tz.value.startsWith('Australia/') || tz.value.startsWith('Pacific/Auckland')),
  'Afrique': TIMEZONES.filter(tz => tz.value.startsWith('Africa/')),
  'Autres': TIMEZONES.filter(tz =>
    tz.value === 'UTC' ||
    tz.value.startsWith('Atlantic/') ||
    tz.value.startsWith('Indian/') ||
    (tz.value.startsWith('America/') && ['Martinique', 'Guadeloupe'].some(place => tz.value.includes(place))) ||
    (tz.value.startsWith('Pacific/') && tz.value !== 'Pacific/Auckland')
  ),
};