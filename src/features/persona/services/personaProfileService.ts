import { supabase } from "@/integrations/supabase/client";
import {
  ensureSessionResultsUpToDate,
  getSessionTopArchetypes,
  isAdminGuestPreviewSession,
  isPollutedAssessmentTriad,
  recomputeAllStaleV3SessionsForUser,
} from "@/features/archetype-assessment/services/assessmentService";
import { buildDynamicProfile } from "@/features/archetype-deepdive-v2/domain/dynamicProfileBuilder";
import type { SampleProfile } from "@/features/archetype-deepdive-v2/domain/sampleProfile";
import type { Locale } from "@/i18n/translations";

const SESSION_LIMIT = 12;

/** Fast path: batch triage, no unified scorer, no full question catalog. */
async function findLatestValidSessionId(userId: string): Promise<string | null> {
  const { data: sessions, error } = await supabase
    .from("assessment_sessions" as any)
    .select("id, client_meta, submitted_at")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(SESSION_LIMIT);
  if (error) throw error;

  const rows = (sessions as { id: string; client_meta?: Record<string, unknown> }[]) ?? [];
  if (rows.length === 0) return null;

  const ids = rows.map((r) => r.id);

  const { data: autoFillRows, error: autoFillRes } = await supabase
    .from("assessment_responses" as any)
    .select("session_id")
    .in("session_id", ids)
    .eq("text_value", "Admin auto-fill");
  if (autoFillRes) throw autoFillRes;

  const autoFillIds = new Set(
    ((autoFillRows as { session_id: string }[]) ?? []).map((r) => r.session_id),
  );

  for (const s of rows) {
    if (isAdminGuestPreviewSession(s) || autoFillIds.has(s.id)) continue;
    await ensureSessionResultsUpToDate(s.id);
    const top = await getSessionTopArchetypes(s.id);
    if (top.length >= 3 && isPollutedAssessmentTriad(top)) continue;
    return s.id;
  }

  return null;
}

export async function loadPersonaProfile(
  userId: string,
  locale: Locale,
  displayName?: string | null,
): Promise<SampleProfile | null> {
  await recomputeAllStaleV3SessionsForUser(userId);

  const sessionId = await findLatestValidSessionId(userId);
  if (!sessionId) return null;

  await ensureSessionResultsUpToDate(sessionId);

  const [scoresRes, analysisRes, profileRes] = await Promise.all([
    supabase
      .from("archetype_scores" as any)
      .select("archetype_key, normalized_score, rank")
      .eq("session_id", sessionId)
      .order("rank", { ascending: true }),
    supabase
      .from("analysis_results" as any)
      .select(
        "top_archetypes, shadow_signals, strengths_fr, strengths_en, watchouts_fr, watchouts_en, summary_fr, summary_en",
      )
      .eq("session_id", sessionId)
      .maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
  ]);

  if (scoresRes.error) throw scoresRes.error;
  if (analysisRes.error) throw analysisRes.error;
  if (profileRes.error) throw profileRes.error;

  const scores = (scoresRes.data as any[]) ?? [];
  if (scores.length === 0) return null;

  const name =
    displayName ?? (profileRes.data as { display_name?: string | null } | null)?.display_name ?? null;

  return buildDynamicProfile({
    sessionId,
    displayName: name,
    scores,
    analysis: (analysisRes.data as any) ?? null,
    locale,
    unified: null,
  });
}
