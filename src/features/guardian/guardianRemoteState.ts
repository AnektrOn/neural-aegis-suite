import { supabase } from "@/integrations/supabase/client";
import { GUARDIAN_DEFAULT_STATE, type GuardianPersistedState } from "./types";

/** Normalizes any stored payload into a valid Guardian state. */
export function normalizeGuardianState(
  raw: unknown,
): GuardianPersistedState | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<GuardianPersistedState>;
  const locale =
    parsed.locale === "fr" || parsed.locale === "en" ? parsed.locale : null;
  return { ...GUARDIAN_DEFAULT_STATE, ...parsed, locale, version: 1 };
}

/** Higher = further along the onboarding funnel. */
export function guardianProgressRank(state: GuardianPersistedState): number {
  if (
    state.status === "completed" ||
    state.status === "declined" ||
    state.status === "skipped"
  ) {
    return 100;
  }
  if (state.status === "pending") return 0;
  // active
  let rank = 1;
  if (state.gender) rank += 1;
  if (state.locale) rank += 1;
  rank += state.step;
  if (state.postQuizChoice) rank += 1;
  if (state.decisionDone) rank += 1;
  return rank;
}

export async function fetchGuardianState(
  userId: string,
): Promise<GuardianPersistedState | null> {
  const { data, error } = await supabase
    .from("guardian_onboarding")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return normalizeGuardianState((data as { state: unknown }).state);
}

export async function persistGuardianState(
  userId: string,
  state: GuardianPersistedState,
): Promise<void> {
  const completed =
    state.status === "completed" ||
    state.status === "declined" ||
    state.status === "skipped";
  await supabase.from("guardian_onboarding").upsert(
    {
      user_id: userId,
      state: state as unknown as Record<string, unknown>,
      status: state.status,
      step: state.step,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id" },
  );
}
