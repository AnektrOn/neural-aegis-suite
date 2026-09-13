export const TOOLBOX_PHASE_COLORS = {
  inhale: "hsl(var(--primary))",
  hold: "hsl(var(--neural-accent))",
  exhale: "hsl(var(--neural-warm))",
  active: "hsl(var(--primary))",
  rest: "hsl(var(--muted-foreground))",
} as const;

export type ToolboxPhaseColorKey = keyof typeof TOOLBOX_PHASE_COLORS;

/** Semantic accent slots for multi-column / multi-voice widgets */
export const TOOLBOX_ACCENT_SLOTS = [
  TOOLBOX_PHASE_COLORS.inhale,
  TOOLBOX_PHASE_COLORS.hold,
  TOOLBOX_PHASE_COLORS.exhale,
] as const;

export function phaseColorMix(color: string, alphaPercent: number): string {
  return `color-mix(in srgb, ${color} ${alphaPercent}%, transparent)`;
}

/** "hsl(H S% L%)" or "hsl(var(--token))" -> with alpha */
export function hslWithAlpha(hslColor: string, alpha: number): string {
  const trimmed = hslColor.trim();
  const m = trimmed.match(/^hsl\(\s*(.+?)\s*\)$/i);
  if (!m) return trimmed;
  return `hsl(${m[1]} / ${alpha})`;
}

export const TOOLBOX_STOP_STEP_COLORS = [
  "hsl(var(--destructive))",
  TOOLBOX_PHASE_COLORS.exhale,
  TOOLBOX_PHASE_COLORS.hold,
  TOOLBOX_PHASE_COLORS.inhale,
] as const;

export function sceneColorForIndex(index: number): string {
  return TOOLBOX_ACCENT_SLOTS[index % TOOLBOX_ACCENT_SLOTS.length] ?? TOOLBOX_PHASE_COLORS.active;
}

export function resolveToolboxAccent(configAccent?: string, slotIndex = 0): string {
  if (configAccent?.trim()) return configAccent.trim();
  return TOOLBOX_ACCENT_SLOTS[slotIndex % TOOLBOX_ACCENT_SLOTS.length] ?? TOOLBOX_PHASE_COLORS.active;
}
