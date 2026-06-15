import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export const CHUNK_RELOAD_KEY = "aegis:chunk-reload";

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false;
  const msg = error.message ?? "";
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

/**
 * Lazy import that reloads once when a hashed chunk is missing (stale cache after deploy).
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
    try {
      const mod = await importer();
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return mod;
    } catch (error) {
      if (isChunkLoadError(error) && !alreadyReloaded) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      throw error;
    }
  });
}
