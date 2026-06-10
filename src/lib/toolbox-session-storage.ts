const TIMER_PREFIX = "aegis:widget-timer:";

export interface TimerSessionData {
  accumulatedSec: number;
  runningSince: number | null;
  completed: boolean;
}

function timerKey(sessionKey: string): string {
  return `${TIMER_PREFIX}${sessionKey}`;
}

export function loadTimerSession(sessionKey: string): TimerSessionData | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(timerKey(sessionKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TimerSessionData;
    if (
      typeof parsed.accumulatedSec !== "number" ||
      (parsed.runningSince !== null && typeof parsed.runningSince !== "number") ||
      typeof parsed.completed !== "boolean"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveTimerSession(sessionKey: string, data: TimerSessionData): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(timerKey(sessionKey), JSON.stringify(data));
  } catch {
    // quota / private mode
  }
}

export function clearTimerSession(sessionKey: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(timerKey(sessionKey));
  } catch {
    // ignore
  }
}

export function getElapsedSec(data: TimerSessionData): number {
  let sec = data.accumulatedSec;
  if (data.runningSince !== null) {
    sec += Math.floor((Date.now() - data.runningSince) / 1000);
  }
  return sec;
}

export function hasActiveToolboxSession(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key?.startsWith(TIMER_PREFIX)) continue;
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw) as TimerSessionData;
      if (data.completed) continue;
      if (data.runningSince !== null || data.accumulatedSec > 0) return true;
    }
  } catch {
    return false;
  }
  return false;
}
