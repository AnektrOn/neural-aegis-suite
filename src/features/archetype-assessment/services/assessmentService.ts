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
import type {
  AnalysisResult,
  ArchetypeKey,
  ResponseValue,
  RuntimeQuestion,
} from "../domain/types";

const TEMPLATE_SLUG = "archetype-v1";

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

  // Fetch questions
  let questions = await fetchQuestions(template.id);

  // Auto-seed if empty (single source of truth = TS domain seed)
  if (questions.length === 0) {
    await seedQuestions(template.id);
    questions = await fetchQuestions(template.id);
  }

  return { template, questions };
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
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                   */
/* -------------------------------------------------------------------------- */

export async function createSession(
  userId: string,
  templateId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("assessment_sessions" as any)
    .insert({ user_id: userId, template_id: templateId })
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

  return { analysis };
}

/* -------------------------------------------------------------------------- */
/* Read helpers (results page + admin)                                        */
/* -------------------------------------------------------------------------- */

export async function getLatestSubmittedSessionForUser(userId: string) {
  const { data, error } = await supabase
    .from("assessment_sessions" as any)
    .select("*")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as any | null;
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
