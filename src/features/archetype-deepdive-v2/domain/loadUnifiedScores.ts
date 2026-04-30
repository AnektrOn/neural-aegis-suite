/**
 * Unified loader: aggregates Deep Dive (70q) + legacy assessment (30q) responses
 * into a single DeepDiveResult per user.
 *
 * - deepdive_responses : keyed by stable codes, scored via QUESTIONS_70.
 * - assessment_responses : keyed by uuid, scored via assessment_options weights
 *   (archetype_weights / shadow_weights JSON columns).
 */
import { supabase } from "@/integrations/supabase/client";
import {
  computeDeepDiveScores,
  type DeepDiveResult,
  type RawAnswer,
} from "./computeDeepDiveScores";
import { QUESTIONS_70 } from "./questions70";
import { HOUSES, type AnyArchetypeKey } from "./types";

interface PreWeighted {
  archetype: AnyArchetypeKey;
  polarity: "light" | "shadow";
  weight: number;
  house?: number;
}

/** Compute a DeepDiveResult from raw 70q answers + pre-weighted legacy contributions. */
function computeMixed(
  rawAnswers: RawAnswer[],
  legacy: PreWeighted[],
  legacyAnsweredQuestions: number,
  legacyTotalQuestions: number,
): DeepDiveResult {
  // Start from the canonical 70q computation (handles the houses cleanly).
  const base = computeDeepDiveScores(rawAnswers);

  // Aggregate legacy contributions on top.
  const lightByArch = new Map<AnyArchetypeKey, number>();
  const shadowByArch = new Map<AnyArchetypeKey, number>();
  for (const a of base.archetypes) {
    lightByArch.set(a.archetype, a.light);
    shadowByArch.set(a.archetype, a.shadow);
  }

  const houseMap = new Map(base.houses.map((h) => [h.house, h]));

  for (const w of legacy) {
    const bag = w.polarity === "light" ? lightByArch : shadowByArch;
    bag.set(w.archetype, (bag.get(w.archetype) ?? 0) + w.weight);

    if (w.house) {
      const h = houseMap.get(w.house);
      if (h) {
        const hb = h.archetypeBreakdown[w.archetype] ?? { light: 0, shadow: 0 };
        if (w.polarity === "light") hb.light += w.weight;
        else hb.shadow += w.weight;
        h.archetypeBreakdown[w.archetype] = hb;
      }
    }
  }

  // Re-derive top archetype per house
  for (const h of houseMap.values()) {
    let topArch: AnyArchetypeKey | null = null;
    let topW = 0;
    for (const [arch, vals] of Object.entries(h.archetypeBreakdown)) {
      const sum = vals.light + vals.shadow;
      if (sum > topW) {
        topW = sum;
        topArch = arch as AnyArchetypeKey;
      }
    }
    h.topArchetype = topArch;
    h.topArchetypeWeight = topW;
  }

  // Rebuild archetype scores
  const allKeys = new Set<AnyArchetypeKey>([
    ...lightByArch.keys(),
    ...shadowByArch.keys(),
  ]);
  const totalLight = [...lightByArch.values()].reduce((s, v) => s + v, 0);
  const totalShadow = [...shadowByArch.values()].reduce((s, v) => s + v, 0);

  let archetypes = [...allKeys].map((k) => {
    const light = lightByArch.get(k) ?? 0;
    const shadow = shadowByArch.get(k) ?? 0;
    return {
      archetype: k,
      light,
      shadow,
      total: light + shadow,
      lightPct: totalLight > 0 ? (light / totalLight) * 100 : 0,
      shadowPct: totalShadow > 0 ? (shadow / totalShadow) * 100 : 0,
      intensity: 0,
      net: light - shadow,
    };
  });

  const maxTotal = archetypes.reduce((m, a) => Math.max(m, a.total), 0);
  archetypes = archetypes
    .map((a) => ({ ...a, intensity: maxTotal > 0 ? a.total / maxTotal : 0 }))
    .sort((a, b) => b.total - a.total);

  const totalQuestions = base.totalQuestions + legacyTotalQuestions;
  const answeredCount = base.answeredCount + legacyAnsweredQuestions;

  return {
    totalQuestions,
    answeredCount,
    completionPct: totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0,
    archetypes,
    topThree: archetypes.slice(0, 3).map((a) => a.archetype),
    shadowAlerts: archetypes
      .filter((a) => a.shadow > a.light && a.shadow > 0)
      .map((a) => a.archetype),
    houses: HOUSES.map((meta) => houseMap.get(meta.number)!).filter(Boolean),
    computedAt: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Loaders                                                                     */
/* -------------------------------------------------------------------------- */

interface LegacyOption {
  id: string;
  question_id: string;
  archetype_weights: Record<string, number> | null;
  shadow_weights: Record<string, number> | null;
}
interface LegacyQuestion {
  id: string;
  house: number | null;
}

let legacyCache: {
  optionsById: Map<string, LegacyOption>;
  questionsById: Map<string, LegacyQuestion>;
  totalQuestions: number;
} | null = null;

async function loadLegacyMeta() {
  if (legacyCache) return legacyCache;
  const [opts, qs] = await Promise.all([
    supabase
      .from("assessment_options")
      .select("id, question_id, archetype_weights, shadow_weights"),
    supabase.from("assessment_questions").select("id, house"),
  ]);
  if (opts.error) throw opts.error;
  if (qs.error) throw qs.error;

  const optionsById = new Map<string, LegacyOption>();
  for (const o of (opts.data ?? []) as any[]) optionsById.set(o.id, o);

  const questionsById = new Map<string, LegacyQuestion>();
  for (const q of (qs.data ?? []) as any[]) questionsById.set(q.id, q);

  legacyCache = {
    optionsById,
    questionsById,
    totalQuestions: questionsById.size,
  };
  return legacyCache;
}

function legacyResponseToWeights(
  selected_option_ids: string[],
  meta: NonNullable<typeof legacyCache>,
): { weights: PreWeighted[]; house: number | undefined } {
  const out: PreWeighted[] = [];
  let house: number | undefined;
  for (const optId of selected_option_ids ?? []) {
    const opt = meta.optionsById.get(optId);
    if (!opt) continue;
    const q = meta.questionsById.get(opt.question_id);
    if (q?.house) house = q.house;
    for (const [arch, w] of Object.entries(opt.archetype_weights ?? {})) {
      if (typeof w === "number" && w > 0) {
        out.push({
          archetype: arch as AnyArchetypeKey,
          polarity: "light",
          weight: w,
          house: q?.house ?? undefined,
        });
      }
    }
    for (const [arch, w] of Object.entries(opt.shadow_weights ?? {})) {
      if (typeof w === "number" && w > 0) {
        out.push({
          archetype: arch as AnyArchetypeKey,
          polarity: "shadow",
          weight: w,
          house: q?.house ?? undefined,
        });
      }
    }
  }
  return { weights: out, house };
}

/** Load and compute unified result for a single user. */
export async function loadUnifiedDeepDiveResult(
  userId: string,
): Promise<DeepDiveResult> {
  const [ddRes, asRes, meta] = await Promise.all([
    supabase
      .from("deepdive_responses" as any)
      .select("question_code, option_codes")
      .eq("user_id", userId),
    supabase
      .from("assessment_responses")
      .select("question_id, selected_option_ids")
      .eq("user_id", userId),
    loadLegacyMeta(),
  ]);

  if (ddRes.error) throw ddRes.error;
  if (asRes.error) throw asRes.error;

  const rawAnswers: RawAnswer[] = ((ddRes.data ?? []) as any[]).map((r) => ({
    question_code: r.question_code,
    option_codes: r.option_codes ?? [],
  }));

  const legacyWeights: PreWeighted[] = [];
  const legacyAnsweredQids = new Set<string>();
  for (const r of (asRes.data ?? []) as any[]) {
    if (!r.selected_option_ids || r.selected_option_ids.length === 0) continue;
    legacyAnsweredQids.add(r.question_id);
    const { weights } = legacyResponseToWeights(r.selected_option_ids, meta);
    legacyWeights.push(...weights);
  }

  return computeMixed(
    rawAnswers,
    legacyWeights,
    legacyAnsweredQids.size,
    meta.totalQuestions,
  );
}

/** Load unified results for ALL users that have at least one response. */
export async function loadUnifiedDeepDiveResultsForAllUsers(): Promise<
  Map<string, DeepDiveResult>
> {
  const [ddRes, asRes, meta] = await Promise.all([
    supabase
      .from("deepdive_responses" as any)
      .select("user_id, question_code, option_codes"),
    supabase
      .from("assessment_responses")
      .select("user_id, question_id, selected_option_ids"),
    loadLegacyMeta(),
  ]);
  if (ddRes.error) throw ddRes.error;
  if (asRes.error) throw asRes.error;

  const ddByUser = new Map<string, RawAnswer[]>();
  for (const r of (ddRes.data ?? []) as any[]) {
    const list = ddByUser.get(r.user_id) ?? [];
    list.push({ question_code: r.question_code, option_codes: r.option_codes ?? [] });
    ddByUser.set(r.user_id, list);
  }

  const legacyByUser = new Map<
    string,
    { weights: PreWeighted[]; answered: Set<string> }
  >();
  for (const r of (asRes.data ?? []) as any[]) {
    if (!r.selected_option_ids || r.selected_option_ids.length === 0) continue;
    const entry = legacyByUser.get(r.user_id) ?? {
      weights: [],
      answered: new Set<string>(),
    };
    entry.answered.add(r.question_id);
    const { weights } = legacyResponseToWeights(r.selected_option_ids, meta);
    entry.weights.push(...weights);
    legacyByUser.set(r.user_id, entry);
  }

  const userIds = new Set<string>([
    ...ddByUser.keys(),
    ...legacyByUser.keys(),
  ]);

  const out = new Map<string, DeepDiveResult>();
  for (const uid of userIds) {
    const raw = ddByUser.get(uid) ?? [];
    const legacy = legacyByUser.get(uid);
    out.set(
      uid,
      computeMixed(
        raw,
        legacy?.weights ?? [],
        legacy?.answered.size ?? 0,
        meta.totalQuestions,
      ),
    );
  }
  return out;
}

// QUESTIONS_70 import kept for ts; not strictly needed here but ensures the
// types module is loaded so house metadata stays in sync.
void QUESTIONS_70;
