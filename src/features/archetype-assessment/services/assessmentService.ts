/**
 * Service layer for the archetype assessment.
 * No UI imports here. All Supabase calls live in this file.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { ARCHETYPES } from "../domain/archetypes";
import { QUESTIONS } from "../domain/questions";
import { V4_QUESTION_COUNT } from "../domain/questionsV4";
import {
  buildAnalysisResult,
  computeCompletionConfidence,
  detectConsistencyWarning,
} from "../domain/scoringEngine";
import { selectTopTools } from "../domain/recommendationEngine";
import { SCORING_MODEL_MYSS_V4 } from "../domain/v4Scoring";
import { buildV4PoleAnalysis, parsePoleScoresRecord } from "../domain/v4PoleAnalysis";
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
  PolarityWeight,
  QuestionSeed,
  ResponseValue,
  RuntimeQuestion,
  ShadowKey,
  PoleScores,
  V4PoleAnalysis,
} from "../domain/types";

type Tables = Database["public"]["Tables"];
export type AssessmentSessionRow = Tables["assessment_sessions"]["Row"];
type AssessmentResponseRow = Tables["assessment_responses"]["Row"];
type AssessmentQuestionRow = Tables["assessment_questions"]["Row"];
type AssessmentOptionRow = Tables["assessment_options"]["Row"];
type AnalysisResultRow = Tables["analysis_results"]["Row"];
type ArchetypeScoreRow = Tables["archetype_scores"]["Row"];
type RecommendationToolRow = Tables["recommendation_tools"]["Row"];
type CompanyRow = Tables["companies"]["Row"];
type ProfileRow = Tables["profiles"]["Row"];
type QuestionWithOptions = AssessmentQuestionRow & {
  assessment_options: AssessmentOptionRow[];
};

function clientMetaFromJson(meta: unknown): Record<string, unknown> {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return {};
}

function isAppendixQuestion(meta: unknown): boolean {
  return clientMetaFromJson(meta).is_appendix === true;
}

function shadowSignalsFromJson(signals: Json | null | undefined): Record<string, number> {
  const raw = clientMetaFromJson(signals);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = Number(v);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

type UntypedRpcClient = (
  fn: string,
  args?: Record<string, unknown>,
) => ReturnType<typeof supabase.rpc>;

function callUntypedRpc(fn: string, args?: Record<string, unknown>) {
  return (supabase.rpc as UntypedRpcClient)(fn, args);
}

function asPartialArchetypeWeights(json: Json): Partial<Record<ArchetypeKey, number>> {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return json as Partial<Record<ArchetypeKey, number>>;
  }
  return {};
}

function asPartialShadowWeights(json: Json): Partial<Record<ShadowKey, number>> {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return json as Partial<Record<ShadowKey, number>>;
  }
  return {};
}

function asPolarityWeights(json: Json): PolarityWeight[] {
  return Array.isArray(json) ? (json as unknown as PolarityWeight[]) : [];
}

function toJson(value: unknown): Json {
  return value as Json;
}

function responsePayloadFromJson(raw: Json | null | undefined): ResponseValue {
  return (raw ?? {}) as unknown as ResponseValue;
}

const TEMPLATE_SLUG = "archetype-v1";

const assessmentSessionStorageKey = (userId: string) =>
  `aegis_assessment_active_session_${userId}`;

export function readPersistedAssessmentSessionId(userId: string): string | null {
  try {
    return sessionStorage.getItem(assessmentSessionStorageKey(userId));
  } catch {
    return null;
  }
}

export function persistAssessmentSessionId(userId: string, sessionId: string): void {
  try {
    sessionStorage.setItem(assessmentSessionStorageKey(userId), sessionId);
  } catch {
    // private browsing / disabled storage
  }
}

export function clearPersistedAssessmentSessionId(userId: string): void {
  try {
    sessionStorage.removeItem(assessmentSessionStorageKey(userId));
  } catch {
    // ignore
  }
}

/**
 * Bump this whenever the scoring algorithm (weights, normalization, shadows)
 * changes. Stored on each appendix_response so historical answers can be
 * recomputed under the version they were captured with.
 */
/** Myss V4 — 32 poles (16× light/shadow) + intensity multiplier (v6). */
export const SCORE_VERSION = 6;

export const SCORING_MODEL_MYSS_V3 = "myss-v3";
export { SCORING_MODEL_MYSS_V4 };

export function getStoredScoreVersion(
  meta: Json | Record<string, unknown> | null | undefined,
): number {
  const record =
    meta && typeof meta === "object" && !Array.isArray(meta)
      ? (meta as Record<string, unknown>)
      : clientMetaFromJson(meta as Json | null | undefined);
  const v = record.score_version;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function mapDbResponsesToValues(rows: AssessmentResponseRow[]): ResponseValue[] {
  return rows.map((r) => {
    const payload = responsePayloadFromJson(r.raw_payload);
    return {
      questionId: r.question_id,
      selections: payload.selections,
      selectedOptionIds: r.selected_option_ids ?? [],
      optionIntensities: payload.optionIntensities,
      numericValue: r.numeric_value ?? undefined,
      textValue: r.text_value ?? undefined,
    };
  });
}

function responsesLookLikeMyssV3(
  dbResponses: Array<{ raw_payload?: unknown }>,
): boolean {
  for (const r of dbResponses) {
    const p = r.raw_payload as ResponseValue | undefined;
    if (p?.optionIntensities && Object.keys(p.optionIntensities).length > 0) {
      return true;
    }
  }
  return false;
}

function questionsLookLikeMyssV4(questions: RuntimeQuestion[]): boolean {
  return questions.some(
    (q) =>
      (q.meta as { scoringModel?: string } | undefined)?.scoringModel === SCORING_MODEL_MYSS_V4,
  );
}

function questionsLookLikeMyssV3(questions: RuntimeQuestion[]): boolean {
  return questions.some((q) => {
    if ((q.meta as { scoringModel?: string } | undefined)?.scoringModel === SCORING_MODEL_MYSS_V3) {
      return true;
    }
    return q.options.some((o) => (o.polarity_weights?.length ?? 0) > 0);
  });
}

async function loadSessionTemplateSlug(templateId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("assessment_templates")
    .select("slug")
    .eq("id", templateId)
    .maybeSingle();
  if (error) throw error;
  return ((data as { slug?: string } | null)?.slug ?? null) as string | null;
}

async function persistSessionAnalysisResult(opts: {
  sessionId: string;
  userId: string;
  questions: RuntimeQuestion[];
  responses: ResponseValue[];
  analysis: AnalysisResult;
  refreshRecommendations?: boolean;
  metaPatch?: Record<string, unknown>;
}): Promise<void> {
  const {
    sessionId,
    userId,
    questions,
    responses,
    analysis,
    refreshRecommendations = true,
    metaPatch = {},
  } = opts;

  const confidence = computeCompletionConfidence(questions.length, responses);
  const consistency = detectConsistencyWarning(
    analysis.normalizedScores,
    analysis.shadowSignals,
  );

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
      .from("archetype_scores")
      .upsert(scoreRows, { onConflict: "session_id,archetype_key" });
    if (scErr) throw scErr;
  }

  const { error: aErr } = await supabase
    .from("analysis_results")
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        top_archetypes: analysis.topArchetypes,
        dimension_scores: {
          ...analysis.dimensionScores,
          pole_scores: analysis.poleScores,
        },
        shadow_signals: analysis.shadowSignals,
        strengths_fr: analysis.strengths_fr,
        strengths_en: analysis.strengths_en,
        watchouts_fr: analysis.watchouts_fr,
        watchouts_en: analysis.watchouts_en,
        summary_fr: analysis.summary_fr,
        summary_en: analysis.summary_en,
      },
      { onConflict: "session_id" },
    );
  if (aErr) throw aErr;

  if (refreshRecommendations) {
    const recos = selectTopTools(analysis, { limit: 6, lang: "fr" });
    if (recos.length > 0) {
      await supabase
        .from("recommendation_tools")
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
        .from("recommendation_tools")
        .insert(recoRows);
      if (rcErr) throw rcErr;
    }
  }

  const { data: prevSession } = await supabase
    .from("assessment_sessions")
    .select("client_meta")
    .eq("id", sessionId)
    .maybeSingle();
  const prevMeta = clientMetaFromJson(prevSession?.client_meta);
  const nextMeta: Record<string, unknown> = {
    ...prevMeta,
    ...metaPatch,
    score_version: SCORE_VERSION,
    scoring_model: questionsLookLikeMyssV4(questions)
      ? SCORING_MODEL_MYSS_V4
      : SCORING_MODEL_MYSS_V3,
    pole_scores: analysis.poleScores,
  };
  if (consistency) {
    nextMeta.consistency_warning = true;
    nextMeta.conflicting_pair = consistency.conflicting_pair;
  } else {
    delete nextMeta.consistency_warning;
    delete nextMeta.conflicting_pair;
  }

  const { error: upErr } = await supabase
    .from("assessment_sessions")
    .update({ confidence_score: confidence, client_meta: toJson(nextMeta) })
    .eq("id", sessionId);
  if (upErr) throw upErr;

  void refreshArchetypeScoresView();
}

/**
 * Recompute stored scores/analysis for a submitted Myss V3 session using the
 * current scoring engine. Safe to call multiple times.
 */
export async function recomputeSubmittedSessionAnalysis(
  sessionId: string,
): Promise<AnalysisResult> {
  const { data: sessionRow, error: sErr } = await supabase
    .from("assessment_sessions")
    .select("id, user_id, status, template_id, client_meta")
    .eq("id", sessionId)
    .maybeSingle();
  if (sErr) throw sErr;
  if (!sessionRow) throw new Error("Session not found");

  const session = sessionRow as {
    id: string;
    user_id: string;
    status: string;
    template_id: string;
    client_meta?: Record<string, unknown>;
  };
  if (session.status !== "submitted") {
    throw new Error("Only submitted sessions can be recomputed");
  }
  if (isAdminGuestPreviewSession(session)) {
    throw new Error("Admin preview sessions are not recomputed");
  }

  const templateId = session.template_id;
  if (!templateId) throw new Error("Session has no template_id");

  const [{ data: allResp, error: arErr }, coreQs] = await Promise.all([
    supabase.from("assessment_responses").select("*").eq("session_id", sessionId),
    fetchQuestions(templateId, { appendix: false }),
  ]);
  if (arErr) throw arErr;

  const dbResponses = allResp ?? [];
  const allQuestions = coreQs;
  if (allQuestions.length === 0) {
    throw new Error("No questions found for session template");
  }

  const questionIds = new Set(allQuestions.map((q) => q.id));
  const allResponses = mapDbResponsesToValues(dbResponses).filter((r) =>
    questionIds.has(r.questionId),
  );

  const analysis = buildAnalysisResult(allQuestions, allResponses);

  await persistSessionAnalysisResult({
    sessionId,
    userId: session.user_id,
    questions: allQuestions,
    responses: allResponses,
    analysis,
    metaPatch: { score_recomputed_at: new Date().toISOString() },
  });

  try {
    await createSnapshot({
      userId: session.user_id,
      sessionId,
      triggerEvent: "manual_refresh",
      analysisResult: analysis,
    });
  } catch (e) {
    console.warn("createSnapshot (manual_refresh) failed", e);
  }

  return analysis;
}

/**
 * If a submitted Myss V3 session was scored under an older engine version,
 * recompute and persist fresh results before the UI reads them.
 */
export async function ensureSessionResultsUpToDate(sessionId: string): Promise<boolean> {
  const { data: sessionRow, error: sErr } = await supabase
    .from("assessment_sessions")
    .select("id, status, template_id, client_meta")
    .eq("id", sessionId)
    .maybeSingle();
  if (sErr) throw sErr;
  if (!sessionRow) return false;

  const session = sessionRow as {
    status: string;
    template_id: string;
    client_meta?: Record<string, unknown>;
  };
  if (session.status !== "submitted" || isAdminGuestPreviewSession(session)) {
    return false;
  }
  if (getStoredScoreVersion(session.client_meta) >= SCORE_VERSION) {
    return false;
  }

  const templateSlug = await loadSessionTemplateSlug(session.template_id);
  if (templateSlug !== TEMPLATE_SLUG) return false;

  const { data: respRows, error: rErr } = await supabase
    .from("assessment_responses")
    .select("raw_payload")
    .eq("session_id", sessionId);
  if (rErr) throw rErr;

  const dbResponses = (respRows as Array<{ raw_payload?: unknown }>) ?? [];
  const coreQs = await fetchQuestions(session.template_id, { appendix: false });
  const scoringModel = session.client_meta?.scoring_model;
  const looksV4 =
    scoringModel === SCORING_MODEL_MYSS_V4 || questionsLookLikeMyssV4(coreQs);
  const looksV3 =
    scoringModel === SCORING_MODEL_MYSS_V3 ||
    responsesLookLikeMyssV3(dbResponses) ||
    questionsLookLikeMyssV3(coreQs);
  if (!looksV4 && !looksV3) return false;

  await recomputeSubmittedSessionAnalysis(sessionId);
  return true;
}

/** Recompute stale Myss V3 submitted sessions for one user. Returns count updated. */
export async function recomputeAllStaleV3SessionsForUser(
  userId: string,
  options?: { latestOnly?: boolean },
): Promise<number> {
  const { data, error } = await supabase
    .from("assessment_sessions")
    .select("id, status, template_id, client_meta")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false });
  if (error) throw error;

  const rows = (data as { id: string; status: string; template_id: string; client_meta?: Record<string, unknown> }[]) ?? [];
  const toProcess = options?.latestOnly ? rows.slice(0, 1) : rows;
  let updated = 0;
  for (const row of toProcess) {
    if (await ensureSessionResultsUpToDate(row.id)) updated += 1;
  }
  return updated;
}

/**
 * Force-recompute all submitted archetype-v1 (T1 V3) sessions for a user,
 * regardless of stored score_version (admin refresh).
 */
export async function forceRecomputeAllV3SessionsForUser(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("assessment_sessions")
    .select("id, status, template_id, client_meta")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false });
  if (error) throw error;

  let updated = 0;
  for (const row of (data as { id: string; status: string; template_id: string; client_meta?: Record<string, unknown> }[]) ?? []) {
    if (isAdminGuestPreviewSession(row)) continue;
    const templateSlug = await loadSessionTemplateSlug(row.template_id);
    if (templateSlug !== TEMPLATE_SLUG) continue;

    const { data: respRows, error: rErr } = await supabase
      .from("assessment_responses")
      .select("raw_payload")
      .eq("session_id", row.id);
    if (rErr) throw rErr;

    const dbResponses = (respRows as Array<{ raw_payload?: unknown }>) ?? [];
    if (
      row.client_meta?.scoring_model !== SCORING_MODEL_MYSS_V3 &&
      !responsesLookLikeMyssV3(dbResponses)
    ) {
      const coreQs = await fetchQuestions(row.template_id, { appendix: false });
      if (!questionsLookLikeMyssV3(coreQs)) continue;
    }

    await recomputeSubmittedSessionAnalysis(row.id);
    updated += 1;
  }
  return updated;
}

/** Refreshes the materialized view aggregating selected option weights. */
async function refreshArchetypeScoresView(): Promise<void> {
  try {
    await supabase.rpc("refresh_archetype_scores_by_user");
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
    .from("assessment_templates")
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

  if (questions.length === 0) {
    throw new Error(
      `No assessment questions available for template "${slug}". Apply database migrations or ask an admin to seed the catalog.`
    );
  }

  return { template, questions };
}

/** Load onboarding template (`archetype-v1` slug — V4 bank in code). */
export async function loadActiveTemplate(): Promise<LoadedTemplate> {
  const { data: tpl, error: tplErr } = await supabase
    .from("assessment_templates")
    .select("*")
    .eq("slug", TEMPLATE_SLUG)
    .eq("is_active", true)
    .maybeSingle();

  if (tplErr) throw tplErr;
  if (!tpl) throw new Error(`No active assessment template found for slug "${TEMPLATE_SLUG}"`);

  const template = tpl as unknown as TemplateRow;

  let questions = await fetchQuestions(template.id);

  if (catalogNeedsV4Resync(questions)) {
    await replaceCoreCatalog();
    questions = await fetchQuestions(template.id);
  }

  if (questions.length === 0) {
    await seedQuestions(template.id);
    questions = await fetchQuestions(template.id);
  }

  if (questions.length === 0) {
    throw new Error(
      `No assessment questions available for template "${TEMPLATE_SLUG}". Apply database migrations or ask an admin to seed the catalog.`,
    );
  }

  // User path: core V4 only (no appendix / legacy T2 rows in template).
  const coreOnly = questions.filter((q) => !isAppendixQuestion(q.meta));
  if (coreOnly.length !== USER_ONBOARDING_QUESTION_COUNT) {
    console.warn(
      `[assessment] Expected ${USER_ONBOARDING_QUESTION_COUNT} core questions, got ${coreOnly.length}`,
    );
  }

  return { template, questions: coreOnly };
}

/** User-facing onboarding quiz length (V4 only). Legacy T1/T2 remain in DB for history/admin. */
export const USER_ONBOARDING_QUESTION_COUNT = V4_QUESTION_COUNT;

/** Guest / public funnel: V4 core quiz only. */
export const GUEST_QUIZ_QUESTION_LIMIT = USER_ONBOARDING_QUESTION_COUNT;

export async function loadGuestQuizTemplate(): Promise<LoadedTemplate> {
  // Reuse member path so guests get V4 resync/seed (30 questions) — not stale legacy catalog.
  const loaded = await loadActiveTemplate();
  const core = loaded.questions.slice(0, GUEST_QUIZ_QUESTION_LIMIT);
  return { ...loaded, questions: core };
}

async function fetchQuestions(
  templateId: string,
  opts: { appendix?: boolean } = {}
): Promise<RuntimeQuestion[]> {
  const { data: qs, error: qErr } = await supabase
    .from("assessment_questions")
    .select("*")
    .eq("template_id", templateId)
    .order("position", { ascending: true });
  if (qErr) throw qErr;
  if (!qs || qs.length === 0) return [];

  // Filter by appendix flag stored in meta JSON
  const wantAppendix = opts.appendix === true;
  const filtered = (qs ?? []).filter((q) => {
    const isApp = isAppendixQuestion(q.meta);
    return wantAppendix ? isApp : !isApp;
  });
  if (filtered.length === 0) return [];

  const qIds = filtered.map((q) => q.id);
  const { data: opts2, error: oErr } = await supabase
    .from("assessment_options")
    .select("*")
    .in("question_id", qIds)
    .order("position", { ascending: true });
  if (oErr) throw oErr;

  const optsByQ = new Map<string, AssessmentOptionRow[]>();
  for (const o of opts2 ?? []) {
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
    meta: clientMetaFromJson(q.meta),
    options: (optsByQ.get(q.id) ?? []).map((o) => ({
      id: o.id,
      position: o.position,
      label_fr: o.label_fr,
      label_en: o.label_en,
      archetype_weights: asPartialArchetypeWeights(o.archetype_weights),
      shadow_weights: asPartialShadowWeights(o.shadow_weights),
      polarity_weights: asPolarityWeights(o.polarity_weights),
      value: o.value,
    })),
  }));
}

function formatSubmitError(step: string, err: unknown): Error {
  const detail =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: string }).message)
      : String(err);
  return new Error(`${step}: ${detail}`);
}

/** Reuse in-progress session from memory/storage, or create a new one. */
export async function ensureAssessmentSession(
  userId: string,
  templateId: string,
  existingSessionId: string | null,
): Promise<string> {
  if (existingSessionId) {
    const { data, error } = await supabase
      .from("assessment_sessions")
      .select("id, status")
      .eq("id", existingSessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!error && data && (data as { status: string }).status === "in_progress") {
      persistAssessmentSessionId(userId, existingSessionId);
      return existingSessionId;
    }
  }

  const sid = await createSession(userId, templateId);
  persistAssessmentSessionId(userId, sid);
  return sid;
}

function buildQuestionSeedPayload(questions: QuestionSeed[]) {
  return questions.map((q) => {
    const meta = { ...(q.meta ?? {}) } as Record<string, unknown>;
    if (q.isAppendix) meta.is_appendix = true;

    return {
      position: q.position,
      question_type: q.type,
      prompt_fr: q.prompt_fr,
      prompt_en: q.prompt_en,
      helper_fr: q.helper_fr ?? null,
      helper_en: q.helper_en ?? null,
      dimension: q.dimension ?? null,
      is_required: q.isRequired ?? true,
      meta,
      options: (q.options ?? []).map((o) => ({
        position: o.position,
        label_fr: o.label_fr,
        label_en: o.label_en,
        archetype_weights: o.archetypeWeights ?? {},
        shadow_weights: o.shadowWeights ?? {},
        polarity_weights: o.polarityWeights ?? [],
        value: o.value ?? null,
      })),
    };
  });
}

/** True when Supabase catalog is not the V4 bank (count or missing polarity vectors). */
function catalogNeedsV4Resync(questions: RuntimeQuestion[]): boolean {
  if (questions.length !== V4_QUESTION_COUNT) return true;
  const sample = questions.find((q) => q.options.length > 0);
  const pw = sample?.options[0]?.polarity_weights;
  return !Array.isArray(pw) || pw.length === 0;
}

/** Replace core (non-appendix) questions via SECURITY DEFINER RPC — safe for all authenticated users. */
async function replaceCoreCatalog(): Promise<void> {
  const payload = buildQuestionSeedPayload(QUESTIONS);
  const { error } = await callUntypedRpc("replace_assessment_core_catalog", {
    p_template_slug: TEMPLATE_SLUG,
    p_questions: payload,
  });
  if (!error) return;

  const rpcMissing =
    error.code === "PGRST202" ||
    error.code === "42883" ||
    /replace_assessment_core_catalog/i.test(error.message ?? "");

  if (rpcMissing) {
    throw new Error(
      "Cannot resync the V4 questionnaire. Apply Supabase migration 20260616130000_replace_assessment_core_catalog_rpc.sql, then reload.",
    );
  }

  throw formatSubmitError("replace_assessment_core_catalog", error);
}

/** Inserts catalog via SECURITY DEFINER RPC (any authenticated user when core bank is empty). */
async function seedQuestions(templateId: string): Promise<void> {
  const payload = buildQuestionSeedPayload(QUESTIONS);
  const { error: rpcErr } = await callUntypedRpc("seed_assessment_catalog_if_empty", {
    p_template_slug: TEMPLATE_SLUG,
    p_questions: payload,
  });

  if (!rpcErr) return;

  const rpcMissing =
    rpcErr.code === "PGRST202" ||
    rpcErr.code === "42883" ||
    /seed_assessment_catalog_if_empty/i.test(rpcErr.message ?? "");

  if (rpcMissing) {
    await seedQuestionsDirect(templateId);
    return;
  }

  throw rpcErr;
}

/** Legacy path — admins only (RLS). Used when RPC migration is not applied yet. */
async function seedQuestionsDirect(templateId: string): Promise<void> {
  const { count, error: countErr } = await supabase
    .from("assessment_questions")
    .select("id", { count: "exact", head: true })
    .eq("template_id", templateId);
  if (countErr) throw countErr;
  if ((count ?? 0) > 0) {
    console.warn("[assessment] seedQuestionsDirect skipped — catalog already has questions");
    return;
  }

  for (const q of QUESTIONS) {
    const meta = { ...(q.meta ?? {}) } as Record<string, unknown>;
    if (q.isAppendix) meta.is_appendix = true;

    const { data: inserted, error: qErr } = await supabase
      .from("assessment_questions")
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
        meta: toJson(meta),
      })
      .select("id")
      .single();
    if (qErr) throw qErr;

    const questionId = inserted.id;
    if (q.options && q.options.length > 0) {
      const optionPayload = q.options.map((o) => ({
        question_id: questionId,
        position: o.position,
        label_fr: o.label_fr,
        label_en: o.label_en,
        archetype_weights: toJson(o.archetypeWeights ?? {}),
        shadow_weights: toJson(o.shadowWeights ?? {}),
        polarity_weights: toJson(o.polarityWeights ?? []),
        value: o.value ?? null,
      }));
      const { error: oErr } = await supabase
        .from("assessment_options")
        .insert(optionPayload);
      if (oErr) throw oErr;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Appendix questions (loaded on demand from Profile)                         */
/* -------------------------------------------------------------------------- */

export async function loadAppendixQuestions(): Promise<RuntimeQuestion[]> {
  const { data: tpl, error: tplErr } = await supabase
    .from("assessment_templates")
    .select("id")
    .eq("slug", TEMPLATE_SLUG)
    .eq("is_active", true)
    .maybeSingle();
  if (tplErr) throw tplErr;
  if (!tpl) throw new Error("No active assessment template found");
  return fetchQuestions(tpl.id, { appendix: true });
}

export async function getLatestSessionId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("assessment_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
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
      raw_payload: toJson(r),
    }));
    const { error: rErr } = await supabase
      .from("assessment_responses")
      .upsert(payload, { onConflict: "session_id,question_id" });
    if (rErr) throw rErr;
  }

  // 2. Reload ALL responses for this session (core + appendix)
  const { data: allResp, error: arErr } = await supabase
    .from("assessment_responses")
    .select("*")
    .eq("session_id", sessionId);
  if (arErr) throw arErr;

  // 3. Reload ALL questions of the template (core + appendix)
  const { data: sessionRow, error: sErr } = await supabase
    .from("assessment_sessions")
    .select("template_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (sErr) throw sErr;
  const templateId = sessionRow?.template_id;
  if (!templateId) throw new Error("Session has no template_id");

  const [coreQs, appendixQs] = await Promise.all([
    fetchQuestions(templateId, { appendix: false }),
    fetchQuestions(templateId, { appendix: true }),
  ]);
  const allQuestions = [...coreQs, ...appendixQs];

  const allResponses: ResponseValue[] = (allResp ?? []).map((r) => {
    const payload = responsePayloadFromJson(r.raw_payload);
    return {
      questionId: r.question_id,
      selections: payload.selections,
      selectedOptionIds: r.selected_option_ids ?? [],
      optionIntensities: payload.optionIntensities,
      numericValue: r.numeric_value ?? undefined,
      textValue: r.text_value ?? undefined,
    };
  });

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
      .from("archetype_scores")
      .upsert(scoreRows, { onConflict: "session_id,archetype_key" });
    if (scErr) throw scErr;
  }

  // 6. Upsert analysis_results
  const { error: aErr } = await supabase
    .from("analysis_results")
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        top_archetypes: analysis.topArchetypes,
        dimension_scores: {
          ...analysis.dimensionScores,
          pole_scores: analysis.poleScores,
        },
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
    .from("assessment_sessions")
    .select("client_meta")
    .eq("id", sessionId)
    .maybeSingle();
  const prevMeta = clientMetaFromJson(prevSession?.client_meta);
  const nextMeta: Record<string, unknown> = { ...prevMeta };
  nextMeta.score_version = SCORE_VERSION;
  nextMeta.scoring_model = SCORING_MODEL_MYSS_V3;
  if (consistency) {
    nextMeta.consistency_warning = true;
    nextMeta.conflicting_pair = consistency.conflicting_pair;
  } else {
    delete nextMeta.consistency_warning;
    delete nextMeta.conflicting_pair;
  }
  await supabase
    .from("assessment_sessions")
    .update({ confidence_score: confidence, client_meta: toJson(nextMeta) })
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
  client_meta?: unknown;
}): boolean {
  return clientMetaFromJson(session.client_meta as Json | null | undefined).source === SESSION_SOURCE_ADMIN_GUEST_PREVIEW;
}

async function sessionIdsWithAdminAutoFill(sessionIds: string[]): Promise<Set<string>> {
  if (sessionIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from("assessment_responses")
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
    .from("assessment_sessions")
    .insert({
      user_id: userId,
      template_id: templateId,
      client_meta: toJson(clientMeta ?? {}),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function submitSession(opts: {
  userId: string;
  sessionId: string;
  questions: RuntimeQuestion[];
  responses: ResponseValue[];
  startedAt: number;
}): Promise<{ analysis: AnalysisResult }> {
  const { userId, sessionId, questions, responses, startedAt } = opts;

  const questionById = new Map(questions.map((q) => [q.id, q]));
  const staleResponses = responses.filter((r) => !questionById.has(r.questionId));
  if (staleResponses.length > 0) {
    throw new Error(
      "Responses reference outdated questions. Refresh the page and restart the questionnaire.",
    );
  }

  // 1. Persist responses
  if (responses.length > 0) {
    const payload = responses.map((r) => {
      const q = questionById.get(r.questionId)!;
      const validOptionIds = new Set(q.options.map((o) => o.id));
      const selected = (r.selectedOptionIds ?? []).filter((id) => validOptionIds.has(id));
      return {
        session_id: sessionId,
        question_id: r.questionId,
        user_id: userId,
        selected_option_ids: selected,
        numeric_value: r.numericValue ?? null,
        text_value: r.textValue ?? null,
        raw_payload: toJson({ ...r, selectedOptionIds: selected }),
      };
    });
    const { error: rErr } = await supabase
      .from("assessment_responses")
      .upsert(payload, { onConflict: "session_id,question_id" });
    if (rErr) throw formatSubmitError("Saving responses", rErr);
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
      .from("archetype_scores")
      .upsert(scoreRows, { onConflict: "session_id,archetype_key" });
    if (sErr) throw formatSubmitError("Saving archetype scores", sErr);
  }

  // 4. Persist analysis_result
  const { error: aErr } = await supabase
    .from("analysis_results")
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        top_archetypes: analysis.topArchetypes,
        dimension_scores: {
          ...analysis.dimensionScores,
          pole_scores: analysis.poleScores,
        },
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
  if (aErr) throw formatSubmitError("Saving analysis", aErr);

  // 5. Persist recommendations (non-blocking delete — duplicates are harmless)
  if (recos.length > 0) {
    await supabase
      .from("recommendation_tools")
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
      .from("recommendation_tools")
      .insert(recoRows);
    if (rcErr) throw formatSubmitError("Saving recommendations", rcErr);
  }

  // 6. Read existing client_meta then merge consistency flag
  const { data: prevSession } = await supabase
    .from("assessment_sessions")
    .select("client_meta")
    .eq("id", sessionId)
    .maybeSingle();
  const prevMeta = clientMetaFromJson(prevSession?.client_meta);
  const nextMeta: Record<string, unknown> = { ...prevMeta };
  nextMeta.score_version = SCORE_VERSION;
  nextMeta.scoring_model = questionsLookLikeMyssV4(questions)
    ? SCORING_MODEL_MYSS_V4
    : SCORING_MODEL_MYSS_V3;
  nextMeta.pole_scores = analysis.poleScores;
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
    .from("assessment_sessions")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      duration_seconds: duration,
      confidence_score: confidence,
      client_meta: toJson(nextMeta),
    })
    .eq("id", sessionId);
  if (upErr) throw formatSubmitError("Finalizing session", upErr);

  clearPersistedAssessmentSessionId(userId);
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
  excludeSessionId?: string,
): Promise<AssessmentSessionRow | null> {
  const query = supabase
    .from("assessment_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(2);
  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  const filtered = excludeSessionId
    ? rows.filter((r) => r.id !== excludeSessionId)
    : rows.slice(1);
  return filtered[0] ?? null;
}

/** Fetch normalized archetype scores for a given session (for comparisons). */
export async function getSessionArchetypeScores(sessionId: string) {
  const { data, error } = await supabase
    .from("archetype_scores")
    .select("archetype_key, normalized_score, rank")
    .eq("session_id", sessionId);
  if (error) throw error;
  return data ?? [];
}

/** Fetch shadow signals (0..1) from analysis_results for a session. */
export async function getSessionShadowSignals(sessionId: string) {
  const { data, error } = await supabase
    .from("analysis_results")
    .select("shadow_signals")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return shadowSignalsFromJson(data?.shadow_signals);
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
    .from("archetype_scores")
    .select("archetype_key")
    .eq("session_id", sessionId)
    .order("rank", { ascending: true })
    .limit(3);
  if (error) throw error;
  const fromScores = ((data as { archetype_key: string }[]) ?? []).map((r) => r.archetype_key);
  if (fromScores.length >= 3) return fromScores;

  const { data: analysis } = await supabase
    .from("analysis_results")
    .select("top_archetypes")
    .eq("session_id", sessionId)
    .maybeSingle();
  return ((analysis as { top_archetypes?: string[] } | null)?.top_archetypes ?? []).slice(0, 3);
}

async function deleteSessionsByIds(sessionIds: string[]): Promise<void> {
  if (sessionIds.length === 0) return;
  await supabase.from("assessment_responses").delete().in("session_id", sessionIds);
  await supabase.from("archetype_scores").delete().in("session_id", sessionIds);
  await supabase.from("analysis_results").delete().in("session_id", sessionIds);
  await supabase.from("recommendation_tools").delete().in("session_id", sessionIds);
  await supabase.from("assessment_sessions").delete().in("id", sessionIds);
}

/** Remove preview / polluted / wrong-triad sessions so recovery can run. */
export async function purgeWrongAssessmentSessions(
  userId: string,
  options?: { preferredTriad?: ArchetypeKey[] },
): Promise<number> {
  const { data: sessions, error } = await supabase
    .from("assessment_sessions")
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
    .from("assessment_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(25);
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return null;
  if (options?.includePreviewSessions) return rows[0];

  const autoFillIds = await sessionIdsWithAdminAutoFill(rows.map((r) => r.id));
  for (const s of rows) {
    if (isAdminGuestPreviewSession(s) || autoFillIds.has(s.id)) continue;
    await ensureSessionResultsUpToDate(s.id);
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
    .from("deepdive_responses")
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
    .from("archetype_scores")
    .upsert(scoreRows, { onConflict: "session_id,archetype_key" });
  if (sErr) throw sErr;

  const topKeys = unified.topThree.length > 0 ? unified.topThree : ranked.slice(0, 3).map((s) => s.key);

  const { error: aErr } = await supabase.from("analysis_results").upsert(
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
    .from("assessment_sessions")
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
      .from("archetype_scores")
      .upsert(scoreRows, { onConflict: "session_id,archetype_key" });
    if (sErr) throw sErr;
  }

  const topKeys =
    snapshot.top_archetypes.length > 0
      ? snapshot.top_archetypes.map((t) => t.key)
      : ranked.slice(0, 3).map((s) => s.key);

  const { error: aErr } = await supabase.from("analysis_results").upsert(
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
    .from("assessment_sessions")
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
    .from("assessment_sessions")
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

export interface ArchetypeResetResult {
  ok: boolean;
  user_id?: string;
  t1_sessions_deleted?: number;
  t1_snapshots_deleted?: number;
  t2_responses_deleted?: number;
  error?: string;
}

/** Admin only — wipe T1 onboarding and/or T2 deep-dive data for one user (RPC). */
export async function resetUserArchetypeResults(
  userId: string,
  scope: { t1?: boolean; t2?: boolean },
): Promise<ArchetypeResetResult> {
  const resetT1 = scope.t1 !== false;
  const resetT2 = scope.t2 !== false;
  const { data, error } = await callUntypedRpc("reset_user_archetype_results", {
    p_user_id: userId,
    p_reset_t1: resetT1,
    p_reset_t2: resetT2,
  });
  if (error) throw error;
  const payload = (data ?? {}) as unknown as ArchetypeResetResult;
  if (!payload.ok) {
    throw new Error(payload.error ?? "reset_failed");
  }
  await refreshArchetypeScoresView();
  return payload;
}

export async function getRecoveryDiagnostics(userId: string): Promise<RecoveryDiagnostics> {
  const [sessionsRes, snaps, ddCount] = await Promise.all([
    supabase
      .from("assessment_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "submitted"),
    getSnapshotHistory(userId),
    supabase
      .from("deepdive_responses")
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

export interface GetSessionDetailsOptions {
  /** Skip stale-score recompute when caller already ran ensureSessionResultsUpToDate. */
  skipEnsure?: boolean;
}

export type SessionResultsSummary = {
  session: AssessmentSessionRow | null;
  analysis: AnalysisResultRow | null;
  scores: ArchetypeScoreRow[];
  recommendations: RecommendationToolRow[];
  profile: ProfileRow | null;
  company: CompanyRow | null;
};

function clientMetaRecord(meta: Json | null | undefined): Record<string, unknown> {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return {};
}

/** Read raw 32-pole scores from persisted session / analysis rows. */
export function extractPoleScoresFromSummary(
  summary: Pick<SessionResultsSummary, "session" | "analysis">,
): PoleScores | null {
  const dim = summary.analysis?.dimension_scores;
  if (dim && typeof dim === "object" && !Array.isArray(dim)) {
    const fromDim = parsePoleScoresRecord(
      (dim as Record<string, unknown>).pole_scores,
    );
    if (fromDim) return fromDim;
  }
  const meta = clientMetaRecord(summary.session?.client_meta);
  return parsePoleScoresRecord(meta.pole_scores);
}

export function sessionIsMyssV4(
  summary: Pick<SessionResultsSummary, "session" | "analysis">,
): boolean {
  const meta = clientMetaFromJson(summary.session?.client_meta as Json | null | undefined);
  if (meta.scoring_model === SCORING_MODEL_MYSS_V4) return true;
  return extractPoleScoresFromSummary(summary) !== null;
}

/** V4 activation zones derived from stored pole scores (recomputed on read). */
export function v4PoleAnalysisFromSummary(
  summary: Pick<SessionResultsSummary, "session" | "analysis">,
): V4PoleAnalysis | null {
  const poleScores = extractPoleScoresFromSummary(summary);
  if (!poleScores) return null;
  return buildV4PoleAnalysis(poleScores);
}

async function loadProfileAndCompany(userId: string | undefined | null): Promise<{
  profile: ProfileRow | null;
  company: CompanyRow | null;
}> {
  if (!userId) return { profile: null, company: null };
  const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!p?.company_id) return { profile: p, company: null };
  const { data: c } = await supabase
    .from("companies")
    .select("*")
    .eq("id", p.company_id)
    .maybeSingle();
  return { profile: p, company: c };
}

/** Lightweight read for results / deep-dive UI — no question catalog or raw responses. */
export async function getSessionResultsSummary(
  sessionId: string,
  options?: GetSessionDetailsOptions,
): Promise<SessionResultsSummary> {
  if (!options?.skipEnsure) {
    await ensureSessionResultsUpToDate(sessionId);
  }

  const [sessionRes, analysisRes, scoresRes, recosRes] = await Promise.all([
    supabase.from("assessment_sessions").select("*").eq("id", sessionId).maybeSingle(),
    supabase.from("analysis_results").select("*").eq("session_id", sessionId).maybeSingle(),
    supabase.from("archetype_scores").select("*").eq("session_id", sessionId).order("rank"),
    supabase.from("recommendation_tools").select("*").eq("session_id", sessionId).order("rank"),
  ]);

  const { profile, company } = await loadProfileAndCompany(sessionRes.data?.user_id);

  return {
    session: sessionRes.data,
    analysis: analysisRes.data,
    scores: scoresRes.data ?? [],
    recommendations: recosRes.data ?? [],
    profile,
    company,
  };
}

export async function getSessionFullDetails(
  sessionId: string,
  options?: GetSessionDetailsOptions,
) {
  if (!options?.skipEnsure) {
    await ensureSessionResultsUpToDate(sessionId);
  }

  const [sessionRes, analysisRes, scoresRes, recosRes, responsesRes] = await Promise.all([
    supabase.from("assessment_sessions").select("*").eq("id", sessionId).maybeSingle(),
    supabase.from("analysis_results").select("*").eq("session_id", sessionId).maybeSingle(),
    supabase.from("archetype_scores").select("*").eq("session_id", sessionId).order("rank"),
    supabase.from("recommendation_tools").select("*").eq("session_id", sessionId).order("rank"),
    supabase.from("assessment_responses").select("*").eq("session_id", sessionId),
  ]);

  const templateId = sessionRes.data?.template_id;
  const [questionsRes, profileCompany] = await Promise.all([
    templateId
      ? supabase
          .from("assessment_questions")
          .select("*, assessment_options(*)")
          .eq("template_id", templateId)
          .order("position")
      : Promise.resolve({ data: [] as QuestionWithOptions[], error: null }),
    loadProfileAndCompany(sessionRes.data?.user_id),
  ]);
  if (questionsRes.error) throw questionsRes.error;

  return {
    session: sessionRes.data,
    analysis: analysisRes.data,
    scores: scoresRes.data ?? [],
    recommendations: recosRes.data ?? [],
    responses: responsesRes.data ?? [],
    questions: (questionsRes.data ?? []) as QuestionWithOptions[],
    profile: profileCompany.profile,
    company: profileCompany.company,
  };
}

export async function listAllSessionsForAdmin() {
  const { data, error } = await supabase
    .from("assessment_sessions")
    .select("*")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) throw error;
  const sessions = data ?? [];
  if (sessions.length === 0) return [];

  const userIds = Array.from(new Set(sessions.map((s) => s.user_id)));
  const sessionIds = sessions.map((s) => s.id);

  const [profilesRes, companiesRes, analysisRes, scoresRes] = await Promise.all([
    supabase.from("profiles").select("*").in("id", userIds),
    supabase.from("companies").select("*"),
    supabase.from("analysis_results").select("session_id, top_archetypes, shadow_signals").in("session_id", sessionIds),
    supabase.from("archetype_scores").select("session_id, archetype_key, rank").in("session_id", sessionIds).eq("rank", 1),
  ]);

  const profiles = profilesRes.data ?? [];
  const companies = companiesRes.data ?? [];
  const analyses = analysisRes.data ?? [];
  const topScores = scoresRes.data ?? [];

  return sessions.map((s) => {
    const p = profiles.find((x) => x.id === s.user_id);
    const c = p?.company_id ? companies.find((x) => x.id === p.company_id) : null;
    const a = analyses.find((x) => x.session_id === s.id);
    const top = topScores.find((x) => x.session_id === s.id)?.archetype_key
      ?? a?.top_archetypes?.[0]
      ?? null;
    const shadowCount = a?.shadow_signals
      ? Object.values(shadowSignalsFromJson(a.shadow_signals)).filter((v) => v >= 0.3).length
      : 0;
    return { ...s, profile: p ?? null, company: c ?? null, top_archetype: top, shadow_count: shadowCount };
  });
}

export async function saveAdminNote(sessionId: string, notes: string) {
  const { error } = await supabase
    .from("analysis_results")
    .update({ admin_notes: notes })
    .eq("session_id", sessionId);
  if (error) throw error;
}

export function archetypeMeta(key: ArchetypeKey) {
  return ARCHETYPES.find((a) => a.key === key);
}
