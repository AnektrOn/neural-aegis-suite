import { createElement, type ComponentProps, type ComponentType } from "react";

export const CHUNK_RELOAD_KEY = "aegis:chunk-reload";

function isChunkLoadError(error: unknown): boolean {
  const msg = String((error as { message?: string; name?: string } | null)?.message ?? error ?? "");
  const name = String((error as { name?: string } | null)?.name ?? "");
  const text = `${name} ${msg}`;
  if (!text.trim()) return false;
  return (
    /Failed to fetch dynamically imported module/i.test(text) ||
    /error loading dynamically imported module/i.test(text) ||
    /Importing a module script failed/i.test(text) ||
    /NetworkError when attempting to fetch resource/i.test(text) ||
    /Load failed/i.test(text) ||
    /ChunkLoadError/i.test(text) ||
    /default export/i.test(text) ||
    /can't access property "default"/i.test(text)
  );
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function wasChunkReloadAttempted(): boolean {
  try {
    return typeof window !== "undefined" && window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
  } catch {
    return false;
  }
}

function markChunkReloadAttempted() {
  try {
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  } catch {}
}

function clearChunkReloadAttempt() {
  try {
    window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {}
}

/**
 * Lazy import that retries once in-place on transient network failures, then
 * triggers a single full reload if a hashed chunk is missing (stale cache).
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>,
): ComponentType<ComponentProps<T>> {
  let Component: T | null = null;
  let pending: Promise<void> | null = null;
  let failed: unknown = null;

  const triggerReload = (originalError: unknown): Promise<T> => {
    if (!wasChunkReloadAttempted() && typeof window !== "undefined") {
      markChunkReloadAttempted();
      window.location.reload();
      return new Promise<T>(() => {});
    }
    // Already reloaded once — clear the flag so future navigations can retry,
    // and surface the original error to the ErrorBoundary instead of blanking.
    clearChunkReloadAttempt();
    throw originalError instanceof Error
      ? originalError
      : new Error("Failed to load module");
  };

  const loadOnce = async (): Promise<T> => {
      const mod = await importer();
      if (!mod || typeof (mod as { default?: unknown }).default === "undefined") {
        throw new Error("Dynamic import resolved without default export");
      }
      return mod.default;
    };

  const loadComponent = async (): Promise<T> => {
    try {
      const loaded = await loadOnce();
      clearChunkReloadAttempt();
      return loaded;
    } catch (error) {
      if (isChunkLoadError(error)) {
        try {
          await sleep(600);
          const loaded = await loadOnce();
          clearChunkReloadAttempt();
          return loaded;
        } catch {
          return triggerReload();
        }
      }
      clearChunkReloadAttempt();
      throw error;
    }
  };

  return function RetriedLazyComponent(props: ComponentProps<T>) {
    if (Component) return createElement(Component, props);
    if (failed) throw failed;

    if (!pending) {
      pending = loadComponent().then(
        (loaded) => {
          Component = loaded;
          pending = null;
        },
        (error) => {
          failed = error;
          pending = null;
        },
      );
    }

    throw pending;
  };
}

