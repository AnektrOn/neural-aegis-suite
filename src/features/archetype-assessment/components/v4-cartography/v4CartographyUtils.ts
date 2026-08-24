import { getArchetype } from "@/features/archetype-assessment/domain/archetypes";
import type { ArchetypeKey, PoleActivationEntry, SurvivalGuardEntry } from "@/features/archetype-assessment/domain/types";

export const ORB_HOVER_INTENSITY = 0.2;

/** V4 pole activation is normalized on a 20 % ceiling. */
export const POLE_ACTIVATION_CEILING = 20;

export type OrbZone = "light" | "shadow" | "survival";

export const ZONE_COLORS = {
  light: "hsl(42 88% 65%)",
  shadow: "hsl(358 65% 42%)",
  survival: "hsl(6 92% 60%)",
} as const;

/** Shader zoneType + background for constellation orbs. */
export const ZONE_ORB_CONFIG: Record<OrbZone, { zoneType: number; backgroundColor: string }> = {
  light: { zoneType: 1, backgroundColor: "#0c0a06" },
  shadow: { zoneType: 2, backgroundColor: "#0e0204" },
  survival: { zoneType: 3, backgroundColor: "#160504" },
};

/** Orb shader tuning per cartography zone. */
const ZONE_RADIUS_VB: Record<OrbZone, { min: number; max: number }> = {
  light: { min: 11, max: 32 },
  shadow: { min: 10, max: 30 },
  survival: { min: 8, max: 22 },
};

const DOMINANT_RADIUS_BOOST = 1.12;
const ORB_PX_CLAMP = { min: 18, max: 56 } as const;
const SIZE_CURVE_EXPONENT = 1.25;

export function poleDisplayName(entry: PoleActivationEntry, isFR: boolean): string {
  const meta = getArchetype(entry.archetype);
  return isFR ? meta.name_fr : meta.name_en;
}

/** Strip articles so node labels stay short (Le Sage → Sage). */
export function shortDisplayName(name: string): string {
  return name.replace(/^(l['’]|le |la |les |the )/i, "").trim();
}

export function poleColor(entry: PoleActivationEntry): string {
  return getArchetype(entry.archetype).color;
}

export const SURVIVAL_RED = ZONE_COLORS.survival;
export const survivalGradientId = "v4-grad-survival";

export function poleHue(entry: PoleActivationEntry): number {
  return archetypeOrbHue(entry.archetype);
}

export function archetypeOrbHue(key: ArchetypeKey): number {
  const m = getArchetype(key).color.match(/hsl\(\s*([\d.]+)/);
  return m ? Number(m[1]) : 0;
}

function activationRatio(percent: number): number {
  const ratio = Math.min(Math.max(percent, 0) / POLE_ACTIVATION_CEILING, 1);
  return Math.pow(ratio, SIZE_CURVE_EXPONENT);
}

export function orbDiameterVb(activation: number, zone: OrbZone, isDominant: boolean): number {
  const { min, max } = ZONE_RADIUS_VB[zone];
  let radius = min + activationRatio(activation) * (max - min);
  if (isDominant) radius *= DOMINANT_RADIUS_BOOST;
  const cap = max * DOMINANT_RADIUS_BOOST;
  return Math.min(cap, radius) * 2;
}

export function orbDiameterPx(diameterVb: number, scale: number): number {
  const px = diameterVb * scale;
  return Math.round(Math.min(ORB_PX_CLAMP.max, Math.max(ORB_PX_CLAMP.min, px)));
}

/** Strongest survival signal — single pole, same 20 % scale as alliance/ombre. */
export function survivalActivation(entry: SurvivalGuardEntry): number {
  return Math.max(entry.lightPercent, entry.shadowPercent);
}

export function poleGradientId(nodeId: string, color: string): string {
  const hue = color.match(/hsl\(\s*([\d.]+)/)?.[1] ?? "0";
  return `v4-grad-${nodeId.replace(/[^a-zA-Z0-9-]/g, "")}-${hue}`;
}

export function maxActivation(entries: PoleActivationEntry[]): number {
  return Math.max(...entries.map((e) => e.activationPercent), 0.01);
}

export function nodeRadius(percent: number, max: number, min = 14, maxR = 36): number {
  return min + (percent / max) * (maxR - min);
}

export function survivalTotal(entry: SurvivalGuardEntry): number {
  return entry.lightPercent + entry.shadowPercent;
}

export function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
