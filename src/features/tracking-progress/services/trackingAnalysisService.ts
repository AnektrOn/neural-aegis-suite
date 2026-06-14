/**
 * Tracking Analysis Service
 *
 * Orchestrates the end-to-end evolution snapshot generation:
 *   1. Load baseline from Deep Dive (70Q + 30Q unified)
 *   2. Load 2-week tracking responses
 *   3. Compute delta (computeTrackingEvolution)
 *   4. Build narrative
 *   5. Persist tracking_progress_snapshots
 */

import { supabase } from "@/integrations/supabase/client";
import { loadUnifiedDeepDiveResult } from "@/features/archetype-deepdive-v2/domain/loadUnifiedScores";
import { loadResponsesInRange } from "./trackingDailyService";
import { loadPerspectiveBySlug } from "./trackingQuestionService";
import {
  computeTrackingEvolution,
  extractBaselineScores,
} from "../domain/computeTrackingEvolution";
import type {
  TrackingProgressSnapshot,
  TrackingEvolutionResult,
  ArchetypeScoresMap,
  ArchetypeDelta,
} from "../domain/types";
import type { AnyArchetypeKey } from "@/features/archetype-deepdive-v2/domain/types";

// ---------------------------------------------------------------------------
// Narrative generation (deterministic)
// ---------------------------------------------------------------------------

const ARCHETYPE_NAME_FR: Partial<Record<AnyArchetypeKey, string>> = {
  sovereign: "Souverain", warrior: "Guerrier", lover: "Amant",
  caregiver: "Gardien", creator: "Créateur", explorer: "Explorateur",
  rebel: "Rebelle", sage: "Sage", mystic: "Mystique",
  healer: "Guérisseur", magician: "Magicien", jester: "Bouffon",
  child: "Enfant", victim: "Victime", saboteur: "Saboteur", prostitute: "Prostituée",
};

const ARCHETYPE_NAME_EN: Partial<Record<AnyArchetypeKey, string>> = {
  sovereign: "Sovereign", warrior: "Warrior", lover: "Lover",
  caregiver: "Caregiver", creator: "Creator", explorer: "Explorer",
  rebel: "Rebel", sage: "Sage", mystic: "Mystic",
  healer: "Healer", magician: "Magician", jester: "Jester",
  child: "Child", victim: "Victim", saboteur: "Saboteur", prostitute: "Prostitute",
};

function archetypeName(arch: AnyArchetypeKey, locale: "fr" | "en"): string {
  const map = locale === "fr" ? ARCHETYPE_NAME_FR : ARCHETYPE_NAME_EN;
  return map[arch] ?? arch;
}

function buildNarrative(evolution: TrackingEvolutionResult, locale: "fr" | "en"): string {
  const { strongestShift, narrative_cues, archetypeDelta, responseCount } = evolution;

  if (responseCount === 0) {
    return locale === "fr"
      ? "Aucune réponse collectée sur cette période. Continuez votre check-in quotidien pour générer un rapport d'évolution."
      : "No responses collected for this period. Continue your daily check-in to generate an evolution report.";
  }

  const parts: string[] = [];

  if (locale === "fr") {
    parts.push(`Sur ${responseCount} réponse${responseCount > 1 ? "s" : ""} collectée${responseCount > 1 ? "s" : ""} sur cette période :`);

    if (strongestShift) {
      const delta = archetypeDelta[0];
      const dir = delta?.direction === "up" ? "renforcé" : delta?.direction === "down" ? "atténué" : "stable";
      parts.push(`L'archétype ${archetypeName(strongestShift, "fr")} a été le plus ${dir}.`);
    }

    if (narrative_cues.top_gains.length > 0) {
      const names = narrative_cues.top_gains.map((a) => archetypeName(a, "fr")).join(", ");
      parts.push(`Progression lumière notable : ${names}.`);
    }

    if (narrative_cues.shadow_warnings.length > 0) {
      const names = narrative_cues.shadow_warnings.map((a) => archetypeName(a, "fr")).join(", ");
      parts.push(`Points de vigilance ombre : ${names}. Ces archétypes expriment davantage leur pôle ombre sur cette période.`);
    }

    if (narrative_cues.top_gains.length === 0 && narrative_cues.shadow_warnings.length === 0) {
      parts.push("Votre profil archétypal reste stable sur cette période — un signe de continuité dans votre processus.");
    }
  } else {
    parts.push(`Based on ${responseCount} response${responseCount > 1 ? "s" : ""} collected this period:`);

    if (strongestShift) {
      const delta = archetypeDelta[0];
      const dir = delta?.direction === "up" ? "strengthened" : delta?.direction === "down" ? "softened" : "stable";
      parts.push(`The ${archetypeName(strongestShift, "en")} archetype has been most ${dir}.`);
    }

    if (narrative_cues.top_gains.length > 0) {
      const names = narrative_cues.top_gains.map((a) => archetypeName(a, "en")).join(", ");
      parts.push(`Notable light growth: ${names}.`);
    }

    if (narrative_cues.shadow_warnings.length > 0) {
      const names = narrative_cues.shadow_warnings.map((a) => archetypeName(a, "en")).join(", ");
      parts.push(`Shadow watch points: ${names}. These archetypes show more shadow expression this period.`);
    }

    if (narrative_cues.top_gains.length === 0 && narrative_cues.shadow_warnings.length === 0) {
      parts.push("Your archetypal profile remains stable this period — a sign of continuity in your process.");
    }
  }

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Main: generate a snapshot for a user × perspective
// ---------------------------------------------------------------------------

export interface GenerateSnapshotOptions {
  userId: string;
  perspectiveSlug?: string;
  /** Override period end (defaults to today). */
  periodEnd?: string;
  /** Override window in days (defaults to 14). */
  windowDays?: number;
  /** Admin user ID (stored as generated_by). */
  generatedBy?: string;
}

export interface GenerateSnapshotResult {
  success: boolean;
  snapshot?: TrackingProgressSnapshot;
  error?: string;
  responseCount: number;
  hasBaseline: boolean;
}

export async function generateEvolutionSnapshot(
  opts: GenerateSnapshotOptions,
): Promise<GenerateSnapshotResult> {
  const {
    userId,
    perspectiveSlug = "myss-archetype",
    periodEnd = new Date().toISOString().split("T")[0],
    windowDays = 14,
    generatedBy,
  } = opts;

  const periodStart = new Date(
    new Date(periodEnd).getTime() - windowDays * 86400000,
  ).toISOString().split("T")[0];

  // 1. Load perspective
  const perspective = await loadPerspectiveBySlug(perspectiveSlug);
  if (!perspective) {
    return { success: false, error: `Perspective "${perspectiveSlug}" not found`, responseCount: 0, hasBaseline: false };
  }

  // 2. Load baseline (Deep Dive unified)
  let baselineResult;
  try {
    baselineResult = await loadUnifiedDeepDiveResult(userId);
  } catch (err) {
    return {
      success: false,
      error: `Failed to load baseline: ${err instanceof Error ? err.message : String(err)}`,
      responseCount: 0,
      hasBaseline: false,
    };
  }

  if (baselineResult.answeredCount === 0) {
    return {
      success: false,
      error: "User has no Deep Dive responses for baseline computation",
      responseCount: 0,
      hasBaseline: false,
    };
  }

  // 3. Load tracking responses in the period
  const responses = await loadResponsesInRange(
    userId,
    perspective.id,
    periodStart,
    periodEnd,
  );

  // 4. Compute evolution
  const evolution = computeTrackingEvolution(baselineResult, responses);

  // 5. Build narratives
  const narrativeFr = buildNarrative(evolution, "fr");
  const narrativeEn = buildNarrative(evolution, "en");

  // 6. Build delta record (keyed by archetype)
  const deltaRecord: Record<string, Omit<ArchetypeDelta, "archetype">> = {};
  for (const d of evolution.archetypeDelta) {
    deltaRecord[d.archetype] = {
      light_delta:  d.light_delta,
      shadow_delta: d.shadow_delta,
      net_delta:    d.net_delta,
      direction:    d.direction,
      magnitude:    d.magnitude,
    };
  }

  // 7. Persist snapshot (upsert by user × perspective × period)
  const row = {
    user_id:          userId,
    perspective_id:   perspective.id,
    period_start:     periodStart,
    period_end:       periodEnd,
    baseline_scores:  JSON.stringify(evolution.baselineScores),
    tracking_scores:  JSON.stringify(evolution.trackingScores),
    delta:            JSON.stringify(deltaRecord),
    strongest_shift:  evolution.strongestShift,
    response_count:   evolution.responseCount,
    narrative_fr:     narrativeFr,
    narrative_en:     narrativeEn,
    generated_by:     generatedBy ?? null,
    generated_at:     new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("tracking_progress_snapshots" as any)
    .upsert(row, { onConflict: "user_id,perspective_id,period_end" })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: `Failed to save snapshot: ${error.message}`,
      responseCount: evolution.responseCount,
      hasBaseline: true,
    };
  }

  return {
    success: true,
    snapshot: data as unknown as TrackingProgressSnapshot,
    responseCount: evolution.responseCount,
    hasBaseline: true,
  };
}

// ---------------------------------------------------------------------------
// Load snapshots for a user
// ---------------------------------------------------------------------------

export async function loadProgressSnapshots(
  userId: string,
  perspectiveSlug = "myss-archetype",
): Promise<TrackingProgressSnapshot[]> {
  const perspective = await loadPerspectiveBySlug(perspectiveSlug);
  if (!perspective) return [];

  const { data, error } = await supabase
    .from("tracking_progress_snapshots" as any)
    .select("*")
    .eq("user_id", userId)
    .eq("perspective_id", perspective.id)
    .order("generated_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as any[]).map((s) => ({
    ...s,
    baseline_scores: typeof s.baseline_scores === "string"
      ? JSON.parse(s.baseline_scores)
      : (s.baseline_scores ?? {}),
    tracking_scores: typeof s.tracking_scores === "string"
      ? JSON.parse(s.tracking_scores)
      : (s.tracking_scores ?? {}),
    delta: typeof s.delta === "string"
      ? JSON.parse(s.delta)
      : (s.delta ?? {}),
  })) as TrackingProgressSnapshot[];
}

// ---------------------------------------------------------------------------
// Admin: load snapshots for all users (for admin hub)
// ---------------------------------------------------------------------------

export async function loadAllSnapshotsAdmin(
  perspectiveSlug = "myss-archetype",
): Promise<Array<TrackingProgressSnapshot & { display_name?: string }>> {
  const perspective = await loadPerspectiveBySlug(perspectiveSlug);
  if (!perspective) return [];

  const { data, error } = await supabase
    .from("tracking_progress_snapshots" as any)
    .select("*, profiles!tracking_progress_snapshots_user_id_fkey(display_name)")
    .eq("perspective_id", perspective.id)
    .order("generated_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as any[]).map((s) => ({
    ...s,
    display_name: s.profiles?.display_name ?? null,
    baseline_scores: typeof s.baseline_scores === "string"
      ? JSON.parse(s.baseline_scores)
      : (s.baseline_scores ?? {}),
    tracking_scores: typeof s.tracking_scores === "string"
      ? JSON.parse(s.tracking_scores)
      : (s.tracking_scores ?? {}),
    delta: typeof s.delta === "string"
      ? JSON.parse(s.delta)
      : (s.delta ?? {}),
  }));
}
