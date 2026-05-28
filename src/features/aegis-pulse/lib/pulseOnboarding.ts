const PULSE_ONBOARDED_KEY_PREFIX = "aegis_pulse_onboarded_";

export function pulseOnboardedKey(userId: string): string {
  return `${PULSE_ONBOARDED_KEY_PREFIX}${userId}`;
}

export function isPulseOnboarded(userId: string): boolean {
  try {
    return localStorage.getItem(pulseOnboardedKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markPulseOnboarded(userId: string): void {
  try {
    localStorage.setItem(pulseOnboardedKey(userId), "1");
  } catch {
    /* ignore */
  }
}

export function clearPulseOnboarded(userId: string): void {
  try {
    localStorage.removeItem(pulseOnboardedKey(userId));
  } catch {
    /* ignore */
  }
}
