import {
  GUARDIAN_DEFAULT_STATE,
  type GuardianPersistedState,
} from "./types";

const STORAGE_PREFIX = "aegis_guardian_v1_";

export function guardianStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadGuardianState(userId: string): GuardianPersistedState {
  try {
    const raw = localStorage.getItem(guardianStorageKey(userId));
    if (!raw) return { ...GUARDIAN_DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<GuardianPersistedState>;
    const locale =
      parsed.locale === "fr" || parsed.locale === "en" ? parsed.locale : null;
    return {
      ...GUARDIAN_DEFAULT_STATE,
      ...parsed,
      locale,
      version: 1,
    };
  } catch {
    return { ...GUARDIAN_DEFAULT_STATE };
  }
}

export function saveGuardianState(
  userId: string,
  state: GuardianPersistedState,
): void {
  try {
    localStorage.setItem(guardianStorageKey(userId), JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Clears persisted Guardian onboarding so the activate modal can show again. */
export function clearGuardianState(userId: string): void {
  try {
    localStorage.removeItem(guardianStorageKey(userId));
  } catch {
    /* ignore */
  }
}
