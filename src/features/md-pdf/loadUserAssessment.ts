import { supabase } from "@/integrations/supabase/client";
import {
  pdfUserHandles,
  rowsFromScores,
  type MdPdfAssessment,
} from "./assessmentPrint";
import type { MdPdfMeta } from "./markdownToPrintHtml";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function escapeIlike(value: string): string {
  return value.replace(/[%_]/g, (ch) => `\\${ch}`);
}

async function findProfile(handle: string): Promise<{ id: string; display_name: string | null } | null> {
  const needle = handle.trim();
  if (!needle) return null;

  if (UUID.test(needle)) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", needle)
      .maybeSingle();
    if (error) {
      console.error("[md-pdf] profile by id", error.message);
      return null;
    }
    return data;
  }

  const { data: exact, error: exactErr } = await supabase
    .from("profiles")
    .select("id, display_name")
    .ilike("display_name", needle)
    .limit(1)
    .maybeSingle();
  if (exactErr) {
    console.error("[md-pdf] profile exact", exactErr.message);
  }
  if (exact) return exact;

  const fuzzy = `%${escapeIlike(needle)}%`;
  const quoted = `"${fuzzy.replace(/"/g, "")}"`;
  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, display_name, first_name, last_name")
    .or(`display_name.ilike.${quoted},first_name.ilike.${quoted},last_name.ilike.${quoted}`)
    .limit(8);

  if (error) {
    console.error("[md-pdf] profile search", error.message);
    const fallback = await findProfileByColumns(needle, fuzzy);
    if (fallback) return fallback;
    return null;
  }
  const list = rows ?? [];
  const lower = needle.toLowerCase();
  const best =
    list.find((p) => (p.display_name ?? "").toLowerCase() === lower) ??
    list.find((p) => (p.display_name ?? "").toLowerCase().startsWith(lower)) ??
    list.find((p) => `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase().includes(lower)) ??
    list[0];
  return best ? { id: best.id, display_name: best.display_name } : null;
}

async function findProfileByColumns(
  needle: string,
  fuzzy: string,
): Promise<{ id: string; display_name: string | null } | null> {
  for (const column of ["display_name", "first_name", "last_name"] as const) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name")
      .ilike(column, fuzzy)
      .limit(8);
    if (error) {
      console.error("[md-pdf] profile column search", column, error.message);
      continue;
    }
    const lower = needle.toLowerCase();
    const best =
      (data ?? []).find((p) => (p.display_name ?? "").toLowerCase() === lower) ??
      (data ?? [])[0];
    if (best) return best;
  }
  return null;
}

async function loadScoresForUser(userId: string) {
  const { data: sessions, error: sessionErr } = await supabase
    .from("assessment_sessions")
    .select("id, submitted_at")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(5);
  if (sessionErr) {
    console.error("[md-pdf] sessions", sessionErr.message);
    return { sessionId: null as string | null, submittedAt: null as string | null, scores: [] as Array<{
      archetype_key: string;
      rank: number;
      raw_score: number;
      normalized_score: number;
    }> };
  }

  for (const session of sessions ?? []) {
    const { data: scores, error } = await supabase
      .from("archetype_scores")
      .select("archetype_key, rank, raw_score, normalized_score")
      .eq("session_id", session.id)
      .order("rank", { ascending: true });
    if (error) {
      console.error("[md-pdf] scores", error.message);
      continue;
    }
    if ((scores ?? []).length > 0) {
      return { sessionId: session.id, submittedAt: session.submitted_at, scores: scores ?? [] };
    }
  }

  const { data: fallback } = await supabase
    .from("archetype_scores")
    .select("archetype_key, rank, raw_score, normalized_score, session_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(32);

  const latestSessionId = fallback?.[0]?.session_id ?? null;
  const latestScores = (fallback ?? []).filter((s) =>
    latestSessionId ? s.session_id === latestSessionId : true,
  );

  return {
    sessionId: latestSessionId,
    submittedAt: null,
    scores: latestScores.map((s) => ({
      archetype_key: s.archetype_key,
      rank: s.rank,
      raw_score: s.raw_score,
      normalized_score: s.normalized_score,
    })),
  };
}

export async function loadUserAssessmentForPdf(
  meta: Pick<MdPdfMeta, "user" | "tags">,
  locale: "fr" | "en" = "fr",
): Promise<MdPdfAssessment | null> {
  const handles = pdfUserHandles(meta.user, meta.tags);
  for (const handle of handles) {
    try {
      const profile = await findProfile(handle);
      if (!profile) continue;
      const loaded = await loadScoresForUser(profile.id);
      if (loaded.scores.length === 0) continue;
      const scores = rowsFromScores(loaded.scores, locale);
      if (scores.length === 0) continue;
      return {
        userId: profile.id,
        displayName: profile.display_name || handle,
        submittedAt: loaded.submittedAt,
        scores,
        top: scores.slice(0, 3),
      };
    } catch (err) {
      console.error("[md-pdf] load assessment", err);
    }
  }
  return null;
}
