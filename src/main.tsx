import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/drag.css'
import { QueryProvider } from './providers/QueryProvider'
import { PostHogProvider } from 'posthog-js/react'
import { registerSW } from 'virtual:pwa-register'

// Register service worker for PWA
registerSW({ immediate: true })

const isPostHogEnabled = import.meta.env.VITE_ENABLE_POSTHOG === 'true';

if (isPostHogEnabled) {
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <PostHogProvider
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
        options={{
          api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
          defaults: '2025-05-24',
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
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryProvider>
        <App />
      </QueryProvider>
    </React.StrictMode>
  );
}