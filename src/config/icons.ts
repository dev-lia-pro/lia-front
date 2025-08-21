// Configuration centralisée des icônes pour le projet Lia

export interface IconOption {
  name: string;
  icon: string;
  value: string;
}

// Pack d'icônes disponibles
export const ICON_PACK: IconOption[] = [
  { name: 'Briefcase', icon: '💼', value: 'briefcase' },
  { name: 'Lightbulb', icon: '💡', value: 'lightbulb' },
  { name: 'Rocket', icon: '🚀', value: 'rocket' },
  { name: 'Heart', icon: '❤️', value: 'heart' },
  { name: 'Star', icon: '⭐', value: 'star' },
  { name: 'Fire', icon: '🔥', value: 'fire' },
  { name: 'Zap', icon: '⚡', value: 'zap' },
  { name: 'Gem', icon: '💎', value: 'gem' },
  { name: 'Crown', icon: '👑', value: 'crown' },
  { name: 'Target', icon: '🎯', value: 'target' },
  { name: 'Globe', icon: '🌍', value: 'globe' },
  { name: 'Code', icon: '💻', value: 'code' },
  { name: 'Palette', icon: '🎨', value: 'palette' },
  { name: 'Music', icon: '🎵', value: 'music' },
  { name: 'Camera', icon: '📷', value: 'camera' },
  { name: 'Book', icon: '📚', value: 'book' },
];

// Mapping des valeurs d'icônes vers les emojis (pour la compatibilité)
export const ICON_MAPPING: Record<string, string> = ICON_PACK.reduce((acc, iconOption) => {
  acc[iconOption.value] = iconOption.icon;
  return acc;
}, {} as Record<string, string>);

// Fonction utilitaire pour obtenir une icône par sa valeur
export const getIconByValue = (value: string): string => {
  return ICON_MAPPING[value] || '📁'; // Icône par défaut
};

// Fonction utilitaire pour vérifier si une valeur d'icône est valide
export const isValidIconValue = (value: string): boolean => {
  return ICON_PACK.some(icon => icon.value === value);
};


