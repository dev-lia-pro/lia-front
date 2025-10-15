/**
 * Push Notifications Hook
 *
 * Gère les notifications push sur toutes les plateformes :
 * - iOS: Via APNs (Apple Push Notification service) + Firebase Cloud Messaging
 * - Android: Via Firebase Cloud Messaging (FCM)
 * - Web: Via Firebase Cloud Messaging + Service Workers
 *
 * Configuration requise pour iOS:
 * 1. GoogleService-Info.plist dans ios/App/App/
 * 2. Push Notifications capability activée dans Xcode
 * 3. Certificat APNs (.p8) uploadé dans Firebase Console
 * 4. App.entitlements avec aps-environment
 * 5. Tests sur device réel (simulateur ne supporte pas les notifications)
 *
 * Voir docs/IOS_FIREBASE_SETUP.md pour la configuration complète
 */

import { useEffect, useState } from 'react';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import apiClient from '@/api/axios';
import { toast } from 'sonner';
import { messaging, getToken, onMessage } from '@/config/firebase';

export const usePushNotifications = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  // Initialize Web Push Notifications (PWA/Browser)
  const initializeWebPushNotifications = async () => {
    console.log('Initializing Web Push Notifications...');

    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers are not supported');
      return;
    }

    if (!messaging) {
      console.error('Firebase messaging is not initialized');
      return;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);

      if (permission === 'granted') {
        setPermissionStatus('granted');

        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);

        // Get FCM token
        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration
        });

        if (currentToken) {
          console.log('FCM Token:', currentToken);
          setPushToken(currentToken);
          await registerTokenWithBackend(currentToken, 'web');

          // Listen for foreground messages
          onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);

            const message = payload.notification?.body
              ? `${payload.notification.title}\n${payload.notification.body}`
              : payload.notification?.title || 'Nouvelle notification';

            toast.info(message, {
              duration: 5000,
            });
          });
        } else {
          console.log('No registration token available');
        }
      } else if (permission === 'denied') {
        setPermissionStatus('denied');
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing web push notifications:', error);
    }
  };

  // Initialize Native Push Notifications (iOS/Android)
  const initializeNativePushNotifications = async () => {
    const platform = Capacitor.getPlatform();
    console.log(`Initializing Native Push Notifications for ${platform}...`);

    try {
      // Check if push notifications are available on this device
      const checkResult = await PushNotifications.checkPermissions();
      console.log('Current permission status:', checkResult);

      // Request permission to use push notifications
      const permResult = await PushNotifications.requestPermissions();
      console.log('Permission request result:', permResult);

      if (permResult.receive === 'granted') {
        setPermissionStatus('granted');
        console.log(`✅ Push notifications permission granted on ${platform}`);

        // Register with Apple (APNs) / Google (FCM) to receive push
        await PushNotifications.register();
        console.log(`📱 Registered for push notifications on ${platform}`);
      } else {
        setPermissionStatus('denied');
        console.warn(`❌ Push notification permission denied on ${platform}`);
      }
    } catch (error) {
      console.error(`Error initializing native push notifications on ${platform}:`, error);
      setPermissionStatus('denied');
    }
  };

  // Main initialization function - calls web or native based on platform
  const initializePushNotifications = async () => {
    if (Capacitor.isNativePlatform()) {
      await initializeNativePushNotifications();
    } else {
      await initializeWebPushNotifications();
    }
  };

  // Register token with backend
  const registerTokenWithBackend = async (token: string, platform: string) => {
    try {
      await apiClient.post('/push-tokens/', {
        token,
        platform,
        device_type: Capacitor.getPlatform(),
      });
      setIsRegistered(true);
      console.log('Token registered with backend:', token);
    } catch (error: any) {
      // If error is 400 with "already exists", it's OK - token is already registered
      if (error?.response?.status === 400 && error?.response?.data?.includes('already exists')) {
        setIsRegistered(true);
        console.log('Token already registered with backend:', token);
      } else {
        console.error('Error registering token with backend:', error);
        setIsRegistered(false);
      }
    }
  };

  // Unregister token from backend
  const unregisterToken = async () => {
    if (!pushToken) return;

    try {
      await apiClient.delete(`/push-tokens/${pushToken}/`);
      setIsRegistered(false);
      setPushToken(null);
      console.log('Token unregistered from backend');
    } catch (error) {
      console.error('Error unregistering token:', error);
    }
  };

  useEffect(() => {
    // Initialize push notifications for all platforms
    initializePushNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {

    // Native platform listeners (iOS/Android only)
    if (Capacitor.isNativePlatform()) {
      // On registration success, send token to backend
      const registrationListener = PushNotifications.addListener(
        'registration',
        async (token: Token) => {
          const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
          console.log(`✅ Push registration success on ${platform}`);
          console.log('FCM/APNs Token:', token.value);

          setPushToken(token.value);
          await registerTokenWithBackend(token.value, platform);
        }
      );

      // On registration error
      const registrationErrorListener = PushNotifications.addListener(
        'registrationError',
        (error: any) => {
          const platform = Capacitor.getPlatform();
          console.error(`❌ Push notification registration error on ${platform}:`, error);

          // iOS-specific error handling
          if (platform === 'ios') {
            console.error('iOS Setup checklist:');
            console.error('1. GoogleService-Info.plist added to Xcode project?');
            console.error('2. Push Notifications capability enabled in Xcode?');
            console.error('3. APNs certificate uploaded to Firebase Console?');
            console.error('4. Testing on a real device (not simulator)?');
            console.error('5. App.entitlements contains aps-environment?');
          }

          setIsRegistered(false);
          setPermissionStatus('denied');
        }
      );

      // Show us the notification payload if the app is open on our device
      const pushReceivedListener = PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('Push notification received:', notification);

          // Show a toast with the notification
          const message = notification.body
            ? `${notification.title}\n${notification.body}`
            : notification.title;
          toast.info(message, {
            duration: 5000,
          });
        }
      );

      // Method called when tapping on a notification
      const actionPerformedListener = PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification: ActionPerformed) => {
          console.log('Push notification action performed:', notification);

          // Handle notification tap - navigate to the appropriate page
          const data = notification.notification.data;
          if (data?.action_url) {
            window.location.href = data.action_url;
          } else if (data?.type) {
            // Navigate based on notification type
            switch (data.type) {
              case 'NEW_MESSAGE':
              case 'NEW_SMS':
              case 'URGENT_MESSAGE':
                window.location.href = '/messages';
                break;
              case 'DAILY_TASKS':
              case 'TASK_URGENT':
              case 'TASK_DEADLINE':
                window.location.href = '/tasks';
                break;
              case 'EVENT_REMINDER':
                window.location.href = '/calendar';
                break;
              default:
                window.location.href = '/';
            }
          }
        }
      );

      // Cleanup listeners on unmount
      return () => {
        registrationListener.remove();
        registrationErrorListener.remove();
        pushReceivedListener.remove();
        actionPerformedListener.remove();
      };
    }
  }, []);

  return {
    pushToken,
    isRegistered,
    permissionStatus,
    initializePushNotifications,
    unregisterToken,
  };
};
