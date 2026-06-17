/** Shared tick bus so exercise timers resync while a tab is backgrounded (throttled but alive). */
const subscribers = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function pulse() {
  subscribers.forEach((fn) => fn());
}

function ensureInterval() {
  if (intervalId !== null) return;
  intervalId = setInterval(pulse, 250);
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibility, { capture: true });
  }
}

function teardownInterval() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", onVisibility, { capture: true });
  }
}

function onVisibility() {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "visible") pulse();
}

export function subscribeWallClockTick(listener: () => void): () => void {
  subscribers.add(listener);
  ensureInterval();
  return () => {
    subscribers.delete(listener);
    if (subscribers.size === 0) teardownInterval();
  };
}
