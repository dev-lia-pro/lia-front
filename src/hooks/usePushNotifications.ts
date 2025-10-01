import { useEffect, useState } from 'react';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import apiClient from '@/api/axios';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  // Initialize push notifications
  const initializePushNotifications = async () => {
    // Only works on native platforms (iOS/Android)
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications are only available on native platforms');
      return;
    }

    try {
      // Request permission to use push notifications
      const permResult = await PushNotifications.requestPermissions();

      if (permResult.receive === 'granted') {
        setPermissionStatus('granted');
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();
      } else {
        setPermissionStatus('denied');
        console.log('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  // Register token with backend
  const registerTokenWithBackend = async (token: string, platform: string) => {
    try {
      await apiClient.post('/api/push-tokens/', {
        token,
        platform,
        device_type: Capacitor.getPlatform(),
      });
      setIsRegistered(true);
      console.log('Token registered with backend:', token);
    } catch (error) {
      console.error('Error registering token with backend:', error);
      setIsRegistered(false);
    }
  };

  // Unregister token from backend
  const unregisterToken = async () => {
    if (!pushToken) return;

    try {
      await apiClient.delete(`/api/push-tokens/${pushToken}/`);
      setIsRegistered(false);
      setPushToken(null);
      console.log('Token unregistered from backend');
    } catch (error) {
      console.error('Error unregistering token:', error);
    }
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // On registration success, send token to backend
    const registrationListener = PushNotifications.addListener(
      'registration',
      async (token: Token) => {
        console.log('Push registration success, token:', token.value);
        setPushToken(token.value);

        // Determine platform (ios or android)
        const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
        await registerTokenWithBackend(token.value, platform);
      }
    );

    // On registration error
    const registrationErrorListener = PushNotifications.addListener(
      'registrationError',
      (error: any) => {
        console.error('Error on registration:', error);
        setIsRegistered(false);
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

    // Initialize push notifications
    initializePushNotifications();

    // Cleanup listeners on unmount
    return () => {
      registrationListener.remove();
      registrationErrorListener.remove();
      pushReceivedListener.remove();
      actionPerformedListener.remove();
    };
  }, []);

  return {
    pushToken,
    isRegistered,
    permissionStatus,
    initializePushNotifications,
    unregisterToken,
  };
};
