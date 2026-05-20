import type { MicroPracticeConfig } from "@/components/widgets/MicroPracticeWidget";

export type MicroHeroPreset = "pulse" | "orbit" | "steps" | "ink" | "shake" | "flame" | "shield" | "spark";

export interface SlugTheme {
  accent: string;
  hero?: MicroHeroPreset;
}

/** Per-slug visual identity for MicroPractice and bespoke widgets. */
export const TOOLBOX_SLUG_THEMES: Record<string, SlugTheme> = {
  micro_movement: { accent: "hsl(35 80% 58%)", hero: "pulse" },
  shake_release: { accent: "hsl(0 65% 55%)", hero: "shake" },
  posture_reset: { accent: "hsl(176 70% 48%)", hero: "steps" },
  energy_activation: { accent: "hsl(45 90% 55%)", hero: "flame" },
  cold_exposure_prep: { accent: "hsl(200 70% 55%)", hero: "orbit" },
  walking_meditation: { accent: "hsl(160 50% 45%)", hero: "steps" },
  ritual_sequence: { accent: "hsl(270 50% 60%)", hero: "steps" },
  habit_checkbox: { accent: "hsl(176 70% 48%)", hero: "pulse" },
  worry_dump: { accent: "hsl(220 55% 55%)", hero: "ink" },
  evening_review: { accent: "hsl(250 45% 55%)", hero: "ink" },
  belief_reframe: { accent: "hsl(270 50% 60%)", hero: "spark" },
  if_then_plan: { accent: "hsl(176 70% 48%)", hero: "steps" },
  archetype_mirror: { accent: "hsl(35 80% 58%)", hero: "spark" },
  light_quality_practice: { accent: "hsl(45 90% 55%)", hero: "flame" },
  symbol_encounter: { accent: "hsl(270 50% 60%)", hero: "spark" },
  boundary_practice: { accent: "hsl(0 65% 55%)", hero: "shield" },
  sacred_no: { accent: "hsl(220 70% 60%)", hero: "shield" },
  energy_ledger: { accent: "hsl(176 70% 48%)", hero: "orbit" },
  synchronicity_log: { accent: "hsl(270 50% 60%)", hero: "spark" },
  relation_repair: { accent: "hsl(200 70% 55%)", hero: "steps" },
  social_micro_action: { accent: "hsl(176 70% 48%)", hero: "pulse" },
  dialogue_parts: { accent: "hsl(220 70% 60%)" },
  decision_matrix: { accent: "hsl(35 80% 58%)" },
  empathy_perspective: { accent: "hsl(176 70% 48%)" },
  shadow_checkin: { accent: "hsl(270 40% 45%)" },
  journal_stream: { accent: "hsl(220 70% 60%)", hero: "ink" },
  morning_pages: { accent: "hsl(45 70% 55%)", hero: "ink" },
  letter_unsent: { accent: "hsl(0 55% 55%)", hero: "ink" },
};

export function applySlugTheme(
  slug: string,
  cfg: Record<string, unknown>,
): MicroPracticeConfig & { hero?: MicroHeroPreset } {
  const theme = TOOLBOX_SLUG_THEMES[slug];
  return {
    ...(cfg as MicroPracticeConfig),
    accent_color:
      (typeof cfg.accent_color === "string" && cfg.accent_color) || theme?.accent,
    hero:
      (cfg.hero as MicroHeroPreset | undefined) || theme?.hero,
  };
}

export function getSlugAccent(slug: string, cfg?: Record<string, unknown>): string {
  if (cfg && typeof cfg.accent_color === "string") return cfg.accent_color;
  return TOOLBOX_SLUG_THEMES[slug]?.accent ?? "hsl(176 70% 48%)";
}
