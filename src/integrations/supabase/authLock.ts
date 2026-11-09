/**
 * Supabase auto-refresh uses acquireTimeout=0 (ifAvailable). When the lock is
 * already held (init / another tab / getSession), default navigatorLock throws
 * NavigatorLockAcquireTimeoutError — often shown as an uncaught promise in
 * Firefox even though the tick catches it. Skip quietly on the non-blocking
 * path; wait (with optional timeout) otherwise.
 */
export async function authLock<R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> {
  if (typeof navigator === "undefined" || typeof navigator.locks?.request !== "function") {
    return await fn();
  }

  if (acquireTimeout === 0) {
    const result = await navigator.locks.request(
      name,
      { mode: "exclusive", ifAvailable: true },
      async (lock) => {
        if (!lock) return undefined;
        return await fn();
      },
    );
    return result as R;
  }

  const ac = new AbortController();
  const timer =
    acquireTimeout > 0
      ? setTimeout(() => ac.abort(), acquireTimeout)
      : undefined;

  try {
    return await navigator.locks.request(
      name,
      acquireTimeout > 0
        ? { mode: "exclusive", signal: ac.signal }
        : { mode: "exclusive" },
      async (lock) => {
        if (!lock) return await fn();
        return await fn();
      },
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}
