# 🚀 Lia Mobile Setup - Quick Start

L'intégration Capacitor est maintenant terminée ! Voici les prochaines étapes pour démarrer.

## ✅ Ce qui a été fait

1. ✓ Installation de Capacitor et plugins essentiels
2. ✓ Configuration de `capacitor.config.ts`
3. ✓ Modification de `vite.config.ts` pour le build mobile
4. ✓ Création des fichiers d'environnement (`.env.mobile`, `.env.production`)
5. ✓ Initialisation des plateformes Android et iOS
6. ✓ Configuration d'Android (permissions, build.gradle)
7. ✓ Configuration d'iOS (Info.plist)
8. ✓ Création des pipelines CI/CD GitHub Actions
9. ✓ Documentation complète dans `docs/MOBILE.md`

## 🎯 Prochaines Étapes

### 1. Configurer les URLs du Backend

Éditez `.env.mobile` avec vos vraies URLs de production :

```bash
VITE_BASE_API_URL=https://votre-backend.com/
VITE_WS_URL=votre-backend.com
```

**Important :** Le backend doit être accessible publiquement (pas localhost).

### 2. Tester le Build Mobile

```bash
npm run build:mobile
```

Vérifiez que le build fonctionne sans erreurs.

### 3. Android - Premier Lancement

```bash
# Synchroniser avec Android
npm run cap:sync:android

# Ouvrir dans Android Studio
npm run cap:open:android
```

Dans Android Studio :
- Installer les SDK nécessaires si demandé
- Lancer l'app sur un émulateur ou appareil

### 4. iOS - Premier Lancement (macOS uniquement)

```bash
# Installer les dépendances CocoaPods
cd ios/App && pod install && cd ../..

# Synchroniser avec iOS
npm run cap:sync:ios

# Ouvrir dans Xcode
npm run cap:open:ios
```

Dans Xcode :
- Configurer le signing (Signing & Capabilities)
- Sélectionner votre Team Apple Developer
- Lancer l'app sur un simulateur ou appareil

### 5. Configurer le Backend pour Mobile

Votre backend Django doit accepter les requêtes des apps mobiles :

```python
# Dans settings.py
CORS_ALLOWED_ORIGINS = [
    "capacitor://localhost",
    "ionic://localhost",
    "http://localhost",
    "https://votre-domaine.com",
]

# Pour WebSocket
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.environ.get("REDIS_URL", "redis://localhost:6379")],
        },
    },
}
```

### 6. Préparer les Releases

#### Android

1. Générer un keystore :
```bash
cd android/app
keytool -genkey -v -keystore lia-release.keystore -alias lia -keyalg RSA -keysize 2048 -validity 10000
```

2. Configurer `android/gradle.properties` avec vos credentials

3. Décommenter la config signing dans `android/app/build.gradle`

#### iOS

1. S'inscrire à l'Apple Developer Program ($99/an)
2. Créer un App ID : `com.lia.app`
3. Configurer les provisioning profiles
4. Éditer `ios/App/ExportOptions.plist` avec votre Team ID

### 7. Configurer les Secrets GitHub

Pour activer les pipelines CI/CD, ajoutez ces secrets dans GitHub :
- `VITE_BASE_API_URL`
- `VITE_WS_URL`
- `ANDROID_KEYSTORE_BASE64` (Android)
- `ANDROID_STORE_PASSWORD` (Android)
- `IOS_CERTIFICATES_P12` (iOS)
- Et autres... (voir `docs/MOBILE.md`)

### 8. Premier Release

```bash
# Tag votre version
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions va automatiquement :
- Builder Android APK/AAB
- Builder iOS IPA (si secrets configurés)
- Uploader les artifacts

## 📚 Documentation Complète

Consultez `docs/MOBILE.md` pour :
- Guide détaillé de développement
- Troubleshooting
- Configuration avancée
- Déploiement vers les stores

## 🛠 Scripts npm Disponibles

```bash
npm run build:mobile         # Build pour mobile
npm run cap:sync:android     # Sync Android
npm run cap:sync:ios         # Sync iOS
npm run cap:open:android     # Ouvrir Android Studio
npm run cap:open:ios         # Ouvrir Xcode
npm run cap:run:android      # Run sur Android
npm run cap:run:ios          # Run sur iOS
```

## ⚠️ Points d'Attention

1. **Backend accessible** : Ne pas utiliser localhost
2. **CORS configuré** : Accepter les requêtes Capacitor
3. **HTTPS recommandé** : Pour la production
4. **WebSocket** : Doit être accessible depuis mobile
5. **OAuth Google** : Nécessitera configuration deep links additionnelle

## 📞 Support

En cas de problème :
1. Consultez `docs/MOBILE.md`
2. Vérifiez les logs :
   - Android : `adb logcat | grep Capacitor`
   - iOS : Console Xcode ou Safari DevTools
3. Documentation Capacitor : https://capacitorjs.com/docs

Bon développement ! 🎉
