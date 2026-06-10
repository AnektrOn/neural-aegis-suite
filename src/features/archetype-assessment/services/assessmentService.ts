/**
 * Service layer for the archetype assessment.
 * No UI imports here. All Supabase calls live in this file.
 */

import { supabase } from "@/integrations/supabase/client";
import { ARCHETYPES } from "../domain/archetypes";
import { QUESTIONS } from "../domain/questions";
import {
  buildAnalysisResult,
  computeCompletionConfidence,
  detectConsistencyWarning,
} from "../domain/scoringEngine";
import { selectTopTools } from "../domain/recommendationEngine";
import {
  createSnapshot,
  getSnapshotById,
  getSnapshotHistory,
  type ArchetypeProfileSnapshot,
} from "./snapshotService";
import { loadUnifiedDeepDiveResult } from "@/features/archetype-deepdive-v2/domain/loadUnifiedScores";
import type {
  AnalysisResult,
  ArchetypeKey,
  ResponseValue,
  RuntimeQuestion,
} from "../domain/types";

const TEMPLATE_SLUG = "archetype-v1";

/**
 * Bump this whenever the scoring algorithm (weights, normalization, shadows)
 * changes. Stored on each appendix_response so historical answers can be
 * recomputed under the version they were captured with.
 */
export const SCORE_VERSION = 1;

/** Refreshes the materialized view aggregating selected option weights. */
async function refreshArchetypeScoresView(): Promise<void> {
  try {
    await supabase.rpc("refresh_archetype_scores_by_user" as any);
  } catch (e) {
    // Non-blocking — view refresh failure must not break submission.
    console.warn("refresh_archetype_scores_by_user failed", e);
  }
}

interface TemplateRow {
  id: string;
  slug: string;
  version: number;
  title_fr: string;
  title_en: string;
  description_fr: string | null;
  description_en: string | null;
  is_active: boolean;
}

export interface LoadedTemplate {
  template: TemplateRow;
  questions: RuntimeQuestion[];
}

/* -------------------------------------------------------------------------- */
/* Template & questions                                                       */
/* -------------------------------------------------------------------------- */

async function loadTemplateBySlug(slug: string): Promise<LoadedTemplate> {
  const { data: tpl, error: tplErr } = await supabase
    .from("assessment_templates" as any)
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (tplErr) throw tplErr;
  if (!tpl) throw new Error(`No active assessment template found for slug "${slug}"`);

  const template = tpl as unknown as TemplateRow;

  let questions = await fetchQuestions(template.id);

  if (questions.length === 0) {
    await seedQuestions(template.id);
    questions = await fetchQuestions(template.id);
  }

  return { template, questions };
}

/** Load active template + its questions/options. Seeds questions/options on first call. */
export async function loadActiveTemplate(): Promise<LoadedTemplate> {
  const { data: tpl, error: tplErr } = await supabase
    .from("assessment_templates" as any)
    .select("*")
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tplErr) throw tplErr;
  if (!tpl) throw new Error("No active assessment template found");

  const template = tpl as unknown as TemplateRow;

  let questions = await fetchQuestions(template.id);

  if (questions.length === 0) {
    await seedQuestions(template.id);
    questions = await fetchQuestions(template.id);
  }

  return { template, questions };
}

/** Guest / public funnel: core onboarding quiz only (30 questions, not Deep Dive 70). */
export const GUEST_QUIZ_QUESTION_LIMIT = 30;

export async function loadGuestQuizTemplate(): Promise<LoadedTemplate> {
  const loaded = await loadTemplateBySlug(TEMPLATE_SLUG);
  const core = loaded.questions
    .filter((q) => q.is_required !== false)
    .filter((q) => (q.meta as { is_appendix?: boolean } | undefined)?.is_appendix !== true)
    .slice(0, GUEST_QUIZ_QUESTION_LIMIT);
  return { ...loaded, questions: core };
}

async function fetchQuestions(
  templateId: string,
  opts: { appendix?: boolean } = {}
): Promise<RuntimeQuestion[]> {
  const { data: qs, error: qErr } = await supabase
    .from("assessment_questions" as any)
    .select("*")
    .eq("template_id", templateId)
    .order("position", { ascending: true });
  if (qErr) throw qErr;
  if (!qs || qs.length === 0) return [];

  // Filter by appendix flag stored in meta JSON
  const wantAppendix = opts.appendix === true;
  const filtered = (qs as any[]).filter((q) => {
    const isApp = q?.meta?.is_appendix === true;
    return wantAppendix ? isApp : !isApp;
  });
  if (filtered.length === 0) return [];

  const qIds = filtered.map((q) => q.id);
  const { data: opts2, error: oErr } = await supabase
    .from("assessment_options" as any)
    .select("*")
    .in("question_id", qIds)
    .order("position", { ascending: true });
  if (oErr) throw oErr;

  const optsByQ = new Map<string, any[]>();
  for (const o of (opts2 as any[]) ?? []) {
    const arr = optsByQ.get(o.question_id) ?? [];
    arr.push(o);
    optsByQ.set(o.question_id, arr);
  }

  return filtered.map((q) => ({
    id: q.id,
    position: q.position,
    question_type: q.question_type,
    prompt_fr: q.prompt_fr,
    prompt_en: q.prompt_en,
    helper_fr: q.helper_fr,
    helper_en: q.helper_en,
    dimension: q.dimension,
    is_required: q.is_required,
    meta: q.meta ?? {},
    options: (optsByQ.get(q.id) ?? []).map((o) => ({
      id: o.id,
      position: o.position,
      label_fr: o.label_fr,
      label_en: o.label_en,
      archetype_weights: o.archetype_weights ?? {},
      shadow_weights: o.shadow_weights ?? {},
      value: o.value,
    })),
  }));
}

async function seedQuestions(templateId: string): Promise<void> {
  for (const q of QUESTIONS) {
    const meta = { ...(q.meta ?? {}) } as Record<string, unknown>;
    if (q.isAppendix) meta.is_appendix = true;

    const { data: inserted, error: qErr } = await supabase
      .from("assessment_questions" as any)
      .insert({
        template_id: templateId,
        position: q.position,
        question_type: q.type,
        prompt_fr: q.prompt_fr,
        prompt_en: q.prompt_en,
        helper_fr: q.helper_fr ?? null,
        helper_en: q.helper_en ?? null,
        dimension: q.dimension ?? null,
        is_required: q.isRequired ?? true,
        meta,
      })
      .select("id")
      .single();
    if (qErr) throw qErr;

    const questionId = (inserted as any).id;
    if (q.options && q.options.length > 0) {
      const payload = q.options.map((o) => ({
        question_id: questionId,
        position: o.position,
        label_fr: o.label_fr,
        label_en: o.label_en,
        archetype_weights: o.archetypeWeights ?? {},
        shadow_weights: o.shadowWeights ?? {},
        value: o.value ?? null,
      }));
      const { error: oErr } = await supabase
        .from("assessment_options" as any)
        .insert(payload);
      if (oErr) throw oErr;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Appendix questions (loaded on demand from Profile)                         */
/* -------------------------------------------------------------------------- */

export async function loadAppendixQuestions(): Promise<RuntimeQuestion[]> {
  const { data: tpl, error: tplErr } = await supabase
    .from("assessment_templates" as any)
    .select("id")
    .eq("slug", TEMPLATE_SLUG)
    .eq("is_active", true)
    .maybeSingle();
  if (tplErr) throw tplErr;
  if (!tpl) throw new Error("No active assessment template found");
  return fetchQuestions((tpl as any).id, { appendix: true });
}

export async function getLatestSessionId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("assessment_sessions" as any)
    .select("id")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as any)?.id ?? null;
}

export async function submitAppendixResponses(opts: {
  userId: string;
  sessionId: string;
  questions: RuntimeQuestion[];
  responses: ResponseValue[];
}): Promise<void> {
  const { userId, sessionId, questions, responses } = opts;

  // 1. Persist new appendix responses
  if (responses.length > 0) {
    const payload = responses.map((r) => ({
      session_id: sessionId,
      question_id: r.questionId,
      user_id: userId,
      selected_option_ids: r.selectedOptionIds ?? [],
      numeric_value: r.numericValue ?? null,
      text_value: r.textValue ?? null,
      raw_payload: r,
    }));
    const { error: rErr } = await supabase
      .from("assessment_responses" as any)
      .upsert(payload, { onConflict: "session_id,question_id" });
    if (rErr) throw rErr;
  }

  // 2. Reload ALL responses for this session (core + appendix)
  const { data: allResp, error: arErr } = await supabase
    .from("assessment_responses" as any)
    .select("*")
    .eq("session_id", sessionId);
  if (arErr) throw arErr;

  // 3. Reload ALL questions of the template (core + appendix)
  const { data: sessionRow, error: sErr } = await supabase
    .from("assessment_sessions" as any)
    .select("template_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (sErr) throw sErr;
  const templateId = (sessionRow as any)?.template_id;
  if (!templateId) throw new Error("Session has no template_id");

  const [coreQs, appendixQs] = await Promise.all([
    fetchQuestions(templateId, { appendix: false }),
    fetchQuestions(templateId, { appendix: true }),
  ]);
  const allQuestions = [...coreQs, ...appendixQs];

  const allResponses: ResponseValue[] = ((allResp as any[]) ?? []).map((r) => ({
    questionId: r.question_id,
    selectedOptionIds: r.selected_option_ids ?? [],
    numericValue: r.numeric_value ?? undefined,
    textValue: r.text_value ?? undefined,
  }));

  // 4. Recompute analysis on the full set
  const analysis = buildAnalysisResult(allQuestions, allResponses);
  const confidence = computeCompletionConfidence(allQuestions.length, allResponses);
  const consistency = detectConsistencyWarning(
    analysis.normalizedScores,
    analysis.shadowSignals
  );

  // 5. Upsert archetype_scores
  const scoreRows = analysis.rankedScores.map((s) => ({
    session_id: sessionId,
    user_id: userId,
    archetype_key: s.key,
    raw_score: analysis.rawScores[s.key] ?? 0,
    normalized_score: s.score,
    rank: s.rank,
  }));
  if (scoreRows.length > 0) {
    const { error: scErr } = await supabase
      .from("archetype_scores" as any)
      .upsert(scoreRows, { onConflict: "session_id,archetype_key" });
    if (scErr) throw scErr;
  }

  // 6. Upsert analysis_results
  const { error: aErr } = await supabase
    .from("analysis_results" as any)
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        top_archetypes: analysis.topArchetypes,
        dimension_scores: analysis.dimensionScores,
        shadow_signals: analysis.shadowSignals,
        strengths_fr: analysis.strengths_fr,
        strengths_en: analysis.strengths_en,
        watchouts_fr: analysis.watchouts_fr,
        watchouts_en: analysis.watchouts_en,
        summary_fr: analysis.summary_fr,
        summary_en: analysis.summary_en,
      },
      { onConflict: "session_id" }
    );
  if (aErr) throw aErr;

  // 7. Refresh confidence + consistency on the session
  const { data: prevSession } = await supabase
    .from("assessment_sessions" as any)
    .select("client_meta")
    .eq("id", sessionId)
    .maybeSingle();
  const prevMeta = ((prevSession as any)?.client_meta ?? {}) as Record<string, any>;
  const nextMeta: Record<string, any> = { ...prevMeta };
  if (consistency) {
    nextMeta.consistency_warning = true;
    nextMeta.conflicting_pair = consistency.conflicting_pair;
  } else {
    delete nextMeta.consistency_warning;
    delete nextMeta.conflicting_pair;
  }
  await supabase
    .from("assessment_sessions" as any)
    .update({ confidence_score: confidence, client_meta: nextMeta })
    .eq("id", sessionId);

  void refreshArchetypeScoresView();

  // Append-only profile snapshot (appendix completion)
  try {
    await createSnapshot({
      userId,
      sessionId,
      triggerEvent: "appendix_completed",
      analysisResult: analysis,
    });
  } catch (e) {
    console.warn("createSnapshot (appendix_completed) failed", e);
  }
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                   */
/* -------------------------------------------------------------------------- */

/** Tagged on admin “fast quiz” — must not override real user assessment results. */
export const SESSION_SOURCE_ADMIN_GUEST_PREVIEW = "admin_guest_preview";

export function isAdminGuestPreviewSession(session: {
  client_meta?: Record<string, unknown> | null;
}): boolean {
  return session.client_meta?.source === SESSION_SOURCE_ADMIN_GUEST_PREVIEW;
}

async function sessionIdsWithAdminAutoFill(sessionIds: string[]): Promise<Set<string>> {
  if (sessionIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from("assessment_responses" as any)
    .select("session_id")
    .in("session_id", sessionIds)
    .eq("text_value", "Admin auto-fill");
  if (error) throw error;
  return new Set(((data as { session_id: string }[]) ?? []).map((r) => r.session_id));
}

export async function createSession(
  userId: string,
  templateId: string,
  clientMeta?: Record<string, unknown>,
): Promise<string> {
  const { data, error } = await supabase
    .from("assessment_sessions" as any)
    .insert({
      user_id: userId,
      template_id: templateId,
      client_meta: clientMeta ?? {},
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as any).id;
}

export async function submitSession(opts: {
  userId: string;
  sessionId: string;
  questions: RuntimeQuestion[];
  responses: ResponseValue[];
  startedAt: number;
}): Promise<{ analysis: AnalysisResult }> {
  const { userId, sessionId, questions, responses, startedAt } = opts;

  // 1. Persist responses
  if (responses.length > 0) {
    const payload = responses.map((r) => ({
      session_id: sessionId,
      question_id: r.questionId,
      user_id: userId,
      selected_option_ids: r.selectedOptionIds ?? [],
      numeric_value: r.numericValue ?? null,
      text_value: r.textValue ?? null,
      raw_payload: r,
    }));
    const { error: rErr } = await supabase
      .from("assessment_responses" as any)
      .upsert(payload, { onConflict: "session_id,question_id" });
    if (rErr) throw rErr;
  }

  // 2. Compute analysis (pure)
  const analysis = buildAnalysisResult(questions, responses);
  const recos = selectTopTools(analysis, { limit: 6, lang: "fr" });

  // 2bis. Confidence + consistency
  const confidence = computeCompletionConfidence(questions.length, responses);
  const consistency = detectConsistencyWarning(
    analysis.normalizedScores,
    analysis.shadowSignals
  );

  // 3. Persist scores
  const scoreRows = analysis.rankedScores.map((s) => ({
    session_id: sessionId,
    user_id: userId,
    archetype_key: s.key,
    raw_score: analysis.rawScores[s.key] ?? 0,
    normalized_score: s.score,
    rank: s.rank,
  }));
  if (scoreRows.length > 0) {
    const { error: sErr } = await supabase
      .from("archetype_scores" as any)
      .upsert(scoreRows, { onConflict: "session_id,archetype_key" });
    if (sErr) throw sErr;
  }

  // 4. Persist analysis_result
  const { error: aErr } = await supabase
    .from("analysis_results" as any)
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        top_archetypes: analysis.topArchetypes,
        dimension_scores: analysis.dimensionScores,
        shadow_signals: analysis.shadowSignals,
        strengths_fr: analysis.strengths_fr,
        strengths_en: analysis.strengths_en,
        watchouts_fr: analysis.watchouts_fr,
        watchouts_en: analysis.watchouts_en,
        summary_fr: analysis.summary_fr,
        summary_en: analysis.summary_en,
      },
      { onConflict: "session_id" }
    );
  if (aErr) throw aErr;

  // 5. Persist recommendations
  if (recos.length > 0) {
    // wipe previous recos for idempotent submit
    await supabase
      .from("recommendation_tools" as any)
      .delete()
      .eq("session_id", sessionId);

    const recoRows = recos.map((r) => ({
      session_id: sessionId,
      user_id: userId,
      tool_key: r.toolKey,
      tool_type: r.type,
      title_fr: r.title_fr,
      title_en: r.title_en,
      duration_fr: r.duration_fr,
      duration_en: r.duration_en,
      rationale_fr: r.rationale_fr,
      rationale_en: r.rationale_en,
      rule_key: r.ruleKey ?? null,
      widget_key: r.widgetKey ?? null,
      rank: r.rank,
    }));
    const { error: rcErr } = await supabase
      .from("recommendation_tools" as any)
      .insert(recoRows);
    if (rcErr) throw rcErr;
  }

  // 6. Read existing client_meta then merge consistency flag
  const { data: prevSession } = await supabase
    .from("assessment_sessions" as any)
    .select("client_meta")
    .eq("id", sessionId)
    .maybeSingle();
  const prevMeta = ((prevSession as any)?.client_meta ?? {}) as Record<string, any>;
  const nextMeta: Record<string, any> = { ...prevMeta };
  if (consistency) {
    nextMeta.consistency_warning = true;
    nextMeta.conflicting_pair = consistency.conflicting_pair;
  } else {
    delete nextMeta.consistency_warning;
    delete nextMeta.conflicting_pair;
  }

  // 7. Mark session submitted (+ confidence + meta)
  const duration = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  const { error: upErr } = await supabase
    .from("assessment_sessions" as any)
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      duration_seconds: duration,
      confidence_score: confidence,
      client_meta: nextMeta,
    })
    .eq("id", sessionId);
  if (upErr) throw upErr;

  void refreshArchetypeScoresView();

  // Append-only profile snapshot (core assessment submission)
  try {
    await createSnapshot({
      userId,
      sessionId,
      triggerEvent: "core_assessment",
      analysisResult: analysis,
    });
  } catch (e) {
    console.warn("createSnapshot (core_assessment) failed", e);
  }

  return { analysis };
}

/* -------------------------------------------------------------------------- */
/* Read helpers (results page + admin)                                        */
/* -------------------------------------------------------------------------- */

/** Returns the previous submitted session (the one just before the latest), if any. */
export async function getPreviousSubmittedSessionForUser(
  userId: string,
  excludeSessionId?: string
) {
  let query = supabase
    .from("assessment_sessions" as any)
    .select("*")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(2);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data as any[]) ?? [];
  const filtered = excludeSessionId
    ? rows.filter((r) => r.id !== excludeSessionId)
    : rows.slice(1);
  return (filtered[0] as any) ?? null;
}

/** Fetch normalized archetype scores for a given session (for comparisons). */
export async function getSessionArchetypeScores(sessionId: string) {
  const { data, error } = await supabase
    .from("archetype_scores" as any)
    .select("archetype_key, normalized_score, rank")
    .eq("session_id", sessionId);
  if (error) throw error;
  return (data as any[]) ?? [];
}

/** Fetch shadow signals (0..1) from analysis_results for a session. */
export async function getSessionShadowSignals(sessionId: string) {
  const { data, error } = await supabase
    .from("analysis_results" as any)
    .select("shadow_signals")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return ((data as any)?.shadow_signals ?? {}) as Record<string, number>;
}

export interface GetLatestSessionOptions {
  /** When true, includes admin guest-preview fast-quiz sessions (admin hub status only). */
  includePreviewSessions?: boolean;
}

/** Guest fast-quiz / wrong restore: Mystic + Sage + Warrior without Healer. */
export function isPollutedAssessmentTriad(top: string[]): boolean {
  if (top.length < 3) return false;
  return (
    top.includes("mystic") &&
    top.includes("sage") &&
    top.includes("warrior") &&
    !top.includes("healer")
  );
}

export function sessionMatchesPreferredTriad(
  top: string[],
  preferred: ArchetypeKey[],
): boolean {
  if (top.length < 3 || preferred.length < 3) return false;
  return preferred.every((k) => top.includes(k));
}

export async function getSessionTopArchetypes(sessionId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("archetype_scores" as any)
    .select("archetype_key")
    .eq("session_id", sessionId)
    .order("rank", { ascending: true })
    .limit(3);
  if (error) throw error;
  const fromScores = ((data as { archetype_key: string }[]) ?? []).map((r) => r.archetype_key);
  if (fromScores.length >= 3) return fromScores;

  const { data: analysis } = await supabase
    .from("analysis_results" as any)
    .select("top_archetypes")
    .eq("session_id", sessionId)
    .maybeSingle();
  return ((analysis as { top_archetypes?: string[] } | null)?.top_archetypes ?? []).slice(0, 3);
}

async function deleteSessionsByIds(sessionIds: string[]): Promise<void> {
  if (sessionIds.length === 0) return;
  await supabase.from("assessment_responses" as any).delete().in("session_id", sessionIds);
  await supabase.from("archetype_scores" as any).delete().in("session_id", sessionIds);
  await supabase.from("analysis_results" as any).delete().in("session_id", sessionIds);
  await supabase.from("recommendation_tools" as any).delete().in("session_id", sessionIds);
  await supabase.from("assessment_sessions" as any).delete().in("id", sessionIds);
}

/** Remove preview / polluted / wrong-triad sessions so recovery can run. */
export async function purgeWrongAssessmentSessions(
  userId: string,
  options?: { preferredTriad?: ArchetypeKey[] },
): Promise<number> {
  const { data: sessions, error } = await supabase
    .from("assessment_sessions" as any)
    .select("id, client_meta, status")
    .eq("user_id", userId)
    .eq("status", "submitted");
  if (error) throw error;
  const rows = (sessions as { id: string; client_meta?: Record<string, unknown> }[]) ?? [];
  if (rows.length === 0) return 0;

  const autoFillIds = await sessionIdsWithAdminAutoFill(rows.map((r) => r.id));
  const toDelete: string[] = [];

  for (const s of rows) {
    if (isAdminGuestPreviewSession(s) || autoFillIds.has(s.id)) {
      toDelete.push(s.id);
      continue;
    }
    const top = await getSessionTopArchetypes(s.id);
    if (isPollutedAssessmentTriad(top)) {
      toDelete.push(s.id);
      continue;
    }
    if (
      options?.preferredTriad?.length &&
      !sessionMatchesPreferredTriad(top, options.preferredTriad)
    ) {
      toDelete.push(s.id);
    }
  }

  const unique = [...new Set(toDelete)];
  await deleteSessionsByIds(unique);
  return unique.length;
}

export async function getLatestSubmittedSessionForUser(
  userId: string,
  options?: GetLatestSessionOptions,
) {
  const { data, error } = await supabase
    .from("assessment_sessions" as any)
    .select("*")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(25);
  if (error) throw error;
  const rows = (data as any[]) ?? [];
  if (rows.length === 0) return null;
  if (options?.includePreviewSessions) return rows[0];

  const autoFillIds = await sessionIdsWithAdminAutoFill(rows.map((r) => r.id));
  for (const s of rows) {
    if (isAdminGuestPreviewSession(s) || autoFillIds.has(s.id)) continue;
    const top = await getSessionTopArchetypes(s.id);
    if (isPollutedAssessmentTriad(top)) continue;
    return s;
  }
  return null;
}

/** Delete only admin guest-preview sessions (tagged or legacy auto-fill). */
/** Fast-quiz pollution pattern (Mystic / Sage / Warrior, no Healer). */
function isLikelyGuestPreviewSnapshot(snap: ArchetypeProfileSnapshot): boolean {
  const top = snap.top_archetypes.slice(0, 3).map((t) => t.key);
  return (
    top.includes("mystic") &&
    top.includes("sage") &&
    top.includes("warrior") &&
    !top.includes("healer")
  );
}

function snapshotMatchesTriad(
  snap: ArchetypeProfileSnapshot,
  triad: ArchetypeKey[],
): boolean {
  const top = snap.top_archetypes.slice(0, 3).map((t) => t.key as ArchetypeKey);
  if (top.length < 3) return false;
  const want = new Set(triad);
  return top.every((k) => want.has(k)) && triad.every((k) => top.includes(k));
}

function snapshotTriadOverlap(
  snap: ArchetypeProfileSnapshot,
  triad: ArchetypeKey[],
): number {
  const top = snap.top_archetypes.slice(0, 3).map((t) => t.key as ArchetypeKey);
  return triad.filter((k) => top.includes(k)).length;
}

/**
 * Best core_assessment snapshot when sessions were wiped.
 * Prefers Mystic/Sage/Healer over guest fast-quiz (Mystic/Sage/Warrior).
 */
export async function getRestorableCoreSnapshot(
  userId: string,
  options?: { preferredTriad?: ArchetypeKey[]; ignoreExistingSession?: boolean },
): Promise<ArchetypeProfileSnapshot | null> {
  if (!options?.ignoreExistingSession) {
    const real = await getLatestSubmittedSessionForUser(userId);
    if (real) return null;
  }

  const all = await getSnapshotHistory(userId);
  if (options?.preferredTriad?.length) {
    const exactAll = all.find((s) => snapshotMatchesTriad(s, options.preferredTriad!));
    if (exactAll) return exactAll;
  }

  const core = all.filter((s) => s.trigger_event === "core_assessment");
  if (core.length === 0) {
    const withHealer = all.filter((s) =>
      s.top_archetypes.slice(0, 3).some((t) => t.key === "healer"),
    );
    return withHealer[withHealer.length - 1] ?? null;
  }

  const nonPreview = core.filter((s) => !isLikelyGuestPreviewSnapshot(s));
  const pool = nonPreview.length > 0 ? nonPreview : core;

  if (options?.preferredTriad?.length) {
    const exact = pool.find((s) => snapshotMatchesTriad(s, options.preferredTriad!));
    if (exact) return exact;
    const best = pool.reduce((a, b) =>
      snapshotTriadOverlap(b, options.preferredTriad!) >
      snapshotTriadOverlap(a, options.preferredTriad!)
        ? b
        : a,
    );
    if (snapshotTriadOverlap(best, options.preferredTriad) >= 2) return best;
  }

  const withHealer = pool.filter((s) =>
    s.top_archetypes.slice(0, 3).some((t) => t.key === "healer"),
  );
  if (withHealer.length > 0) return withHealer[withHealer.length - 1];

  if (pool.length >= 2) return pool[pool.length - 1];
  return pool[0] ?? null;
}

/** Rebuild session from deepdive_responses (not deleted by guest reset). */
export async function restoreCoreAssessmentFromUnified(
  userId: string,
): Promise<string | null> {
  const { count, error: countErr } = await supabase
    .from("deepdive_responses" as any)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (countErr) throw countErr;
  if (!count || count === 0) return null;

  const unified = await loadUnifiedDeepDiveResult(userId);
  const ranked = unified.archetypes
    .filter((a) => a.total > 0)
    .map((a, i) => ({
      key: a.archetype as ArchetypeKey,
      score: a.intensity,
      rank: i + 1,
    }));
  if (ranked.length === 0) return null;

  const loaded = await loadActiveTemplate();
  const sessionId = await createSession(userId, loaded.template.id, {
    restored_from_unified: true,
    restored_at: new Date().toISOString(),
    deepdive_answer_count: count,
  });

  const scoreRows = ranked.map((s) => ({
    session_id: sessionId,
    user_id: userId,
    archetype_key: s.key,
    raw_score: s.score,
    normalized_score: s.score,
    rank: s.rank,
  }));
  const { error: sErr } = await supabase
    .from("archetype_scores" as any)
    .upsert(scoreRows, { onConflict: "session_id,archetype_key" });
  if (sErr) throw sErr;

  const topKeys = unified.topThree.length > 0 ? unified.topThree : ranked.slice(0, 3).map((s) => s.key);

  const { error: aErr } = await supabase.from("analysis_results" as any).upsert(
    {
      session_id: sessionId,
      user_id: userId,
      top_archetypes: topKeys,
      dimension_scores: {},
      shadow_signals: {},
      strengths_fr: [],
      strengths_en: [],
      watchouts_fr: [],
      watchouts_en: [],
      summary_fr: null,
      summary_en: null,
    },
    { onConflict: "session_id" },
  );
  if (aErr) throw aErr;

  const { error: upErr } = await supabase
    .from("assessment_sessions" as any)
    .update({
      status: "submitted",
      submitted_at: unified.computedAt,
      client_meta: { restored_from_unified: true },
    })
    .eq("id", sessionId);
  if (upErr) throw upErr;

  return sessionId;
}

export async function tryRecoverUserAssessment(
  userId: string,
  options?: { preferredTriad?: ArchetypeKey[] },
): Promise<string | null> {
  await deleteAdminGuestPreviewSessions(userId);
  await purgeWrongAssessmentSessions(userId, options);

  const existing = await getLatestSubmittedSessionForUser(userId);
  if (existing) {
    const top = await getSessionTopArchetypes(existing.id);
    if (
      !options?.preferredTriad?.length ||
      sessionMatchesPreferredTriad(top, options.preferredTriad)
    ) {
      return existing.id;
    }
    await deleteSessionsByIds([existing.id]);
  }

  const backup = await getRestorableCoreSnapshot(userId, {
    ...options,
    ignoreExistingSession: true,
  });
  if (backup) {
    try {
      const id = await restoreCoreAssessmentFromSnapshot(userId, backup.id);
      const top = await getSessionTopArchetypes(id);
      if (
        !options?.preferredTriad?.length ||
        sessionMatchesPreferredTriad(top, options.preferredTriad)
      ) {
        return id;
      }
      await deleteSessionsByIds([id]);
    } catch (e) {
      console.warn("[Assessment] snapshot restore failed", e);
    }
  }

  try {
    const unifiedId = await restoreCoreAssessmentFromUnified(userId);
    if (!unifiedId) return null;
    const top = await getSessionTopArchetypes(unifiedId);
    if (
      !options?.preferredTriad?.length ||
      sessionMatchesPreferredTriad(top, options.preferredTriad)
    ) {
      return unifiedId;
    }
    await deleteSessionsByIds([unifiedId]);
  } catch (e) {
    console.warn("[Assessment] unified restore failed", e);
  }

  return null;
}

export async function restoreFromSnapshotId(
  userId: string,
  snapshotId: string,
): Promise<string> {
  await deleteAdminGuestPreviewSessions(userId);
  await purgeWrongAssessmentSessions(userId);
  return restoreCoreAssessmentFromSnapshot(userId, snapshotId);
}

/** Rebuild assessment_sessions + scores + analysis from an append-only snapshot. */
export async function restoreCoreAssessmentFromSnapshot(
  userId: string,
  snapshotId: string,
): Promise<string> {
  const snapshot = await getSnapshotById(snapshotId);
  if (snapshot.user_id !== userId) {
    throw new Error("Snapshot does not belong to this user.");
  }

  const loaded = await loadActiveTemplate();
  const sessionId = await createSession(userId, loaded.template.id, {
    restored_from_snapshot: snapshotId,
    restored_at: new Date().toISOString(),
  });

  const ranked = Object.entries(snapshot.all_scores)
    .map(([key, score]) => ({ key, score: Number(score) }))
    .filter((s) => Number.isFinite(s.score))
    .sort((a, b) => b.score - a.score)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  if (ranked.length > 0) {
    const scoreRows = ranked.map((s) => ({
      session_id: sessionId,
      user_id: userId,
      archetype_key: s.key,
      raw_score: s.score,
      normalized_score: s.score,
      rank: s.rank,
    }));
    const { error: sErr } = await supabase
      .from("archetype_scores" as any)
      .upsert(scoreRows, { onConflict: "session_id,archetype_key" });
    if (sErr) throw sErr;
  }

  const topKeys =
    snapshot.top_archetypes.length > 0
      ? snapshot.top_archetypes.map((t) => t.key)
      : ranked.slice(0, 3).map((s) => s.key);

  const { error: aErr } = await supabase.from("analysis_results" as any).upsert(
    {
      session_id: sessionId,
      user_id: userId,
      top_archetypes: topKeys,
      dimension_scores: snapshot.dimension_scores ?? {},
      shadow_signals: snapshot.shadow_scores ?? {},
      strengths_fr: [],
      strengths_en: [],
      watchouts_fr: [],
      watchouts_en: [],
      summary_fr: null,
      summary_en: null,
    },
    { onConflict: "session_id" },
  );
  if (aErr) throw aErr;

  const { error: upErr } = await supabase
    .from("assessment_sessions" as any)
    .update({
      status: "submitted",
      submitted_at: snapshot.computed_at,
      client_meta: {
        restored_from_snapshot: snapshotId,
        snapshot_version: snapshot.snapshot_version,
      },
    })
    .eq("id", sessionId);
  if (upErr) throw upErr;

  return sessionId;
}

export async function deleteAdminGuestPreviewSessions(userId: string): Promise<number> {
  const { data: sessions, error } = await supabase
    .from("assessment_sessions" as any)
    .select("id, client_meta")
    .eq("user_id", userId);
  if (error) throw error;
  const rows = (sessions as { id: string; client_meta?: Record<string, unknown> }[]) ?? [];
  if (rows.length === 0) return 0;

  const autoFillIds = await sessionIdsWithAdminAutoFill(rows.map((r) => r.id));
  const previewIds = rows
    .filter((s) => isAdminGuestPreviewSession(s) || autoFillIds.has(s.id))
    .map((s) => s.id);
  if (previewIds.length === 0) return 0;

  await deleteSessionsByIds(previewIds);
  return previewIds.length;
}

export interface RecoveryDiagnostics {
  submittedSessions: number;
  currentTopTriad: string[];
  snapshotCount: number;
  snapshots: Array<{ id: string; version: number; at: string; top: string }>;
  deepdiveResponseCount: number;
}

export async function getRecoveryDiagnostics(userId: string): Promise<RecoveryDiagnostics> {
  const [sessionsRes, snaps, ddCount] = await Promise.all([
    supabase
      .from("assessment_sessions" as any)
      .select("id")
      .eq("user_id", userId)
      .eq("status", "submitted"),
    getSnapshotHistory(userId),
    supabase
      .from("deepdive_responses" as any)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const sessionIds = ((sessionsRes.data as { id: string }[]) ?? []).map((s) => s.id);
  let currentTopTriad: string[] = [];
  if (sessionIds.length > 0) {
    const latest = await getLatestSubmittedSessionForUser(userId, {
      includePreviewSessions: true,
    });
    if (latest) currentTopTriad = await getSessionTopArchetypes(latest.id);
  }

  return {
    submittedSessions: sessionIds.length,
    currentTopTriad,
    snapshotCount: snaps.length,
    snapshots: snaps.map((s) => ({
      id: s.id,
      version: s.snapshot_version,
      at: s.computed_at,
      top: s.top_archetypes.map((t) => t.key).join(" / "),
    })),
    deepdiveResponseCount: ddCount.count ?? 0,
  };
}

export async function getSessionFullDetails(sessionId: string) {
  const [sessionRes, analysisRes, scoresRes, recosRes, responsesRes, questionsRes] = await Promise.all([
    supabase.from("assessment_sessions" as any).select("*").eq("id", sessionId).maybeSingle(),
    supabase.from("analysis_results" as any).select("*").eq("session_id", sessionId).maybeSingle(),
    supabase.from("archetype_scores" as any).select("*").eq("session_id", sessionId).order("rank"),
    supabase.from("recommendation_tools" as any).select("*").eq("session_id", sessionId).order("rank"),
    supabase.from("assessment_responses" as any).select("*").eq("session_id", sessionId),
    // Fetch all questions+options to render readable answers
    supabase.from("assessment_questions" as any).select("*, assessment_options(*)").order("position"),
  ]);

  // Join user profile + company
  let profile: any = null;
  let company: any = null;
  const userId = (sessionRes.data as any)?.user_id;
  if (userId) {
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    profile = p;
    if (p?.company_id) {
      const { data: c } = await supabase
        .from("companies" as any)
        .select("*")
        .eq("id", p.company_id)
        .maybeSingle();
      company = c;
    }
  }

  return {
    session: sessionRes.data as any,
    analysis: analysisRes.data as any,
    scores: (scoresRes.data as any[]) ?? [],
    recommendations: (recosRes.data as any[]) ?? [],
    responses: (responsesRes.data as any[]) ?? [],
    questions: (questionsRes.data as any[]) ?? [],
    profile,
    company,
  };
}

export async function listAllSessionsForAdmin() {
  const { data, error } = await supabase
    .from("assessment_sessions" as any)
    .select("*")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) throw error;
  const sessions = (data as any[]) ?? [];
  if (sessions.length === 0) return [];

  const userIds = Array.from(new Set(sessions.map((s) => s.user_id)));
  const sessionIds = sessions.map((s) => s.id);

  const [profilesRes, companiesRes, analysisRes, scoresRes] = await Promise.all([
    supabase.from("profiles").select("*").in("id", userIds),
    supabase.from("companies" as any).select("*"),
    supabase.from("analysis_results" as any).select("session_id, top_archetypes, shadow_signals").in("session_id", sessionIds),
    supabase.from("archetype_scores" as any).select("session_id, archetype_key, rank").in("session_id", sessionIds).eq("rank", 1),
  ]);

  const profiles = (profilesRes.data as any[]) ?? [];
  const companies = (companiesRes.data as any[]) ?? [];
  const analyses = (analysisRes.data as any[]) ?? [];
  const topScores = (scoresRes.data as any[]) ?? [];

  return sessions.map((s) => {
    const p = profiles.find((x) => x.id === s.user_id);
    const c = p?.company_id ? companies.find((x) => x.id === p.company_id) : null;
    const a = analyses.find((x) => x.session_id === s.id);
    const top = topScores.find((x) => x.session_id === s.id)?.archetype_key
      ?? a?.top_archetypes?.[0]
      ?? null;
    const shadowCount = a?.shadow_signals
      ? Object.values(a.shadow_signals).filter((v: any) => Number(v) >= 0.3).length
      : 0;
    return { ...s, profile: p ?? null, company: c ?? null, top_archetype: top, shadow_count: shadowCount };
  });
}

export async function saveAdminNote(sessionId: string, notes: string) {
  const { error } = await supabase
    .from("analysis_results" as any)
    .update({ admin_notes: notes })
    .eq("session_id", sessionId);
  if (error) throw error;
}

export function archetypeMeta(key: ArchetypeKey) {
  return ARCHETYPES.find((a) => a.key === key);
}
