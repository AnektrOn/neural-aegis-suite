const KEY_PREFIX = "aegis_houses72_resume_dismissed:";

function storageKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export function wasHouses72ResumeDismissedThisVisit(userId: string): boolean {
  try {
    return sessionStorage.getItem(storageKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markHouses72ResumeDismissedThisVisit(userId: string): void {
  try {
    sessionStorage.setItem(storageKey(userId), "1");
  } catch {
    /* private mode / quota */
  }
}

export function clearAllHouses72ResumeDismissed(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(KEY_PREFIX)) toRemove.push(key);
    }
    for (const key of toRemove) sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
