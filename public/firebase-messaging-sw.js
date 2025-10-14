// Firebase Cloud Messaging Service Worker
// This file handles push notifications when the app is in the background or closed

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwhkKP2cJdupJOD10zT4r7BRE02GPMmcM",
  authDomain: "lia-pro.firebaseapp.com",
  projectId: "lia-pro",
  storageBucket: "lia-pro.firebasestorage.app",
  messagingSenderId: "1005775339351",
  appId: "1:1005775339351:web:e706e51a96b03379084812"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // Customize notification
  const notificationTitle = payload.notification?.title || 'Nouvelle notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/pwa-192x192.png',
    badge: '/favicon.ico',
    tag: payload.data?.type || 'default',
    data: payload.data || {},
    requireInteraction: payload.data?.priority === 'urgent' || payload.data?.priority === 'high',
    actions: []
  };

  // Add action buttons based on notification type
  if (payload.data?.action_url) {
    notificationOptions.actions.push({
      action: 'open',
      title: 'Voir'
    });
  }

  notificationOptions.actions.push({
    action: 'close',
    title: 'Fermer'
  });

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Handle notification click - open the app
  const urlToOpen = event.notification.data?.action_url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            // Only navigate if we have a specific URL and it's different
            const currentUrl = new URL(client.url);
            const targetUrl = new URL(urlToOpen, client.url);

            // Don't navigate if it's just "/" or the same path
            if (urlToOpen !== '/' && currentUrl.pathname !== targetUrl.pathname) {
              return client.focus().then(() => {
                return client.navigate(urlToOpen);
              });
            } else {
              // Same URL or homepage - just focus the window, don't navigate
              return client.focus();
            }
          }
        }

        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
