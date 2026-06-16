import { useEffect, useRef, useState } from "react";

/**
 * Lightweight liveness probe for the auth backend (/auth/v1/health).
 * - "checking": initial probe in flight
 * - "ok": backend responded within the timeout
 * - "degraded": backend timed out or returned a network/5xx error
 *
 * While degraded, re-probes every `pollMs` until recovery.
 */
export type BackendHealthStatus = "checking" | "ok" | "degraded";

interface UseBackendHealthOptions {
  /** Per-probe timeout in ms (default 5s). */
  timeoutMs?: number;
  /** Poll interval while degraded (default 15s). */
  pollMs?: number;
  /** Disable polling entirely. */
  enabled?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

async function probe(timeoutMs: number): Promise<boolean> {
  if (!SUPABASE_URL || !ANON_KEY) return true; // can't probe — assume ok
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      method: "GET",
      headers: { apikey: ANON_KEY },
      signal: ctrl.signal,
      cache: "no-store",
    });
    return res.ok || res.status === 401; // 401 still means GoTrue is alive
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function useBackendHealth(options: UseBackendHealthOptions = {}) {
  const { timeoutMs = 5_000, pollMs = 15_000, enabled = true } = options;
  const [status, setStatus] = useState<BackendHealthStatus>("checking");
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const inFlight = useRef(false);

  const runProbe = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const ok = await probe(timeoutMs);
      setStatus(ok ? "ok" : "degraded");
      setLastCheckedAt(Date.now());
    } finally {
      inFlight.current = false;
    }
  };

  useEffect(() => {
    if (!enabled) return;
    void runProbe();
    const id = setInterval(() => {
      if (status === "degraded" || status === "checking") void runProbe();
    }, pollMs);
    const onFocus = () => void runProbe();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pollMs, timeoutMs]);

  return { status, lastCheckedAt, recheck: runProbe };
}
