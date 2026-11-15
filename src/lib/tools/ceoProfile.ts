const PROFILE_STORAGE_KEY = "aegis:tools:ceo-profile:v1";

export type CeoArchetype =
  | "first-time-founder"
  | "serial-entrepreneur"
  | "corporate-escapee"
  | "technical-founder"
  | "hypergrowth-leader";

export type CeoStage = "ideation" | "pmf-search" | "early-traction" | "scaling" | "hypergrowth";

export interface CeoProfile {
  archetype: CeoArchetype;
  stage: CeoStage;
  teamSize: number;
  decisionsPerWeek: number;
  sleepHours: number;
  updatedAt: string;
}

export const CEO_ARCHETYPE_LABELS: Record<CeoArchetype, string> = {
  "first-time-founder": "Fondateur première entreprise",
  "serial-entrepreneur": "Entrepreneur en série",
  "corporate-escapee": "Ex-dirigeant corporate",
  "technical-founder": "Fondateur technique",
  "hypergrowth-leader": "Leader en hypercroissance",
};

export const CEO_STAGE_LABELS: Record<CeoStage, string> = {
  ideation: "Idéation",
  "pmf-search": "Recherche du PMF",
  "early-traction": "Traction initiale",
  scaling: "Scale-up",
  hypergrowth: "Hypercroissance",
};

export function getCeoProfile(): CeoProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CeoProfile;
    if (!parsed.archetype || !parsed.stage) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCeoProfile(profile: Omit<CeoProfile, "updatedAt">): CeoProfile {
  const next: CeoProfile = { ...profile, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
  return next;
}

export function clearCeoProfile(): void {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasCeoProfile(): boolean {
  return getCeoProfile() !== null;
}