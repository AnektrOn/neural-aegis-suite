const INTRO_SEEN_KEY = "aegis_intro_seen:v1";

export function hasSeenIntro(): boolean {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // Storage unavailable (private mode, quota): the intro will simply show again.
  }
}
