import type { TranslationKey } from "@/i18n/translations";

export const MOOD_FREQUENCY_KEYS = [
  "mood.exhausted",
  "mood.low",
  "mood.agitated",
  "mood.neutral",
  "mood.balanced",
  "mood.focused",
  "mood.high",
  "mood.flow",
  "mood.optimal",
  "mood.transcendent",
] as const satisfies readonly TranslationKey[];

/** Map 1–10 mood value to frequency index (MoodTracker scale). */
export function moodFrequencyIndex(value: number): number {
  return Math.min(Math.max(Math.round(value) - 1, 0), MOOD_FREQUENCY_KEYS.length - 1);
}
