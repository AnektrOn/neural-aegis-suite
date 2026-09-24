/**
 * Optional Sentry init — only loads when VITE_SENTRY_DSN is set.
 * Avoids bundling Sentry into the critical path when unset.
 */
export async function initErrorMonitoring(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || typeof window === "undefined") return;

  try {
    const Sentry = await import("@sentry/react");
    Sentry.init({
      dsn,
      environment: (import.meta.env.VITE_APP_ENV as string | undefined) || import.meta.env.MODE,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
  } catch (e) {
    console.warn("Sentry init skipped:", e);
  }
}
