import { supabase } from "@/integrations/supabase/client";

export type UserMaturityLevel = "new" | "emerging" | "active" | "established";

export interface UserMaturityProfile {
  level: UserMaturityLevel;
  daysActive: number;
  totalLogs: number;
  hasArchetypeProfile: boolean;
  hasAnyMood: boolean;
  hasAnyDecision: boolean;
  hasAnyJournal: boolean;
  hasAnyContact: boolean;
  /** 0–100, how "set up" the profile is */
  completionScore: number;
}

const WEIGHTS = {
  archetype: 40,
  mood: 20,
  decision: 15,
  journal: 15,
  contact: 10,
} as const;

function diffDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function deriveLevel(
  daysActive: number,
  completionScore: number
): UserMaturityLevel {
  if (daysActive <= 1 || completionScore < 20) return "new";
  if (daysActive > 30 || completionScore >= 80) return "established";
  if (daysActive >= 8 && completionScore >= 60) return "active";
  return "emerging";
}

export async function getUserMaturityProfile(
  userId: string
): Promise<UserMaturityProfile> {
  // Profile creation date (fallback to now if missing)
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle();

  const createdAt = profile?.created_at
    ? new Date(profile.created_at)
    : new Date();
  const daysActive = diffDays(createdAt, new Date());

  // Run probes in parallel — head:true keeps payloads minimal
  const [
    archetypeRes,
    moodRes,
    decisionRes,
    journalRes,
    contactRes,
  ] = await Promise.all([
    supabase
      .from("archetype_scores")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("mood_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("decisions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("people_contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  // Habit completions count too — separate so failure of one doesn't abort
  const { count: habitCount } = await supabase
    .from("habit_completions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const archetypeCount = archetypeRes.count ?? 0;
  const moodCount = moodRes.count ?? 0;
  const decisionCount = decisionRes.count ?? 0;
  const journalCount = journalRes.count ?? 0;
  const contactCount = contactRes.count ?? 0;

  const hasArchetypeProfile = archetypeCount > 0;
  const hasAnyMood = moodCount > 0;
  const hasAnyDecision = decisionCount > 0;
  const hasAnyJournal = journalCount > 0;
  const hasAnyContact = contactCount > 0;

  const totalLogs =
    moodCount + decisionCount + journalCount + (habitCount ?? 0);

  const completionScore = Math.min(
    100,
    (hasArchetypeProfile ? WEIGHTS.archetype : 0) +
      (hasAnyMood ? WEIGHTS.mood : 0) +
      (hasAnyDecision ? WEIGHTS.decision : 0) +
      (hasAnyJournal ? WEIGHTS.journal : 0) +
      (hasAnyContact ? WEIGHTS.contact : 0)
  );

  return {
    level: deriveLevel(daysActive, completionScore),
    daysActive,
    totalLogs,
    hasArchetypeProfile,
    hasAnyMood,
    hasAnyDecision,
    hasAnyJournal,
    hasAnyContact,
    completionScore,
  };
}
