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
    try {
      const mod = await importer();
      try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch {}
      return mod;
    } catch (error) {
      if (isChunkLoadError(error)) {
        try {
          await sleep(600);
          const mod = await importer();
          try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch {}
          return mod;
        } catch (retryError) {
          if (!alreadyReloaded) {
            try { sessionStorage.setItem(CHUNK_RELOAD_KEY, "1"); } catch {}
            window.location.reload();
            return new Promise<{ default: T }>(() => {});
          }
          throw retryError;
        }
      }
      try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch {}
      throw error;
    }
  });
}

