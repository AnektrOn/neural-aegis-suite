import type { RunePrincipleCode } from "./types";

const LEGACY_ACCENT: Record<string, string> = {
  // Kybalion
  MENTALISM: "217 91% 60%",
  CORRESPONDENCE: "250 70% 68%",
  VIBRATION: "158 64% 52%",
  POLARITY: "38 92% 56%",
  RHYTHM: "200 80% 60%",
  CAUSE_EFFECT: "0 70% 60%",
  GENDER: "280 60% 65%",
  // Collection glyphs
  KYBALION: "217 80% 58%",
  MYSS_ARCHETYPE: "275 70% 62%",
  ECHOLS: "174 65% 48%",
  AEGIS: "200 75% 55%",
  // Echols — clinical
  ENERGY: "186 80% 52%",
  GROUNDING: "30 25% 58%",
  SHIELDING: "215 35% 55%",
  DIRECTING: "205 85% 58%",
  CENTERING: "248 60% 62%",
  // Myss — Survival
  CHILD: "195 70% 65%",
  VICTIM: "350 65% 50%",
  PROSTITUTE: "310 45% 55%",
  SABOTEUR: "220 40% 55%",
  // Myss — Personality
  MYSTIC: "260 75% 60%",
  SAGE: "40 80% 55%",
  HEALER: "155 65% 50%",
  WARRIOR: "10 75% 55%",
  SOVEREIGN: "45 85% 55%",
  CREATOR: "295 70% 60%",
  EXPLORER: "185 75% 50%",
  REBEL: "25 90% 55%",
  LOVER: "340 75% 65%",
  CAREGIVER: "140 55% 55%",
  MAGICIAN: "275 80% 58%",
  JESTER: "55 85% 55%",
};

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getRuneAccent(code: RunePrincipleCode): string {
  if (LEGACY_ACCENT[code]) return LEGACY_ACCENT[code];
  const h = hashCode(code);
  const hue = h % 360;
  const sat = 55 + (h % 35);
  const light = 50 + (h % 18);
  return `${hue} ${sat}% ${light}%`;
}
