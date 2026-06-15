import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import { reportInstalledVersion } from "@/services/appReleasesService";

const DEVICE_ID_KEY = "neural-aegis.deviceId";

function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

/**
 * Reports the installed Android app version to the backend each time the
 * authenticated user opens the native app. No-op on web/iOS.
 */
export function useAndroidVersionReporter() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (!Capacitor.isNativePlatform()) return;
    if (Capacitor.getPlatform() !== "android") return;

    let cancelled = false;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const info = await App.getInfo();
        if (cancelled) return;

        const versionCode = Number.parseInt(String(info.build ?? "0"), 10) || 0;
        await reportInstalledVersion({
          versionCode,
          versionName: info.version ?? "0.0.0",
          deviceId: getOrCreateDeviceId(),
          platform: "android",
        });
      } catch (e) {
        // Silent — never break startup
        console.warn("[useAndroidVersionReporter]", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);
}
