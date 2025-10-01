import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lia.app',
  appName: 'Lia',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // Allow cleartext traffic for local development
    // In production, this will be ignored as we use HTTPS
    cleartext: true,
    // Hostname for development (optional)
    // hostname: 'localhost',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
    },
  },
};

export default config;
