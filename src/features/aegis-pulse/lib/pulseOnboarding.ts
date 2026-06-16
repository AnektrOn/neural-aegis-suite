const PULSE_ONBOARDED_KEY_PREFIX = "aegis_pulse_onboarded_";

export function pulseOnboardedKey(userId: string): string {
  return `${PULSE_ONBOARDED_KEY_PREFIX}${userId}`;
}

function readOnboarded(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1" || sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeOnboarded(key: string): void {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

export function isPulseOnboarded(userId: string): boolean {
  return readOnboarded(pulseOnboardedKey(userId));
}

export function markPulseOnboarded(userId: string): void {
  writeOnboarded(pulseOnboardedKey(userId));
}

export function clearPulseOnboarded(userId: string): void {
  try {
    localStorage.removeItem(pulseOnboardedKey(userId));
  } catch {
    /* ignore */
  }
}
