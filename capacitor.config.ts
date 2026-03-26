import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.neuralaegis.app",
  appName: "Neural Aegis",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#08090D",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      launchAutoHide: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#08090D",
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
    },
  },
};

export default config;
