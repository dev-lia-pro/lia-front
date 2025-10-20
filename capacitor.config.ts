import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pro.lia.app',
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
      overlay: false,
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  // iOS-specific configuration
  ios: {
    // iOS build configuration
    // Note: GoogleService-Info.plist must be added manually in Xcode
    // See docs/IOS_FIREBASE_SETUP.md for setup instructions
  },
  // Android-specific configuration
  android: {
    // Android build configuration
    // google-services.json is already configured
  },
};

export default config;
