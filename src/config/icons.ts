// Configuration centralisée des icônes pour le projet Lia
// Utilise Lucide Icons pour des icônes vectorielles HD

import {
  // Business & Work
  Briefcase, TrendingUp, BarChart, DollarSign, Target, LineChart, PieChart,
  Building, Users, UserCheck, Handshake, Award, Trophy, Medal, Crown,

  // Technology & Development
  Code, Cpu, Database, Server, Cloud, Wifi, Terminal, MonitorSmartphone,
  Laptop, Smartphone, Tablet, Bluetooth, Usb, HardDrive, Binary,

  // Creative & Design
  Palette, Camera, Image, Film, Music, Mic, Headphones, Radio, Video,
  Brush, Pen, Pencil, Scissors, Layers, Sparkles,

  // Communication & Social
  Mail, MessageCircle, Phone, Share, Bell, Send, MessageSquare, AtSign,
  Megaphone, Speaker, Volume2, Heart, ThumbsUp, Star, Eye,

  // Education & Learning
  Book, BookOpen, GraduationCap, Lightbulb, Brain, Library, FileText,
  BookMarked, Newspaper, FileStack, ScrollText, Glasses, Microscope,
  Calculator, School, Presentation, NotebookPen,

  // Health & Wellness
  Activity, Dumbbell, Bike, Footprints, Apple, Coffee, Pizza,
  Utensils, UtensilsCrossed, IceCreamCone, GlassWater, Grape,
  Soup, Egg, Candy, Cookie, CakeSlice,

  // Nature & Environment
  TreeDeciduous, Flower, Sprout, Leaf, Sun, Moon, CloudRain, Zap, Flame,
  Wind, Snowflake, Rainbow, Mountain, Waves, Sunrise, CloudSun, Umbrella,
  Bug, Bird, Fish, Rabbit, Dog, Cat, Squirrel, Turtle, Snail, Rat,

  // Travel & Places
  Plane, Map, Globe, Compass, MapPin, Navigation, Car, Train, Bus,
  Ship, Bike as Bicycle, Home, Building2, Store, Hotel, Anchor,

  // Entertainment & Gaming
  Gamepad2, Dices, PartyPopper, Gift, Cake, Music as MusicNote,
  Tv, Radio as RadioIcon, Package2, Ticket, Drama, Film as FilmIcon, Sparkle,
  Crown as CrownIcon, Wand, Palmtree, Guitar,

  // Sports & Activities
  Trophy as TrophyIcon, Medal as MedalIcon, Dumbbell as DumbbellIcon,
  Circle, Flag, Swords, Shield, Zap as ZapIcon, Timer, Target as TargetIcon,
  Flame as FireIcon, Footprints as FootprintsIcon, Activity as ActivityIcon,

  // Tools & Settings
  Wrench, Settings, Hammer, Cog, Sliders, ToggleLeft, Lock,
  Key, Archive, Folder, FolderOpen, FileSearch, Search, Filter,
  Bookmark, Pin, Paperclip, Link, Hash, Calendar, Clock, Watch,

  // Files & Documents
  File, FileType, FileImage, FileVideo, FileAudio, FilePlus, FileCheck,
  Files, FolderPlus, FolderArchive, Inbox, Package, Box, FileCode,
  FileBadge, FileDown, FolderSync,

  // Shopping & Commerce
  ShoppingCart, ShoppingBag, Tag, Gift as GiftIcon, CreditCard, Wallet,
  Store as StoreIcon, Percent, Receipt, Banknote, Coins, Barcode,
  BadgePercent, DollarSign as DollarIcon, Euro, Bitcoin, Gem,

  // Miscellaneous
  CheckCircle, XCircle, AlertCircle, Ampersand, Rocket,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface IconOption {
  name: string;
  icon: LucideIcon;
  value: string;
  category: string;
  keywords?: string[];
}

export type IconCategory =
  | 'all'
  | 'business'
  | 'technology'
  | 'creative'
  | 'communication'
  | 'education'
  | 'health'
  | 'nature'
  | 'travel'
  | 'entertainment'
  | 'sports'
  | 'tools'
  | 'files'
  | 'shopping'
  | 'misc';

export const ICON_CATEGORIES: { value: IconCategory; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Technologie' },
  { value: 'creative', label: 'Créatif' },
  { value: 'communication', label: 'Communication' },
  { value: 'education', label: 'Éducation' },
  { value: 'health', label: 'Santé' },
  { value: 'nature', label: 'Nature' },
  { value: 'travel', label: 'Voyage' },
  { value: 'entertainment', label: 'Divertissement' },
  { value: 'sports', label: 'Sports' },
  { value: 'tools', label: 'Outils' },
  { value: 'files', label: 'Fichiers' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'misc', label: 'Autres' },
];

// Pack d'icônes disponibles (120+ icônes HD vectorielles)
export const ICON_PACK: IconOption[] = [
  // Business & Work (15 icônes)
  { name: 'Briefcase', icon: Briefcase, value: 'briefcase', category: 'business', keywords: ['work', 'job', 'travail', 'boulot', 'entreprise', 'bureau', 'valise', 'mallette'] },
  { name: 'Trending Up', icon: TrendingUp, value: 'trending-up', category: 'business', keywords: ['growth', 'croissance', 'progress', 'progrès', 'hausse', 'montée', 'augmentation'] },
  { name: 'Bar Chart', icon: BarChart, value: 'bar-chart', category: 'business', keywords: ['stats', 'analytics', 'données', 'graphique', 'statistiques', 'analyse', 'barres'] },
  { name: 'Dollar Sign', icon: DollarSign, value: 'dollar-sign', category: 'business', keywords: ['money', 'finance', 'argent', 'monnaie', 'devise', 'dollar'] },
  { name: 'Target', icon: Target, value: 'target', category: 'business', keywords: ['goal', 'objectif', 'aim', 'but', 'cible', 'visée'] },
  { name: 'Line Chart', icon: LineChart, value: 'line-chart', category: 'business', keywords: ['graph', 'stats', 'graphique'] },
  { name: 'Pie Chart', icon: PieChart, value: 'pie-chart', category: 'business', keywords: ['stats', 'analytics', 'camembert'] },
  { name: 'Building', icon: Building, value: 'building', category: 'business', keywords: ['office', 'company', 'bureau'] },
  { name: 'Users', icon: Users, value: 'users', category: 'business', keywords: ['team', 'équipe', 'people'] },
  { name: 'User Check', icon: UserCheck, value: 'user-check', category: 'business', keywords: ['verified', 'approval', 'validation'] },
  { name: 'Handshake', icon: Handshake, value: 'handshake', category: 'business', keywords: ['deal', 'partnership', 'accord'] },
  { name: 'Award', icon: Award, value: 'award', category: 'business', keywords: ['achievement', 'success', 'réussite'] },
  { name: 'Trophy', icon: Trophy, value: 'trophy', category: 'business', keywords: ['win', 'victoire', 'champion'] },
  { name: 'Medal', icon: Medal, value: 'medal', category: 'business', keywords: ['achievement', 'success', 'médaille'] },
  { name: 'Crown', icon: Crown, value: 'crown', category: 'business', keywords: ['king', 'premium', 'couronne'] },

  // Technology & Development (15 icônes)
  { name: 'Code', icon: Code, value: 'code', category: 'technology', keywords: ['programming', 'dev', 'development', 'programmation', 'développement', 'codage', 'informatique'] },
  { name: 'CPU', icon: Cpu, value: 'cpu', category: 'technology', keywords: ['processor', 'computer', 'processeur', 'ordinateur', 'puce', 'composant'] },
  { name: 'Database', icon: Database, value: 'database', category: 'technology', keywords: ['data', 'storage', 'données', 'stockage', 'base', 'bdd'] },
  { name: 'Server', icon: Server, value: 'server', category: 'technology', keywords: ['backend', 'hosting', 'serveur', 'hébergement', 'infrastructure'] },
  { name: 'Cloud', icon: Cloud, value: 'cloud', category: 'technology', keywords: ['storage', 'online', 'nuage', 'stockage', 'ligne', 'sauvegarde'] },
  { name: 'Wifi', icon: Wifi, value: 'wifi', category: 'technology', keywords: ['network', 'internet', 'connexion'] },
  { name: 'Terminal', icon: Terminal, value: 'terminal', category: 'technology', keywords: ['console', 'command', 'ligne'] },
  { name: 'Monitor', icon: MonitorSmartphone, value: 'monitor', category: 'technology', keywords: ['screen', 'display', 'écran'] },
  { name: 'Laptop', icon: Laptop, value: 'laptop', category: 'technology', keywords: ['computer', 'pc', 'ordinateur'] },
  { name: 'Smartphone', icon: Smartphone, value: 'smartphone', category: 'technology', keywords: ['mobile', 'phone', 'téléphone'] },
  { name: 'Tablet', icon: Tablet, value: 'tablet', category: 'technology', keywords: ['ipad', 'mobile', 'tablette'] },
  { name: 'Bluetooth', icon: Bluetooth, value: 'bluetooth', category: 'technology', keywords: ['wireless', 'connection', 'sans-fil'] },
  { name: 'USB', icon: Usb, value: 'usb', category: 'technology', keywords: ['port', 'connection', 'cable'] },
  { name: 'Hard Drive', icon: HardDrive, value: 'hard-drive', category: 'technology', keywords: ['storage', 'disk', 'disque'] },
  { name: 'Binary', icon: Binary, value: 'binary', category: 'technology', keywords: ['code', 'digital', 'binaire'] },

  // Creative & Design (15 icônes)
  { name: 'Palette', icon: Palette, value: 'palette', category: 'creative', keywords: ['art', 'color', 'couleur'] },
  { name: 'Camera', icon: Camera, value: 'camera', category: 'creative', keywords: ['photo', 'picture', 'appareil'] },
  { name: 'Image', icon: Image, value: 'image', category: 'creative', keywords: ['picture', 'photo', 'photo'] },
  { name: 'Film', icon: Film, value: 'film', category: 'creative', keywords: ['video', 'movie', 'vidéo'] },
  { name: 'Music', icon: Music, value: 'music', category: 'creative', keywords: ['song', 'audio', 'musique'] },
  { name: 'Microphone', icon: Mic, value: 'microphone', category: 'creative', keywords: ['audio', 'voice', 'voix'] },
  { name: 'Headphones', icon: Headphones, value: 'headphones', category: 'creative', keywords: ['audio', 'listen', 'casque'] },
  { name: 'Radio', icon: Radio, value: 'radio', category: 'creative', keywords: ['audio', 'broadcast', 'diffusion'] },
  { name: 'Video', icon: Video, value: 'video', category: 'creative', keywords: ['camera', 'record', 'enregistrer'] },
  { name: 'Brush', icon: Brush, value: 'brush', category: 'creative', keywords: ['paint', 'art', 'pinceau'] },
  { name: 'Pen', icon: Pen, value: 'pen', category: 'creative', keywords: ['write', 'draw', 'stylo'] },
  { name: 'Pencil', icon: Pencil, value: 'pencil', category: 'creative', keywords: ['draw', 'write', 'crayon'] },
  { name: 'Scissors', icon: Scissors, value: 'scissors', category: 'creative', keywords: ['cut', 'edit', 'ciseaux'] },
  { name: 'Layers', icon: Layers, value: 'layers', category: 'creative', keywords: ['design', 'stack', 'calques'] },
  { name: 'Sparkles', icon: Sparkles, value: 'sparkles', category: 'creative', keywords: ['magic', 'effects', 'étincelles'] },

  // Communication & Social (15 icônes)
  { name: 'Mail', icon: Mail, value: 'mail', category: 'communication', keywords: ['email', 'message', 'courrier'] },
  { name: 'Message Circle', icon: MessageCircle, value: 'message-circle', category: 'communication', keywords: ['chat', 'conversation', 'discussion'] },
  { name: 'Phone', icon: Phone, value: 'phone', category: 'communication', keywords: ['call', 'contact', 'téléphone'] },
  { name: 'Share', icon: Share, value: 'share', category: 'communication', keywords: ['send', 'forward', 'partager'] },
  { name: 'Bell', icon: Bell, value: 'bell', category: 'communication', keywords: ['notification', 'alert', 'cloche'] },
  { name: 'Send', icon: Send, value: 'send', category: 'communication', keywords: ['message', 'email', 'envoyer'] },
  { name: 'Message Square', icon: MessageSquare, value: 'message-square', category: 'communication', keywords: ['chat', 'text', 'message'] },
  { name: 'At Sign', icon: AtSign, value: 'at-sign', category: 'communication', keywords: ['email', 'mention', 'arobase'] },
  { name: 'Megaphone', icon: Megaphone, value: 'megaphone', category: 'communication', keywords: ['announce', 'broadcast', 'haut-parleur'] },
  { name: 'Speaker', icon: Speaker, value: 'speaker', category: 'communication', keywords: ['audio', 'sound', 'son'] },
  { name: 'Volume', icon: Volume2, value: 'volume', category: 'communication', keywords: ['audio', 'sound', 'volume'] },
  { name: 'Heart', icon: Heart, value: 'heart', category: 'communication', keywords: ['like', 'love', 'coeur'] },
  { name: 'Thumbs Up', icon: ThumbsUp, value: 'thumbs-up', category: 'communication', keywords: ['like', 'approve', 'pouce'] },
  { name: 'Star', icon: Star, value: 'star', category: 'communication', keywords: ['favorite', 'rating', 'étoile'] },
  { name: 'Eye', icon: Eye, value: 'eye', category: 'communication', keywords: ['view', 'see', 'voir'] },

  // Education & Learning (13 icônes)
  { name: 'Book', icon: Book, value: 'book', category: 'education', keywords: ['read', 'learning', 'livre'] },
  { name: 'Book Open', icon: BookOpen, value: 'book-open', category: 'education', keywords: ['read', 'study', 'étude'] },
  { name: 'Graduation Cap', icon: GraduationCap, value: 'graduation-cap', category: 'education', keywords: ['school', 'university', 'diplôme'] },
  { name: 'Lightbulb', icon: Lightbulb, value: 'lightbulb', category: 'education', keywords: ['idea', 'innovation', 'ampoule'] },
  { name: 'Brain', icon: Brain, value: 'brain', category: 'education', keywords: ['think', 'intelligence', 'cerveau'] },
  { name: 'Library', icon: Library, value: 'library', category: 'education', keywords: ['books', 'knowledge', 'bibliothèque'] },
  { name: 'File Text', icon: FileText, value: 'file-text', category: 'education', keywords: ['document', 'notes', 'fichier'] },
  { name: 'Book Marked', icon: BookMarked, value: 'book-marked', category: 'education', keywords: ['favorite', 'saved', 'marque-page'] },
  { name: 'Newspaper', icon: Newspaper, value: 'newspaper', category: 'education', keywords: ['news', 'article', 'journal'] },
  { name: 'File Stack', icon: FileStack, value: 'file-stack', category: 'education', keywords: ['documents', 'papers', 'dossier'] },
  { name: 'Scroll', icon: ScrollText, value: 'scroll', category: 'education', keywords: ['document', 'ancient', 'parchemin'] },
  { name: 'Glasses', icon: Glasses, value: 'glasses', category: 'education', keywords: ['read', 'vision', 'lunettes'] },
  { name: 'Microscope', icon: Microscope, value: 'microscope', category: 'education', keywords: ['science', 'research', 'recherche'] },
  { name: 'Calculator', icon: Calculator, value: 'calculator', category: 'education', keywords: ['math', 'calculate', 'calculatrice'] },
  { name: 'School', icon: School, value: 'school', category: 'education', keywords: ['education', 'learning', 'école'] },
  { name: 'Presentation', icon: Presentation, value: 'presentation', category: 'education', keywords: ['slide', 'teach', 'présentation'] },
  { name: 'Notebook Pen', icon: NotebookPen, value: 'notebook-pen', category: 'education', keywords: ['write', 'notes', 'carnet'] },

  // Health & Food (17 icônes)
  { name: 'Activity', icon: Activity, value: 'activity', category: 'health', keywords: ['health', 'fitness', 'activité', 'santé', 'forme', 'exercice', 'sport'] },
  { name: 'Dumbbell', icon: Dumbbell, value: 'dumbbell', category: 'health', keywords: ['gym', 'fitness', 'sport', 'musculation', 'haltère', 'poids'] },
  { name: 'Bike', icon: Bike, value: 'bike', category: 'health', keywords: ['cycling', 'sport', 'vélo', 'cyclisme', 'bicyclette'] },
  { name: 'Footprints', icon: Footprints, value: 'footprints', category: 'health', keywords: ['walking', 'steps', 'marche', 'pas', 'randonnée', 'balade'] },
  { name: 'Apple', icon: Apple, value: 'apple', category: 'health', keywords: ['fruit', 'healthy', 'pomme', 'sain', 'nutrition', 'alimentation'] },
  { name: 'Coffee', icon: Coffee, value: 'coffee', category: 'health', keywords: ['drink', 'café', 'boisson', 'tasse', 'expresso'] },
  { name: 'Pizza', icon: Pizza, value: 'pizza', category: 'health', keywords: ['food', 'meal', 'nourriture', 'repas', 'manger', 'restaurant'] },
  { name: 'Utensils', icon: Utensils, value: 'utensils', category: 'health', keywords: ['food', 'restaurant', 'couverts'] },
  { name: 'Utensils Crossed', icon: UtensilsCrossed, value: 'utensils-crossed', category: 'health', keywords: ['food', 'meal', 'restaurant'] },
  { name: 'Ice Cream', icon: IceCreamCone, value: 'ice-cream', category: 'health', keywords: ['dessert', 'sweet', 'glace'] },
  { name: 'Glass Water', icon: GlassWater, value: 'glass-water', category: 'health', keywords: ['drink', 'water', 'boisson'] },
  { name: 'Grape', icon: Grape, value: 'grape', category: 'health', keywords: ['fruit', 'food', 'raisin'] },
  { name: 'Soup', icon: Soup, value: 'soup', category: 'health', keywords: ['food', 'meal', 'soupe'] },
  { name: 'Egg', icon: Egg, value: 'egg', category: 'health', keywords: ['food', 'protein', 'oeuf'] },
  { name: 'Candy', icon: Candy, value: 'candy', category: 'health', keywords: ['sweet', 'dessert', 'bonbon'] },
  { name: 'Cookie', icon: Cookie, value: 'cookie', category: 'health', keywords: ['snack', 'dessert', 'biscuit'] },
  { name: 'Cake Slice', icon: CakeSlice, value: 'cake-slice', category: 'health', keywords: ['dessert', 'sweet', 'part'] },

  // Nature & Environment (27 icônes)
  { name: 'Tree', icon: TreeDeciduous, value: 'tree', category: 'nature', keywords: ['nature', 'plant', 'arbre', 'plante', 'forêt', 'végétal'] },
  { name: 'Flower', icon: Flower, value: 'flower', category: 'nature', keywords: ['nature', 'plant', 'fleur', 'plante', 'jardin', 'végétal'] },
  { name: 'Sprout', icon: Sprout, value: 'sprout', category: 'nature', keywords: ['plant', 'grow', 'pousse', 'plante', 'croissance', 'germe'] },
  { name: 'Leaf', icon: Leaf, value: 'leaf', category: 'nature', keywords: ['nature', 'plant', 'feuille', 'plante', 'végétal', 'vert'] },
  { name: 'Sun', icon: Sun, value: 'sun', category: 'nature', keywords: ['weather', 'light', 'soleil', 'météo', 'lumière', 'beau', 'chaud'] },
  { name: 'Moon', icon: Moon, value: 'moon', category: 'nature', keywords: ['night', 'dark', 'lune', 'nuit', 'sombre', 'étoile'] },
  { name: 'Cloud Rain', icon: CloudRain, value: 'cloud-rain', category: 'nature', keywords: ['weather', 'rain', 'pluie'] },
  { name: 'Cloud Sun', icon: CloudSun, value: 'cloud-sun', category: 'nature', keywords: ['weather', 'partly', 'nuage'] },
  { name: 'Umbrella', icon: Umbrella, value: 'umbrella', category: 'nature', keywords: ['rain', 'weather', 'parapluie'] },
  { name: 'Zap', icon: Zap, value: 'zap', category: 'nature', keywords: ['lightning', 'thunder', 'éclair'] },
  { name: 'Flame', icon: Flame, value: 'flame', category: 'nature', keywords: ['fire', 'hot', 'feu'] },
  { name: 'Wind', icon: Wind, value: 'wind', category: 'nature', keywords: ['weather', 'air', 'vent'] },
  { name: 'Snowflake', icon: Snowflake, value: 'snowflake', category: 'nature', keywords: ['cold', 'winter', 'neige'] },
  { name: 'Rainbow', icon: Rainbow, value: 'rainbow', category: 'nature', keywords: ['weather', 'color', 'arc-en-ciel'] },
  { name: 'Mountain', icon: Mountain, value: 'mountain', category: 'nature', keywords: ['nature', 'outdoor', 'montagne'] },
  { name: 'Waves', icon: Waves, value: 'waves', category: 'nature', keywords: ['ocean', 'water', 'vagues'] },
  { name: 'Sunrise', icon: Sunrise, value: 'sunrise', category: 'nature', keywords: ['morning', 'dawn', 'lever'] },
  { name: 'Bug', icon: Bug, value: 'bug', category: 'nature', keywords: ['insect', 'animal', 'insecte', 'bête', 'fourmi', 'mouche'] },
  { name: 'Bird', icon: Bird, value: 'bird', category: 'nature', keywords: ['animal', 'fly', 'oiseau', 'volatile', 'aigle', 'pigeon'] },
  { name: 'Fish', icon: Fish, value: 'fish', category: 'nature', keywords: ['animal', 'ocean', 'poisson', 'mer', 'eau', 'aquatique'] },
  { name: 'Rabbit', icon: Rabbit, value: 'rabbit', category: 'nature', keywords: ['animal', 'pet', 'lapin', 'animal domestique', 'rongeur'] },
  { name: 'Dog', icon: Dog, value: 'dog', category: 'nature', keywords: ['animal', 'pet', 'chien', 'animal domestique', 'toutou', 'canin'] },
  { name: 'Cat', icon: Cat, value: 'cat', category: 'nature', keywords: ['animal', 'pet', 'chat', 'animal domestique', 'minou', 'félin'] },
  { name: 'Squirrel', icon: Squirrel, value: 'squirrel', category: 'nature', keywords: ['animal', 'nature', 'écureuil'] },
  { name: 'Turtle', icon: Turtle, value: 'turtle', category: 'nature', keywords: ['animal', 'slow', 'tortue'] },
  { name: 'Snail', icon: Snail, value: 'snail', category: 'nature', keywords: ['animal', 'slow', 'escargot'] },
  { name: 'Rat', icon: Rat, value: 'rat', category: 'nature', keywords: ['animal', 'rodent', 'rat'] },

  // Travel & Places (16 icônes)
  { name: 'Plane', icon: Plane, value: 'plane', category: 'travel', keywords: ['flight', 'airport', 'avion'] },
  { name: 'Map', icon: Map, value: 'map', category: 'travel', keywords: ['location', 'navigation', 'carte'] },
  { name: 'Globe', icon: Globe, value: 'globe', category: 'travel', keywords: ['world', 'international', 'monde'] },
  { name: 'Compass', icon: Compass, value: 'compass', category: 'travel', keywords: ['navigation', 'direction', 'boussole'] },
  { name: 'Map Pin', icon: MapPin, value: 'map-pin', category: 'travel', keywords: ['location', 'place', 'marqueur'] },
  { name: 'Navigation', icon: Navigation, value: 'navigation', category: 'travel', keywords: ['direction', 'gps', 'direction'] },
  { name: 'Car', icon: Car, value: 'car', category: 'travel', keywords: ['vehicle', 'drive', 'voiture'] },
  { name: 'Train', icon: Train, value: 'train', category: 'travel', keywords: ['transport', 'railway', 'train'] },
  { name: 'Bus', icon: Bus, value: 'bus', category: 'travel', keywords: ['transport', 'public', 'bus'] },
  { name: 'Ship', icon: Ship, value: 'ship', category: 'travel', keywords: ['boat', 'cruise', 'bateau'] },
  { name: 'Anchor', icon: Anchor, value: 'anchor', category: 'travel', keywords: ['ship', 'sea', 'ancre'] },
  { name: 'Bicycle', icon: Bicycle, value: 'bicycle', category: 'travel', keywords: ['bike', 'cycling', 'vélo'] },
  { name: 'Home', icon: Home, value: 'home', category: 'travel', keywords: ['house', 'residence', 'maison'] },
  { name: 'Building 2', icon: Building2, value: 'building-2', category: 'travel', keywords: ['office', 'company', 'immeuble'] },
  { name: 'Store', icon: Store, value: 'store', category: 'travel', keywords: ['shop', 'market', 'magasin'] },
  { name: 'Hotel', icon: Hotel, value: 'hotel', category: 'travel', keywords: ['accommodation', 'stay', 'hôtel'] },

  // Entertainment & Gaming (16 icônes)
  { name: 'Gamepad', icon: Gamepad2, value: 'gamepad', category: 'entertainment', keywords: ['game', 'play', 'jeu'] },
  { name: 'Dices', icon: Dices, value: 'dices', category: 'entertainment', keywords: ['game', 'random', 'dés'] },
  { name: 'Party Popper', icon: PartyPopper, value: 'party-popper', category: 'entertainment', keywords: ['celebration', 'party', 'fête'] },
  { name: 'Gift', icon: Gift, value: 'gift', category: 'entertainment', keywords: ['present', 'surprise', 'cadeau'] },
  { name: 'Cake', icon: Cake, value: 'cake', category: 'entertainment', keywords: ['birthday', 'dessert', 'gâteau'] },
  { name: 'Music Note', icon: MusicNote, value: 'music-note', category: 'entertainment', keywords: ['song', 'audio', 'musique'] },
  { name: 'TV', icon: Tv, value: 'tv', category: 'entertainment', keywords: ['television', 'watch', 'télévision'] },
  { name: 'Radio Icon', icon: RadioIcon, value: 'radio-icon', category: 'entertainment', keywords: ['music', 'broadcast', 'radio'] },
  { name: 'Package', icon: Package2, value: 'package-gift', category: 'entertainment', keywords: ['gift', 'box', 'paquet'] },
  { name: 'Ticket', icon: Ticket, value: 'ticket', category: 'entertainment', keywords: ['event', 'cinema', 'billet'] },
  { name: 'Drama', icon: Drama, value: 'drama', category: 'entertainment', keywords: ['theater', 'masks', 'théâtre'] },
  { name: 'Film Icon', icon: FilmIcon, value: 'film-icon', category: 'entertainment', keywords: ['movie', 'cinema', 'film'] },
  { name: 'Sparkle', icon: Sparkle, value: 'sparkle', category: 'entertainment', keywords: ['star', 'magic', 'étincelle'] },
  { name: 'Crown Icon', icon: CrownIcon, value: 'crown-icon', category: 'entertainment', keywords: ['king', 'premium', 'couronne'] },
  { name: 'Wand', icon: Wand, value: 'wand', category: 'entertainment', keywords: ['magic', 'wizard', 'baguette'] },
  { name: 'Palmtree', icon: Palmtree, value: 'palmtree', category: 'entertainment', keywords: ['vacation', 'tropical', 'palmier'] },
  { name: 'Guitar', icon: Guitar, value: 'guitar', category: 'entertainment', keywords: ['music', 'instrument', 'guitare'] },

  // Sports & Activities (13 icônes)
  { name: 'Trophy Icon', icon: TrophyIcon, value: 'trophy-icon', category: 'sports', keywords: ['win', 'champion', 'trophée'] },
  { name: 'Medal Icon', icon: MedalIcon, value: 'medal-icon', category: 'sports', keywords: ['award', 'achievement', 'médaille'] },
  { name: 'Dumbbell Icon', icon: DumbbellIcon, value: 'dumbbell-icon', category: 'sports', keywords: ['gym', 'fitness', 'haltère'] },
  { name: 'Circle', icon: Circle, value: 'circle', category: 'sports', keywords: ['ball', 'sport', 'ballon'] },
  { name: 'Flag', icon: Flag, value: 'flag', category: 'sports', keywords: ['finish', 'country', 'drapeau'] },
  { name: 'Swords', icon: Swords, value: 'swords', category: 'sports', keywords: ['fight', 'battle', 'épées'] },
  { name: 'Shield', icon: Shield, value: 'shield', category: 'sports', keywords: ['protect', 'defense', 'bouclier'] },
  { name: 'Zap', icon: ZapIcon, value: 'zap-icon', category: 'sports', keywords: ['energy', 'power', 'énergie'] },
  { name: 'Timer', icon: Timer, value: 'timer', category: 'sports', keywords: ['time', 'chrono', 'minuteur'] },
  { name: 'Target Icon', icon: TargetIcon, value: 'target-icon', category: 'sports', keywords: ['goal', 'aim', 'cible'] },
  { name: 'Fire', icon: FireIcon, value: 'fire-icon', category: 'sports', keywords: ['energy', 'burn', 'feu'] },
  { name: 'Footprints Icon', icon: FootprintsIcon, value: 'footprints-icon', category: 'sports', keywords: ['walking', 'steps', 'pas'] },
  { name: 'Activity Icon', icon: ActivityIcon, value: 'activity-icon', category: 'sports', keywords: ['health', 'training', 'activité'] },

  // Tools & Settings (22 icônes)
  { name: 'Wrench', icon: Wrench, value: 'wrench', category: 'tools', keywords: ['tool', 'fix', 'clé'] },
  { name: 'Settings', icon: Settings, value: 'settings', category: 'tools', keywords: ['config', 'gear', 'paramètres'] },
  { name: 'Hammer', icon: Hammer, value: 'hammer', category: 'tools', keywords: ['build', 'fix', 'marteau'] },
  { name: 'Cog', icon: Cog, value: 'cog', category: 'tools', keywords: ['settings', 'config', 'engrenage'] },
  { name: 'Sliders', icon: Sliders, value: 'sliders', category: 'tools', keywords: ['adjust', 'control', 'réglages'] },
  { name: 'Toggle', icon: ToggleLeft, value: 'toggle', category: 'tools', keywords: ['switch', 'on-off', 'interrupteur'] },
  { name: 'Lock', icon: Lock, value: 'lock', category: 'tools', keywords: ['security', 'private', 'cadenas'] },
  { name: 'Key', icon: Key, value: 'key', category: 'tools', keywords: ['unlock', 'access', 'clé'] },
  { name: 'Archive', icon: Archive, value: 'archive', category: 'tools', keywords: ['storage', 'box', 'archive'] },
  { name: 'Folder', icon: Folder, value: 'folder', category: 'tools', keywords: ['directory', 'files', 'dossier'] },
  { name: 'Folder Open', icon: FolderOpen, value: 'folder-open', category: 'tools', keywords: ['directory', 'files', 'ouvert'] },
  { name: 'File Search', icon: FileSearch, value: 'file-search', category: 'tools', keywords: ['find', 'search', 'recherche'] },
  { name: 'Search', icon: Search, value: 'search', category: 'tools', keywords: ['find', 'look', 'chercher'] },
  { name: 'Filter', icon: Filter, value: 'filter', category: 'tools', keywords: ['sort', 'refine', 'filtre'] },
  { name: 'Bookmark', icon: Bookmark, value: 'bookmark', category: 'tools', keywords: ['save', 'favorite', 'marque-page'] },
  { name: 'Pin', icon: Pin, value: 'pin', category: 'tools', keywords: ['attach', 'fix', 'épingle'] },
  { name: 'Paperclip', icon: Paperclip, value: 'paperclip', category: 'tools', keywords: ['attach', 'clip', 'trombone'] },
  { name: 'Link', icon: Link, value: 'link', category: 'tools', keywords: ['url', 'chain', 'lien'] },
  { name: 'Hash', icon: Hash, value: 'hash', category: 'tools', keywords: ['tag', 'hashtag', 'dièse'] },
  { name: 'Calendar', icon: Calendar, value: 'calendar', category: 'tools', keywords: ['date', 'schedule', 'calendrier'] },
  { name: 'Clock', icon: Clock, value: 'clock', category: 'tools', keywords: ['time', 'hour', 'horloge'] },
  { name: 'Watch', icon: Watch, value: 'watch', category: 'tools', keywords: ['time', 'clock', 'montre'] },

  // Files & Documents (13 icônes)
  { name: 'File', icon: File, value: 'file', category: 'files', keywords: ['document', 'paper', 'fichier'] },
  { name: 'File Type', icon: FileType, value: 'file-type', category: 'files', keywords: ['document', 'format', 'type'] },
  { name: 'File Image', icon: FileImage, value: 'file-image', category: 'files', keywords: ['picture', 'photo', 'image'] },
  { name: 'File Video', icon: FileVideo, value: 'file-video', category: 'files', keywords: ['movie', 'clip', 'vidéo'] },
  { name: 'File Audio', icon: FileAudio, value: 'file-audio', category: 'files', keywords: ['sound', 'music', 'audio'] },
  { name: 'File Plus', icon: FilePlus, value: 'file-plus', category: 'files', keywords: ['new', 'create', 'nouveau'] },
  { name: 'File Check', icon: FileCheck, value: 'file-check', category: 'files', keywords: ['verified', 'approved', 'validé'] },
  { name: 'Files', icon: Files, value: 'files', category: 'files', keywords: ['documents', 'multiple', 'fichiers'] },
  { name: 'Folder Plus', icon: FolderPlus, value: 'folder-plus', category: 'files', keywords: ['new', 'create', 'nouveau'] },
  { name: 'Folder Archive', icon: FolderArchive, value: 'folder-archive', category: 'files', keywords: ['zip', 'compress', 'archive'] },
  { name: 'Inbox', icon: Inbox, value: 'inbox', category: 'files', keywords: ['mail', 'receive', 'boîte'] },
  { name: 'Package', icon: Package, value: 'package', category: 'files', keywords: ['box', 'delivery', 'colis'] },
  { name: 'Box', icon: Box, value: 'box', category: 'files', keywords: ['container', 'storage', 'boîte'] },
  { name: 'File Code', icon: FileCode, value: 'file-code', category: 'files', keywords: ['programming', 'dev', 'code'] },
  { name: 'File Badge', icon: FileBadge, value: 'file-badge', category: 'files', keywords: ['certificate', 'badge', 'insigne'] },
  { name: 'File Down', icon: FileDown, value: 'file-down', category: 'files', keywords: ['download', 'save', 'télécharger'] },
  { name: 'Folder Sync', icon: FolderSync, value: 'folder-sync', category: 'files', keywords: ['sync', 'backup', 'synchroniser'] },

  // Shopping & Commerce (16 icônes)
  { name: 'Shopping Cart', icon: ShoppingCart, value: 'shopping-cart', category: 'shopping', keywords: ['buy', 'purchase', 'panier'] },
  { name: 'Shopping Bag', icon: ShoppingBag, value: 'shopping-bag', category: 'shopping', keywords: ['buy', 'purchase', 'sac'] },
  { name: 'Tag', icon: Tag, value: 'tag', category: 'shopping', keywords: ['label', 'price', 'étiquette'] },
  { name: 'Gift Icon', icon: GiftIcon, value: 'gift-icon', category: 'shopping', keywords: ['present', 'surprise', 'cadeau'] },
  { name: 'Credit Card', icon: CreditCard, value: 'credit-card', category: 'shopping', keywords: ['payment', 'buy', 'carte'] },
  { name: 'Wallet', icon: Wallet, value: 'wallet', category: 'shopping', keywords: ['money', 'payment', 'portefeuille'] },
  { name: 'Store Icon', icon: StoreIcon, value: 'store-icon', category: 'shopping', keywords: ['shop', 'market', 'magasin'] },
  { name: 'Percent', icon: Percent, value: 'percent', category: 'shopping', keywords: ['discount', 'sale', 'pourcentage'] },
  { name: 'Receipt', icon: Receipt, value: 'receipt', category: 'shopping', keywords: ['bill', 'invoice', 'ticket'] },
  { name: 'Banknote', icon: Banknote, value: 'banknote', category: 'shopping', keywords: ['money', 'cash', 'billet'] },
  { name: 'Coins', icon: Coins, value: 'coins', category: 'shopping', keywords: ['money', 'currency', 'pièces'] },
  { name: 'Barcode', icon: Barcode, value: 'barcode', category: 'shopping', keywords: ['scan', 'product', 'code-barres'] },
  { name: 'Badge Percent', icon: BadgePercent, value: 'badge-percent', category: 'shopping', keywords: ['discount', 'promo', 'réduction'] },
  { name: 'Dollar Icon', icon: DollarIcon, value: 'dollar-icon', category: 'shopping', keywords: ['money', 'usd', 'dollar'] },
  { name: 'Euro', icon: Euro, value: 'euro', category: 'shopping', keywords: ['money', 'currency', 'euro'] },
  { name: 'Bitcoin', icon: Bitcoin, value: 'bitcoin', category: 'shopping', keywords: ['crypto', 'btc', 'bitcoin'] },
  { name: 'Gem', icon: Gem, value: 'gem', category: 'shopping', keywords: ['diamond', 'precious', 'gemme'] },

  // Miscellaneous (5 icônes)
  { name: 'Check Circle', icon: CheckCircle, value: 'check-circle', category: 'misc', keywords: ['verified', 'success', 'validé'] },
  { name: 'X Circle', icon: XCircle, value: 'x-circle', category: 'misc', keywords: ['close', 'cancel', 'fermer'] },
  { name: 'Alert Circle', icon: AlertCircle, value: 'alert-circle', category: 'misc', keywords: ['warning', 'info', 'alerte'] },
  { name: 'Ampersand', icon: Ampersand, value: 'ampersand', category: 'misc', keywords: ['symbol', 'and', 'et'] },
  { name: 'Rocket', icon: Rocket, value: 'rocket', category: 'misc', keywords: ['space', 'launch', 'fusée'] },
];

// Mapping des valeurs d'icônes vers les composants (pour la compatibilité)
export const ICON_MAPPING: Record<string, LucideIcon> = ICON_PACK.reduce((acc, iconOption) => {
  acc[iconOption.value] = iconOption.icon;
  return acc;
}, {} as Record<string, LucideIcon>);

// Fonction utilitaire pour obtenir une icône par sa valeur
export const getIconByValue = (value: string): LucideIcon | null => {
  return ICON_MAPPING[value] || null;
};

// Fonction utilitaire pour vérifier si une valeur d'icône est valide
export const isValidIconValue = (value: string): boolean => {
  return ICON_PACK.some(icon => icon.value === value);
};
