# Documentation Lia Frontend

Documentation technique pour l'application mobile et web Lia.

## 📱 Configuration Mobile

### iOS

Les notifications push Firebase nécessitent une configuration spécifique sur iOS.

**Guides disponibles** :

- 🚀 [**Guide Rapide iOS**](./IOS_QUICK_START.md) - Configuration en 5 étapes (recommandé pour débuter)
- 📖 [**Guide Complet iOS**](./IOS_FIREBASE_SETUP.md) - Documentation détaillée avec troubleshooting

**Fichiers de configuration iOS** :
- `ios/App/App/GoogleService-Info.plist` - Configuration Firebase (à télécharger depuis Firebase Console)
- `ios/App/App/GoogleService-Info.plist.template` - Template de référence
- `ios/App/App/App.entitlements` - Entitlements iOS (Push Notifications)

### Android

Android est déjà configuré avec Firebase :
- `android/app/google-services.json` - ✅ Configuré
- Les notifications fonctionnent out-of-the-box

## 🏗️ Architecture

### Technologies

- **Framework** : React 18 + TypeScript
- **Build** : Vite
- **Mobile** : Capacitor 7
- **Styling** : Tailwind CSS + shadcn/ui
- **State** : Zustand
- **API** : React Query + Axios
- **Push Notifications** : Firebase Cloud Messaging

### Structure

```
lia-front/
├── src/
│   ├── api/              # API clients et hooks
│   ├── components/       # Composants React
│   ├── config/           # Configuration (Firebase, etc.)
│   ├── contexts/         # React Contexts
│   ├── hooks/            # Custom hooks (dont usePushNotifications)
│   ├── pages/            # Pages/Routes
│   └── stores/           # Zustand stores
├── ios/                  # Projet iOS natif (Xcode)
├── android/              # Projet Android natif
├── docs/                 # Documentation (vous êtes ici)
└── public/               # Assets statiques
```

## 🔔 Notifications Push

### Comment ça fonctionne

Le hook `usePushNotifications` gère automatiquement les notifications sur toutes les plateformes :

- **iOS** : APNs (Apple Push Notification service) → Firebase
- **Android** : Firebase Cloud Messaging (FCM)
- **Web** : Firebase Cloud Messaging + Service Workers

### Fichiers concernés

- `src/hooks/usePushNotifications.ts` - Hook principal
- `src/config/firebase.ts` - Configuration Firebase
- `public/firebase-messaging-sw.js` - Service Worker (web)

### Envoyer une notification

Depuis le backend Django :

```python
from lia.api.services.firebase_service import send_push_notification

send_push_notification(
    user=user,
    title="Titre",
    body="Message",
    data={"type": "NEW_MESSAGE", "action_url": "/messages"}
)
```

### Types de notifications supportés

- `NEW_MESSAGE` - Nouveau message → Redirige vers /messages
- `NEW_SMS` - Nouveau SMS → Redirige vers /messages
- `URGENT_MESSAGE` - Message urgent → Redirige vers /messages
- `DAILY_TASKS` - Tâches du jour → Redirige vers /tasks
- `TASK_URGENT` - Tâche urgente → Redirige vers /tasks
- `TASK_DEADLINE` - Deadline proche → Redirige vers /tasks
- `EVENT_REMINDER` - Rappel d'événement → Redirige vers /calendar

## 🧪 Tests

### Web

```bash
npm run dev
# Tester dans le navigateur à http://localhost:8080
```

### Mobile (iOS)

```bash
npm run build:mobile
npx cap sync ios
npx cap open ios
# Build depuis Xcode sur un device réel
```

### Mobile (Android)

```bash
npm run build:mobile
npx cap sync android
npx cap open android
# Build depuis Android Studio
```

## 🛠️ Scripts utiles

```bash
# Développement
npm run dev                    # Serveur de dev web
npm run build                  # Build production web
npm run build:mobile           # Build pour mobile

# Capacitor
npm run cap:sync               # Synchroniser tous les projets natifs
npm run cap:sync:ios           # Build + sync iOS uniquement
npm run cap:sync:android       # Build + sync Android uniquement
npm run cap:open:ios           # Ouvrir Xcode
npm run cap:open:android       # Ouvrir Android Studio
npm run cap:run:ios            # Build et run sur iOS
npm run cap:run:android        # Build et run sur Android
```

## 🔐 Variables d'environnement

Créer un fichier `.env` :

```bash
# API Backend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=lia-pro
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

## 📚 Documentation externe

- [React Documentation](https://react.dev/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

## 🐛 Debugging

### Logs mobiles

**iOS (Xcode)** :
1. Window → Devices and Simulators
2. Sélectionner votre device
3. Open Console

**Android (Android Studio)** :
1. View → Tool Windows → Logcat
2. Filtrer par package : `com.lia.app`

### Notifications

Vérifier les logs dans `usePushNotifications` :
- ✅ = Succès
- ❌ = Erreur avec checklist de diagnostic

## 📝 Notes importantes

### iOS

- ⚠️ Les notifications ne fonctionnent **PAS** sur simulateur
- ⚠️ Nécessite un device iOS réel pour tester
- ⚠️ GoogleService-Info.plist ne doit **JAMAIS** être commité (contient des clés API)
- ✅ Utiliser GoogleService-Info.plist.template pour référence

### Android

- ✅ Les notifications fonctionnent sur émulateur
- ✅ google-services.json est déjà configuré

### Web

- ✅ Service Worker requis (firebase-messaging-sw.js)
- ⚠️ HTTPS requis en production
- ⚠️ Les navigateurs peuvent bloquer les notifications (permissions utilisateur)

---

**Dernière mise à jour** : 2025-10-15
**Maintainers** : Équipe Lia
