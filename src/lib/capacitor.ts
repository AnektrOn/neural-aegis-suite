/** Capacitor shell hooks — no-op on web. */

function readIsNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  return cap?.isNativePlatform?.() ?? false;
}

export const isNative = readIsNative();

export function getCapacitorPlatform(): string {
  if (typeof window === "undefined") return "web";
  const cap = (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  return cap?.getPlatform?.() ?? "web";
}

/** @deprecated prefer getCapacitorPlatform() */
export const platform = getCapacitorPlatform();

export async function initNativeApp(): Promise<void> {
  if (!readIsNative()) return;

  try {
    const [{ SplashScreen }, { StatusBar, Style }, { App }] = await Promise.all([
      import("@capacitor/splash-screen"),
      import("@capacitor/status-bar"),
      import("@capacitor/app"),
    ]);

    try {
      await SplashScreen.hide();
    } catch {
      // Splash may already be hidden
    }

    try {
      await StatusBar.setStyle({ style: Style.Dark });
      if (getCapacitorPlatform() === "android") {
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
  } catch (err) {
    console.warn("[capacitor] initNativeApp skipped:", err);
  }
}
