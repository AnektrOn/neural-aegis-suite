import type { TrackingQuestionOption } from "../domain/types";

/** Normalise options from DB (jsonb array or accidental string). */
export function parseTrackingQuestionOptions(raw: unknown): TrackingQuestionOption[] {
  if (Array.isArray(raw)) return raw as TrackingQuestionOption[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as TrackingQuestionOption[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}
