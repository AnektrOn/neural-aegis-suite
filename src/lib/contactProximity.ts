/** Valeurs stockées en base (people_contacts.proximity) */
export const CONTACT_PROXIMITY_VALUES = [
  "famille",
  "ami",
  "equipe_direction",
  "prestataire",
  "employe",
] as const;

export type ContactProximity = (typeof CONTACT_PROXIMITY_VALUES)[number];

export const DEFAULT_CONTACT_PROXIMITY: ContactProximity = "employe";

export const CONTACT_PROXIMITY_LABELS: Record<ContactProximity, string> = {
  famille: "Famille",
  ami: "Amis",
  equipe_direction: "Équipe de direction",
  prestataire: "Prestataires",
  employe: "Employé",
};

/** Rayons d’orbite (proche du centre = lien plus intime) — écarts larges pour que le déplacement soit lisible à l’écran */
export const PROXIMITY_LAYOUT: Record<ContactProximity, { orbitR: number; spriteBase: number }> = {
  famille: { orbitR: 4.0, spriteBase: 1.78 },
  ami: { orbitR: 8.8, spriteBase: 1.22 },
  equipe_direction: { orbitR: 13.5, spriteBase: 1.05 },
  employe: { orbitR: 18.2, spriteBase: 0.92 },
  prestataire: { orbitR: 23.0, spriteBase: 0.78 },
};

export function isContactProximity(v: string | null | undefined): v is ContactProximity {
  return v != null && (CONTACT_PROXIMITY_VALUES as readonly string[]).includes(v);
}

export function normalizeContactProximity(v: string | null | undefined): ContactProximity {
  return isContactProximity(v) ? v : DEFAULT_CONTACT_PROXIMITY;
}

/** Opacité de base du trait centre → contact (simule l’épaisseur) à partir de la note sur la période [0–10] */
export function lineOpacityFromQuality(pq: number): number {
  const q = Math.min(10, Math.max(0, pq));
  return 0.02 + (q / 10) ** 1.55 * 0.58;
}
