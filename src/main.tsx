import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/drag.css'
import { QueryProvider } from './providers/QueryProvider'
import { PostHogProvider } from 'posthog-js/react'
import { Capacitor } from '@capacitor/core'
// TEMPORARILY DISABLED: VitePWA conflict with firebase-messaging-sw.js
// import { registerSW } from 'virtual:pwa-register'

// Register service worker for PWA
// TEMPORARILY DISABLED: Firebase service worker is registered in usePushNotifications hook
// registerSW({ immediate: true })

// IMPORTANT: Disable PostHog on native platforms (iOS/Android)
// PostHog Web SDK doesn't work properly on Capacitor native apps
const isNativePlatform = Capacitor.isNativePlatform();
const isPostHogEnabled = !isNativePlatform && import.meta.env.VITE_ENABLE_POSTHOG === 'true';

if (isPostHogEnabled) {
  console.log('✅ PostHog enabled for web platform');
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <PostHogProvider
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
        options={{
          api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
          capture_exceptions: true,
          debug: import.meta.env.MODE === "development",
          disable_session_recording: false,
          person_profiles: 'identified_only',
        }}
      >
        <QueryProvider>
          <App />
        </QueryProvider>
      </PostHogProvider>
    </React.StrictMode>
  );
} else {
  if (isNativePlatform) {
    console.log('ℹ️ PostHog disabled on native platform');
  }
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryProvider>
        <App />
      </QueryProvider>
    </React.StrictMode>
  );
}