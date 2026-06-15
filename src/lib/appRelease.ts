import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { ApkInstaller } from "@/lib/plugins/apkInstaller";
import { logUpdateEvent } from "@/services/appReleasesService";

export type AndroidReleaseInfo = {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  releaseNotes?: string;
  forceUpdate?: boolean;
  minVersionCode?: number;
  releaseId?: string;
};

export type ReleaseManifest = {
  android: AndroidReleaseInfo;
};

const DISMISS_PREFIX = "aegis:update-dismissed:";

export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function getInstalledVersionCode(): Promise<number | null> {
  if (!isAndroidNative()) return null;
  try {
    const info = await App.getInfo();
    const code = Number(info.build);
    return Number.isFinite(code) ? code : null;
  } catch {
    return null;
  }
}

/** Build fetch URL for latest.json — preserves signed URLs from admin publish. */
export function getManifestFetchUrl(manifestUrl: string): string {
  const trimmed = manifestUrl.trim();
  if (!trimmed) return trimmed;

  try {
    const url = new URL(trimmed);
    const signed =
      url.searchParams.has("token") ||
      url.searchParams.has("X-Amz-Signature") ||
      url.searchParams.has("Signature") ||
      url.pathname.includes("/sign/");
    if (signed) return trimmed;
    url.searchParams.set("t", String(Date.now()));
    return url.toString();
  } catch {
    if (trimmed.includes("token=") || trimmed.includes("X-Amz-Signature=")) {
      return trimmed;
    }
    const sep = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${sep}t=${Date.now()}`;
  }
}

export async function fetchLatestRelease(): Promise<AndroidReleaseInfo | null> {
  const manifestUrl = import.meta.env.VITE_ANDROID_RELEASE_MANIFEST_URL?.trim();
  if (!manifestUrl) return null;

  try {
    const res = await fetch(getManifestFetchUrl(manifestUrl), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const manifest = (await res.json()) as ReleaseManifest;
    const android = manifest?.android;
    if (!android?.versionCode || !android.apkUrl) return null;
    return {
      versionCode: android.versionCode,
      versionName: android.versionName,
      apkUrl: android.apkUrl,
      releaseNotes: android.releaseNotes,
      forceUpdate: android.forceUpdate,
      minVersionCode: android.minVersionCode ?? undefined,
      releaseId: android.releaseId,
    };
  } catch (err) {
    console.error("fetchLatestRelease", err);
    return null;
  }
}

export function isUpdateDismissed(versionCode: number): boolean {
  try {
    return sessionStorage.getItem(`${DISMISS_PREFIX}${versionCode}`) === "1";
  } catch {
    return false;
  }
}

export function dismissUpdate(versionCode: number): void {
  try {
    sessionStorage.setItem(`${DISMISS_PREFIX}${versionCode}`, "1");
  } catch {
    // private browsing / disabled storage
  }
}

export function isForcedUpdate(localCode: number, release: AndroidReleaseInfo): boolean {
  if (release.forceUpdate) return true;
  if (typeof release.minVersionCode === "number" && localCode < release.minVersionCode) {
    return true;
  }
  return false;
}

export function installApkUpdate(
  apkUrl: string,
  handlers: {
    versionCode?: number;
    releaseId?: string;
    onProgress?: (progress: number) => void;
    onComplete?: () => void;
    onError?: (message: string) => void;
  } = {},
): Promise<void> {
  const analytics = {
    versionCode: handlers.versionCode,
    releaseId: handlers.releaseId,
  };

  logUpdateEvent({ type: "download_started", ...analytics });

  return new Promise(async (resolve, reject) => {
    const handles: Awaited<ReturnType<typeof ApkInstaller.addListener>>[] = [];

    const cleanup = async () => {
      await Promise.all(handles.map((h) => h.remove()));
    };

    try {
      handles.push(
        await ApkInstaller.addListener("downloadProgress", (ev) => {
          handlers.onProgress?.(ev.progress);
        }),
      );
      handles.push(
        await ApkInstaller.addListener("downloadComplete", () => {
          logUpdateEvent({ type: "download_complete", ...analytics });
          handlers.onComplete?.();
          void cleanup().then(resolve);
        }),
      );
      handles.push(
        await ApkInstaller.addListener("installIntentOpened", () => {
          logUpdateEvent({ type: "install_intent_opened", ...analytics });
        }),
      );
      handles.push(
        await ApkInstaller.addListener("downloadError", (ev) => {
          handlers.onError?.(ev.message);
          void cleanup().then(() => reject(new Error(ev.message)));
        }),
      );

      await ApkInstaller.downloadAndInstall({ url: apkUrl });
    } catch (err) {
      await cleanup();
      reject(err instanceof Error ? err : new Error("Download failed"));
    }
  });
}
