import { useCallback, useEffect, useState } from "react";
import { App } from "@capacitor/app";
import {
  dismissUpdate,
  fetchLatestRelease,
  getInstalledVersionCode,
  isAndroidNative,
  isForcedUpdate,
  isUpdateDismissed,
  type AndroidReleaseInfo,
} from "@/lib/appRelease";

export type AppUpdateState = {
  release: AndroidReleaseInfo;
  localVersionCode: number;
  forced: boolean;
};

export function useAppUpdate() {
  const [update, setUpdate] = useState<AppUpdateState | null>(null);
  const [checking, setChecking] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (!isAndroidNative()) return;
    if (!import.meta.env.VITE_ANDROID_RELEASE_MANIFEST_URL?.trim()) return;

    setChecking(true);
    try {
      const [localCode, release] = await Promise.all([getInstalledVersionCode(), fetchLatestRelease()]);
      if (localCode == null || !release) {
        setUpdate(null);
        return;
      }
      if (release.versionCode <= localCode) {
        setUpdate(null);
        return;
      }
      if (!isForcedUpdate(localCode, release) && isUpdateDismissed(release.versionCode)) {
        setUpdate(null);
        return;
      }
      setUpdate({
        release,
        localVersionCode: localCode,
        forced: isForcedUpdate(localCode, release),
      });
    } finally {
      setChecking(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    if (!update || update.forced) return;
    dismissUpdate(update.release.versionCode);
    setUpdate(null);
  }, [update]);

  useEffect(() => {
    if (!isAndroidNative()) return;
    void checkForUpdate();
    const subPromise = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void checkForUpdate();
    });
    return () => {
      void subPromise.then((h) => h.remove());
    };
  }, [checkForUpdate]);

  return { update, checking, dismiss, recheck: checkForUpdate };
}
