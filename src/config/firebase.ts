import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

// Firebase configuration from Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCwhkKP2cJdupJOD10zT4r7BRE02GPMmcM",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "lia-pro"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lia-pro",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lia-pro.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1005775339351",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1005775339351:web:e706e51a96b03379084812"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging: Messaging | null = null;

// Only initialize messaging if running in browser and service workers are supported
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
  }
}

export { app, messaging, getToken, onMessage };
export default firebaseConfig;
