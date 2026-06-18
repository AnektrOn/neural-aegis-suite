import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export const CHUNK_RELOAD_KEY = "aegis:chunk-reload";

function isChunkLoadError(error: unknown): boolean {
  const msg = (error as { message?: string } | null)?.message ?? "";
  if (!msg) return false;
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /NetworkError when attempting to fetch resource/i.test(msg) ||
    /Load failed/i.test(msg) ||
    /ChunkLoadError/i.test(msg)
  );
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Lazy import that retries once in-place on transient network failures, then
 * triggers a single full reload if a hashed chunk is missing (stale cache).
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    const alreadyReloaded =
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";

    const triggerReload = (): Promise<{ default: T }> => {
      if (!alreadyReloaded && typeof window !== "undefined") {
        try { sessionStorage.setItem(CHUNK_RELOAD_KEY, "1"); } catch {}
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw new Error("Chunk reload loop suppressed");
    };

    const loadOnce = async (): Promise<{ default: T }> => {
      const mod = await importer();
      if (!mod || typeof (mod as { default?: unknown }).default === "undefined") {
        throw new Error("Dynamic import resolved without default export");
      }
      return mod;
    };

    try {
      const mod = await loadOnce();
      try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch {}
      return mod;
    } catch (error) {
      const msg = String((error as Error)?.message ?? "");
      if (isChunkLoadError(error) || /default export/.test(msg)) {
        try {
          await sleep(600);
          const mod = await loadOnce();
          try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch {}
          return mod;
        } catch {
          return triggerReload();
        }
      }
      try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch {}
      throw error;
    }
  });
}

