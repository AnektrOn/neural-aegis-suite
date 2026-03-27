import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { App } from "@capacitor/app";

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

export async function initNativeApp(): Promise<void> {
  if (!isNative) return;

  try {
    await SplashScreen.hide();
  } catch {
    // Splash may already be hidden
  }

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (platform === "android") {
      await StatusBar.setBackgroundColor({ color: "#08090D" });
    }
  } catch {
    // Some platforms may not support all StatusBar options
  }

  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      void App.exitApp();
    }
  });
}
