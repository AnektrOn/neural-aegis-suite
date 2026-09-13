import { supabase } from "@/integrations/supabase/client";
import { isAnonymousUser, isGuestUser } from "@/lib/authVisitor";
import { notifyAdminOnJournalEntry } from "@/services/adminNotifications";
import type { User } from "@supabase/supabase-js";

/** Maps a toolbox slug to the engine id used in journal tags. */
const SLUG_TO_ENGINE: Record<string, string> = {
  journal_prompt: "stream",
  journal_stream: "stream",
  morning_pages: "stream",
  letter_unsent: "stream",
  gratitude: "savor",
  gratitude_triple: "savor",
  intention: "intend",
  intention_morning: "intend",
  intention_week: "intend",
  belief_reframe: "reframe",
  dialogue_parts: "voices",
  empathy_perspective: "bridge",
  boundary_practice: "edge",
  sacred_no: "edge",
  shadow_checkin: "gauge",
  decision_matrix: "weigh",
  energy_ledger: "ledger",
  worry_dump: "stream",
  evening_review: "sequence",
};

export function engineTagForToolboxSlug(slug: string): string {
  return SLUG_TO_ENGINE[slug] ?? "stream";
}

export function formatLabeledJournalContent(
  sections: Array<{ label: string; body: string }>,
): string {
  return sections
    .filter((s) => s.body.trim().length > 0)
    .map((s) => `## ${s.label.trim()}\n${s.body.trim()}`)
    .join("\n\n");
}

export interface SaveToolboxWritingInput {
  user: User | null | undefined;
  title: string;
  content: string;
  slug: string;
  extraTags?: string[];
  moodScore?: number | null;
}

export async function saveToolboxWritingToJournal(
  input: SaveToolboxWritingInput,
): Promise<{ ok: true; skipped?: boolean } | { ok: false; error: string }> {
  const content = input.content.trim();
  if (!content) return { ok: false, error: "empty" };

  const user = input.user;
  if (!user || isAnonymousUser(user) || isGuestUser(user)) {
    return { ok: true, skipped: true };
  }

  const engine = engineTagForToolboxSlug(input.slug);
  const tags = Array.from(
    new Set(["toolbox", engine, input.slug, ...(input.extraTags ?? [])].filter(Boolean)),
  );

  try {
    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      title: input.title.trim() || null,
      content,
      tags,
      mood_score: input.moodScore ?? null,
    });
    if (error) {
      console.error("[journal] toolbox write failed:", error.message);
      return { ok: false, error: error.message };
    }
    void notifyAdminOnJournalEntry({
      user,
      title: input.title.trim() || null,
      content,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[journal] toolbox write failed:", message);
    return { ok: false, error: message };
  }
}

/** Map a 0–10 gauge to journal mood_score 1–5. */
export function moodScoreFromGauge(intensity0to10: number): number {
  return Math.min(5, Math.max(1, Math.round(intensity0to10 / 2) || 1));
}
