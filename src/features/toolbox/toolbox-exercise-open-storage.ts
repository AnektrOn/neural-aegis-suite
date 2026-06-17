const OPEN_PREFIX = "aegis:toolbox-exercise-open:";

export function saveOpenToolboxExerciseId(userId: string, assignmentId: string | null): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const key = `${OPEN_PREFIX}${userId}`;
    if (assignmentId) sessionStorage.setItem(key, assignmentId);
    else sessionStorage.removeItem(key);
  } catch {
    // private mode / quota
  }
}

export function loadOpenToolboxExerciseId(userId: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(`${OPEN_PREFIX}${userId}`);
  } catch {
    return null;
  }
}
