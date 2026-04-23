/**
 * Archetype Profile Snapshot service.
 * Append-only versioned snapshots of a user's archetype profile.
 */

import { supabase } from "@/integrations/supabase/client";
import { ARCHETYPES } from "../domain/archetypes";
import type {
  AnalysisResult,
  ArchetypeKey,
  DimensionKey,
  ShadowKey,
} from "../domain/types";

const TABLE = "archetype_profile_snapshots";

export type SnapshotTrigger =
  | "core_assessment"
  | "appendix_completed"
  | "manual_refresh";

export type DominantBody = "physical" | "energetic" | "spiritual";

export interface SnapshotTopArchetype {
  key: ArchetypeKey;
  name_fr: string;
  name_en: string;
  score: number;
  rank: number;
}

export interface ArchetypeProfileSnapshot {
  id: string;
  user_id: string;
  session_id: string | null;
  snapshot_version: number;
  trigger_event: SnapshotTrigger;
  top_archetypes: SnapshotTopArchetype[];
  all_scores: Record<ArchetypeKey, number>;
  shadow_scores: Record<ShadowKey, number>;
  dimension_scores: Record<DimensionKey, number>;
  dominant_body: DominantBody | null;
  active_principle: string | null;
  admin_notes: string | null;
  computed_at: string;
}

export interface SnapshotArchetypeDelta {
  key: ArchetypeKey;
  name_fr: string;
  name_en: string;
  scoreA: number;
  scoreB: number;
  delta: number;
}

export interface SnapshotDelta {
  snapshotA: ArchetypeProfileSnapshot;
  snapshotB: ArchetypeProfileSnapshot;
  archetypeDeltas: SnapshotArchetypeDelta[];
  shadowDeltas: Array<{ key: ShadowKey; scoreA: number; scoreB: number; delta: number }>;
  topGain: SnapshotArchetypeDelta | null;
  topLoss: SnapshotArchetypeDelta | null;
}

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                           */
/* -------------------------------------------------------------------------- */

function rowToSnapshot(row: Record<string, unknown>): ArchetypeProfileSnapshot {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    session_id: (row.session_id as string | null) ?? null,
    snapshot_version: Number(row.snapshot_version ?? 1),
    trigger_event: row.trigger_event as SnapshotTrigger,
    top_archetypes: (row.top_archetypes as SnapshotTopArchetype[]) ?? [],
    all_scores: (row.all_scores as Record<ArchetypeKey, number>) ?? ({} as Record<ArchetypeKey, number>),
    shadow_scores: (row.shadow_scores as Record<ShadowKey, number>) ?? ({} as Record<ShadowKey, number>),
    dimension_scores: (row.dimension_scores as Record<DimensionKey, number>) ?? {},
    dominant_body: (row.dominant_body as DominantBody | null) ?? null,
    active_principle: (row.active_principle as string | null) ?? null,
    admin_notes: (row.admin_notes as string | null) ?? null,
    computed_at: row.computed_at as string,
  };
}

async function getNextVersion(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from(TABLE as never)
    .select("snapshot_version")
    .eq("user_id", userId)
    .order("snapshot_version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const row = data as { snapshot_version?: number } | null;
  return (row?.snapshot_version ?? 0) + 1;
}

function buildTopArchetypes(analysis: AnalysisResult): SnapshotTopArchetype[] {
  return analysis.rankedScores.slice(0, 3).map((s) => {
    const def = ARCHETYPES.find((a) => a.key === s.key);
    return {
      key: s.key,
      name_fr: def?.name_fr ?? s.key,
      name_en: def?.name_en ?? s.key,
      score: Math.round(s.score * 100) / 100,
      rank: s.rank,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export interface CreateSnapshotOptions {
  userId: string;
  sessionId?: string | null;
  triggerEvent: SnapshotTrigger;
  analysisResult: AnalysisResult;
  dominantBody?: DominantBody | null;
  activePrinciple?: string | null;
}

export async function createSnapshot(
  opts: CreateSnapshotOptions,
): Promise<ArchetypeProfileSnapshot> {
  const version = await getNextVersion(opts.userId);

  const payload = {
    user_id: opts.userId,
    session_id: opts.sessionId ?? null,
    snapshot_version: version,
    trigger_event: opts.triggerEvent,
    top_archetypes: buildTopArchetypes(opts.analysisResult),
    all_scores: opts.analysisResult.normalizedScores,
    shadow_scores: opts.analysisResult.shadowSignals,
    dimension_scores: opts.analysisResult.dimensionScores,
    dominant_body: opts.dominantBody ?? null,
    active_principle: opts.activePrinciple ?? null,
  };

  const { data, error } = await supabase
    .from(TABLE as never)
    .insert(payload as never)
    .select()
    .single();
  if (error) throw error;
  return rowToSnapshot(data as Record<string, unknown>);
}

export async function getSnapshotHistory(
  userId: string,
): Promise<ArchetypeProfileSnapshot[]> {
  const { data, error } = await supabase
    .from(TABLE as never)
    .select("*")
    .eq("user_id", userId)
    .order("computed_at", { ascending: false });
  if (error) throw error;
  return ((data as Record<string, unknown>[]) ?? []).map(rowToSnapshot);
}

export async function getLatestSnapshot(
  userId: string,
): Promise<ArchetypeProfileSnapshot | null> {
  const { data, error } = await supabase
    .from(TABLE as never)
    .select("*")
    .eq("user_id", userId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSnapshot(data as Record<string, unknown>) : null;
}

async function fetchSnapshot(id: string): Promise<ArchetypeProfileSnapshot> {
  const { data, error } = await supabase
    .from(TABLE as never)
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return rowToSnapshot(data as Record<string, unknown>);
}

export async function compareSnapshots(
  snapshotAId: string,
  snapshotBId: string,
): Promise<SnapshotDelta> {
  const [a, b] = await Promise.all([
    fetchSnapshot(snapshotAId),
    fetchSnapshot(snapshotBId),
  ]);

  const archetypeKeys = Array.from(
    new Set<ArchetypeKey>([
      ...(Object.keys(a.all_scores) as ArchetypeKey[]),
      ...(Object.keys(b.all_scores) as ArchetypeKey[]),
    ]),
  );

  const archetypeDeltas: SnapshotArchetypeDelta[] = archetypeKeys.map((key) => {
    const def = ARCHETYPES.find((arc) => arc.key === key);
    const scoreA = Number(a.all_scores[key] ?? 0);
    const scoreB = Number(b.all_scores[key] ?? 0);
    return {
      key,
      name_fr: def?.name_fr ?? key,
      name_en: def?.name_en ?? key,
      scoreA: Math.round(scoreA * 100) / 100,
      scoreB: Math.round(scoreB * 100) / 100,
      delta: Math.round((scoreB - scoreA) * 100) / 100,
    };
  });

  const shadowKeys = Array.from(
    new Set<ShadowKey>([
      ...(Object.keys(a.shadow_scores) as ShadowKey[]),
      ...(Object.keys(b.shadow_scores) as ShadowKey[]),
    ]),
  );

  const shadowDeltas = shadowKeys.map((key) => {
    const scoreA = Number(a.shadow_scores[key] ?? 0);
    const scoreB = Number(b.shadow_scores[key] ?? 0);
    return {
      key,
      scoreA: Math.round(scoreA * 100) / 100,
      scoreB: Math.round(scoreB * 100) / 100,
      delta: Math.round((scoreB - scoreA) * 100) / 100,
    };
  });

  const sortedByDelta = [...archetypeDeltas].sort((x, y) => y.delta - x.delta);
  const topGain = sortedByDelta[0]?.delta > 0 ? sortedByDelta[0] : null;
  const topLoss =
    sortedByDelta[sortedByDelta.length - 1]?.delta < 0
      ? sortedByDelta[sortedByDelta.length - 1]
      : null;

  return {
    snapshotA: a,
    snapshotB: b,
    archetypeDeltas,
    shadowDeltas,
    topGain,
    topLoss,
  };
}
