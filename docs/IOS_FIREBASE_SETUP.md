# Configuration Firebase Push Notifications pour iOS

Ce guide détaille les étapes pour configurer les notifications push Firebase sur iOS pour l'application Lia.

## Prérequis

- [ ] Compte Apple Developer actif (99$/an)
- [ ] Accès administrateur à la Console Firebase (projet `lia-pro`)
- [ ] Xcode installé (version 15+)
- [ ] Un device iOS physique (les notifications ne fonctionnent PAS sur simulateur)

---

## Phase 1 : Configuration Firebase Console et Apple Developer

### Étape 1.1 : Ajouter l'application iOS au projet Firebase

1. Aller sur [Firebase Console - Projet lia-pro](https://console.firebase.google.com/project/lia-pro)
2. Cliquer sur l'icône iOS ou "Ajouter une application"
3. Remplir les informations :
   - **Bundle ID iOS** : `com.lia.app` (IMPORTANT : Doit correspondre exactement)
   - **Nom de l'app** : Lia
   - **App Store ID** : (Laisser vide pour le moment)
4. Cliquer sur "Enregistrer l'application"
5. **Télécharger le fichier `GoogleService-Info.plist`**
6. Passer à l'étape suivante (ne pas fermer la fenêtre)

### Étape 1.2 : Ajouter GoogleService-Info.plist au projet Xcode

1. Copier le fichier téléchargé dans : `lia-front/ios/App/App/GoogleService-Info.plist`

2. Ouvrir le projet dans Xcode :
   ```bash
   cd lia-front
   npx cap open ios
   ```

3. Dans Xcode, clic droit sur le dossier `App` → `Add Files to "App"...`

4. Sélectionner `GoogleService-Info.plist`

5. **IMPORTANT** : Cocher "Copy items if needed" et sélectionner le target "App"

6. Vérifier que le fichier apparaît dans le navigateur de projet

### Étape 1.3 : Créer une clé APNs (Apple Push Notification service)

#### Option A : Clé APNs (.p8) - **RECOMMANDÉ**

✅ **Avantages** : Ne expire jamais, plus simple à gérer

1. Aller sur [Apple Developer - Keys](https://developer.apple.com/account/resources/authkeys/list)

2. Cliquer sur le bouton **+** pour créer une nouvelle clé

3. Remplir les informations :
   - **Key Name** : "Lia APNs Key" (ou autre nom descriptif)
   - Cocher **Apple Push Notifications service (APNs)**

4. Cliquer sur **Continue** puis **Register**

5. **IMPORTANT** : Télécharger le fichier `.p8` immédiatement
   - ⚠️ Vous ne pourrez plus le télécharger après avoir quitté cette page
   - Sauvegarder le fichier en lieu sûr

6. **Noter les informations suivantes** (vous en aurez besoin) :
   - **Key ID** : Affiché sur la page de téléchargement (ex: `AB12CD34EF`)
   - **Team ID** : Visible en haut à droite de la page (ex: `X1Y2Z3W4V5`)

#### Option B : Certificat APNs (.p12) - Alternative

⚠️ **Inconvénients** : Expire après 1 an, plus complexe

1. Aller sur [Apple Developer - Certificates](https://developer.apple.com/account/resources/certificates/list)
2. Créer un nouveau certificat
3. Choisir "Apple Push Notification service SSL (Sandbox & Production)"
4. Suivre les instructions pour générer un CSR
5. Télécharger et installer le certificat
6. Exporter en .p12 depuis Keychain Access

### Étape 1.4 : Uploader le certificat APNs dans Firebase

1. Retourner sur [Firebase Console - Project Settings - Cloud Messaging](https://console.firebase.google.com/project/lia-pro/settings/cloudmessaging)

2. Descendre jusqu'à **"Apple app configuration"**

3. Cliquer sur **"Upload"** dans la section APNs

4. Remplir selon votre choix :

   **Si vous avez choisi Option A (Clé .p8)** :
   - Uploader le fichier `.p8`
   - **Key ID** : Celui noté à l'étape 1.3 (ex: `AB12CD34EF`)
   - **Team ID** : Celui noté à l'étape 1.3 (ex: `X1Y2Z3W4V5`)

   **Si vous avez choisi Option B (Certificat .p12)** :
   - Uploader le fichier `.p12`
   - Entrer le mot de passe du certificat

5. Cliquer sur **"Upload"**

6. ✅ Vous devriez voir "APNs certificate uploaded" en vert

### Étape 1.5 : Activer Push Notifications dans Xcode

1. Dans Xcode, sélectionner le projet **App** dans le navigateur

2. Sélectionner le target **App**

3. Aller dans l'onglet **"Signing & Capabilities"**

4. Vérifier que **"Automatically manage signing"** est coché

5. Sélectionner votre **Team** (compte Apple Developer)

6. Cliquer sur le bouton **"+ Capability"** en haut à gauche

7. Rechercher et ajouter **"Push Notifications"**

8. Cliquer à nouveau sur **"+ Capability"**

9. Ajouter **"Background Modes"**

10. Dans Background Modes, cocher :
    - ✅ **Remote notifications**

11. Un fichier `App.entitlements` devrait être créé automatiquement

---

## Phase 2 : Vérification de la configuration

### ✅ Checklist de vérification

- [ ] `GoogleService-Info.plist` est présent dans `ios/App/App/`
- [ ] Le fichier apparaît dans Xcode (navigateur de projet)
- [ ] Clé/Certificat APNs uploadé dans Firebase Console
- [ ] Capability "Push Notifications" activée dans Xcode
- [ ] Capability "Background Modes > Remote notifications" activée
- [ ] Fichier `App.entitlements` créé avec `aps-environment`
- [ ] Signing configuré avec un Team valide
- [ ] Code mis à jour avec les modifications de la Phase 2 (voir README principal)

---

## Phase 3 : Build et Test

### 3.1 Synchroniser le projet

```bash
cd lia-front
npm run build:mobile
npx cap sync ios
```

### 3.2 Build et déployer sur un device réel

⚠️ **IMPORTANT** : Les notifications push ne fonctionnent PAS sur le simulateur iOS

1. Brancher un iPhone/iPad physique via USB

2. Dans Xcode :
   - Sélectionner votre device dans la liste (en haut)
   - Cliquer sur le bouton **Play** (▶️) pour compiler et déployer

3. Sur votre device :
   - Accepter l'installation de l'application
   - Aller dans **Réglages > Général > Gestion de l'appareil**
   - Faire confiance au certificat de développement

4. Lancer l'app et accepter les notifications quand demandé

### 3.3 Tester l'envoi de notifications

#### Option 1 : Via l'API Backend

Envoyer une notification via votre backend Django :

```python
from lia.api.services.firebase_service import send_push_notification

send_push_notification(
    user=user,
    title="Test iOS",
    body="Notification de test depuis le backend",
    data={"type": "TEST"}
)
```

#### Option 2 : Via Firebase Console

1. Aller sur [Firebase Console - Cloud Messaging](https://console.firebase.google.com/project/lia-pro/messaging)
2. Cliquer sur "Send your first message"
3. Remplir le titre et le message
4. Cliquer sur "Send test message"
5. Entrer le FCM token de votre device (visible dans les logs de l'app)

#### Option 3 : Via l'API REST Firebase

```bash
curl -X POST https://fcm.googleapis.com/v1/projects/lia-pro/messages:send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "DEVICE_FCM_TOKEN",
      "notification": {
        "title": "Test iOS",
        "body": "Notification de test"
      },
      "apns": {
        "payload": {
          "aps": {
            "sound": "default"
          }
        }
      }
    }
  }'
```

---

## Troubleshooting

### ❌ "No APNs certificate uploaded"

**Solution** : Retourner à l'étape 1.4 et uploader votre clé/certificat APNs

### ❌ "Missing Push Notification Entitlement"

**Solution** :
1. Vérifier que la capability "Push Notifications" est activée dans Xcode
2. Vérifier que `App.entitlements` contient `aps-environment`
3. Clean et rebuild le projet

### ❌ "Registration failed" dans les logs

**Solutions possibles** :
- Vérifier que vous testez sur un device réel (pas simulateur)
- Vérifier la connexion internet du device
- Vérifier que le Bundle ID correspond exactement : `com.lia.app`
- Vérifier que le certificat APNs est bien uploadé dans Firebase

### ❌ Notifications ne s'affichent pas

**Solutions** :
1. Vérifier que l'app est en arrière-plan (les notifications en foreground nécessitent un handler)
2. Vérifier que les notifications sont autorisées dans les réglages iOS
3. Consulter les logs Xcode pour voir les erreurs
4. Vérifier que le payload de la notification est correct

### ❌ "Invalid APNs certificate"

**Solution** :
- Vérifier que le Team ID et Key ID sont corrects
- Vérifier que la clé .p8 n'est pas corrompue
- Recréer une nouvelle clé APNs si nécessaire

---

## Ressources

- [Documentation Firebase - iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Documentation Firebase - Cloud Messaging iOS](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Apple - Setting Up a Remote Notification Server](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server)
- [Capacitor Firebase Plugin](https://github.com/capawesome-team/capacitor-firebase)

---

## Notes importantes

### Environnements de test

- **Development (Sandbox)** : Utilisé pendant le développement avec Xcode
- **Production** : Utilisé pour les builds de l'App Store

Firebase gère automatiquement ces deux environnements avec le même certificat si vous utilisez une clé .p8.

### Renouvellement des certificats

- **Clé .p8** : Ne expire jamais ✅
- **Certificat .p12** : Expire après 1 an, nécessite renouvellement ⚠️

### Limites APNs

- Taille maximale du payload : **4 KB**
- Throttling possible si trop de notifications envoyées rapidement
- Les silent notifications (content-available) sont limitées par iOS

---

**Date de création** : 2025-10-15
**Dernière mise à jour** : 2025-10-15
**Version** : 1.0
