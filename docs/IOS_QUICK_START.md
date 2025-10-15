# Guide Rapide - Configuration iOS pour Lia

Guide rapide pour configurer les notifications push Firebase sur iOS.

> 📖 Pour le guide complet et détaillé, voir [IOS_FIREBASE_SETUP.md](./IOS_FIREBASE_SETUP.md)

## 🎯 Objectif

Activer les notifications push Firebase sur l'application iOS Lia.

## ✅ Prérequis

- [ ] Compte Apple Developer (99$/an)
- [ ] Accès Firebase Console (projet `lia-pro`)
- [ ] Xcode 15+ installé
- [ ] Un iPhone/iPad réel pour tester

## 🚀 Configuration en 5 étapes

### 1️⃣ Ajouter l'app iOS dans Firebase

```bash
# Ouvrir Firebase Console
https://console.firebase.google.com/project/lia-pro
```

1. Cliquer sur "Ajouter une application" → iOS
2. Bundle ID : `com.lia.app`
3. Télécharger **GoogleService-Info.plist**
4. Placer le fichier dans `ios/App/App/GoogleService-Info.plist`

### 2️⃣ Créer une clé APNs

```bash
# Ouvrir Apple Developer
https://developer.apple.com/account/resources/authkeys/list
```

1. Créer une nouvelle clé
2. Cocher "Apple Push Notifications service (APNs)"
3. Télécharger le fichier `.p8`
4. **Noter** : Key ID et Team ID

### 3️⃣ Uploader APNs dans Firebase

```bash
# Ouvrir Firebase Cloud Messaging
https://console.firebase.google.com/project/lia-pro/settings/cloudmessaging
```

1. Section "Apple app configuration"
2. Upload la clé `.p8`
3. Entrer Key ID et Team ID

### 4️⃣ Configurer Xcode

```bash
cd lia-front
npx cap open ios
```

Dans Xcode :

1. **Ajouter GoogleService-Info.plist** :
   - Clic droit sur dossier "App" → Add Files
   - Sélectionner `GoogleService-Info.plist`
   - ✅ Cocher "Copy items if needed"

2. **Activer Push Notifications** :
   - Onglet "Signing & Capabilities"
   - Cliquer "+" → Ajouter "Push Notifications"
   - Cliquer "+" → Ajouter "Background Modes"
   - Cocher "Remote notifications"

3. **Configurer Signing** :
   - Team : Sélectionner votre compte Apple Developer
   - ✅ "Automatically manage signing"

### 5️⃣ Build et Test

```bash
# Synchroniser le projet
cd lia-front
npm run build:mobile
npx cap sync ios
npx cap open ios
```

Dans Xcode :
- Connecter un iPhone/iPad via USB
- Sélectionner le device
- Cliquer sur Play (▶️)

⚠️ **Les notifications ne fonctionnent PAS sur simulateur**

## 🔍 Vérification rapide

Checklist de vérification :

```bash
# Vérifier que ces fichiers existent
ls ios/App/App/GoogleService-Info.plist      # ✅ Doit exister
ls ios/App/App/App.entitlements               # ✅ Doit exister
```

Dans Xcode :
- [ ] GoogleService-Info.plist visible dans le navigateur
- [ ] Capability "Push Notifications" activée
- [ ] Background Mode "Remote notifications" coché
- [ ] Team sélectionné dans Signing
- [ ] Build réussit sans erreur

## 🧪 Test des notifications

### Via le backend Django

```python
from lia.api.services.firebase_service import send_push_notification

send_push_notification(
    user=user,
    title="Test iOS",
    body="Ça fonctionne ! 🎉"
)
```

### Via Firebase Console

1. Aller sur [Cloud Messaging](https://console.firebase.google.com/project/lia-pro/messaging)
2. "Send your first message"
3. Copier le token FCM depuis les logs de l'app
4. Envoyer un message de test

## ❌ Problèmes fréquents

### Registration failed

**Solutions** :
- Vérifier que vous testez sur un device réel
- Vérifier que GoogleService-Info.plist est bien dans Xcode
- Vérifier que le certificat APNs est uploadé dans Firebase
- Consulter les logs Xcode pour plus de détails

### Missing Push Notification Entitlement

**Solution** :
1. Dans Xcode, supprimer la capability "Push Notifications"
2. Re-ajouter la capability
3. Clean Build Folder (⌘⇧K)
4. Rebuild

### Invalid APNs certificate

**Solution** :
- Vérifier que Key ID et Team ID sont corrects dans Firebase
- Retélécharger la clé .p8 si nécessaire

## 📚 Ressources

- [Guide complet](./IOS_FIREBASE_SETUP.md) - Documentation détaillée
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Apple Push Notifications](https://developer.apple.com/documentation/usernotifications)

## 🆘 Besoin d'aide ?

1. Consulter le guide complet : `docs/IOS_FIREBASE_SETUP.md`
2. Vérifier les logs Xcode pour les erreurs détaillées
3. Section Troubleshooting du guide complet

---

**Dernière mise à jour** : 2025-10-15
