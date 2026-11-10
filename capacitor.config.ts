export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  plugins?: Record<string, unknown>;
  server?: {
    androidScheme?: string;
    url?: string;
    cleartext?: boolean;
  };
}

const config: CapacitorConfig = {
  appId: 'com.morningritual.bestpart',
  appName: 'Our Little Morning Ritual Bestpart',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#faf6f2',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
