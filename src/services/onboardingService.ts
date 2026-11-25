import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  markExecutiveOnboardingDone,
  useOnboardingStore,
  type OnboardingProfileFields,
  type OnboardingProfileSnapshot,
  type OnboardingStakeholder,
  type OnboardingStep,
  type RawDilemmaAnswer,
} from "@/store/useOnboardingStore";

type ExecProfileInsert = Database["public"]["Tables"]["user_executive_profiles"]["Insert"];
type ExecProfileRow = Database["public"]["Tables"]["user_executive_profiles"]["Row"];

export type PartialOnboardingSync = Partial<OnboardingProfileFields> & {
  onboarding_step_reached?: OnboardingStep;
};

export interface FinalizeOnboardingResult {
  success: boolean;
  clarity_score?: number;
  error?: string;
}

export interface RemoteExecutiveOnboardingState {
  onboardingCompleted: boolean;
  profile: Partial<OnboardingProfileFields> & {
    currentStep?: OnboardingStep;
    completedAt?: string | null;
  } | null;
}

const SYNC_DEBOUNCE_MS = 400;
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingPatches = new Map<string, PartialOnboardingSync>();

async function resolveUserId(explicitUserId?: string | null): Promise<string | null> {
  if (explicitUserId) return explicitUserId;
  const storeUser = useOnboardingStore.getState().ownerUserId;
  if (storeUser) return storeUser;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

function buildUpsertPayload(
  userId: string,
  data: PartialOnboardingSync,
): ExecProfileInsert {
  const payload: ExecProfileInsert = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if ("role_title" in data) payload.role_title = data.role_title ?? null;
  if ("company_stage" in data) payload.company_stage = data.company_stage ?? null;
  if ("team_size" in data) payload.team_size = data.team_size ?? null;
  if ("annual_revenue_bracket" in data) {
    payload.annual_revenue_bracket = data.annual_revenue_bracket ?? null;
  }
  if ("governance_structure" in data) {
    payload.governance_structure = data.governance_structure ?? null;
  }
  if ("primary_stakeholders" in data && data.primary_stakeholders) {
    payload.primary_stakeholders = data.primary_stakeholders
      .filter((s) => s.name.trim().length > 0)
      .map((s) => ({
        id: s.id,
        name: s.name.trim(),
        role: s.role,
        ...(s.role_label ? { role_label: s.role_label } : {}),
        tension_level: s.tension_level,
      })) as unknown as Json;
  }
  if ("urgent_decision_title" in data) {
    payload.urgent_decision_title = data.urgent_decision_title?.trim() || null;
  }
  if ("urgent_decision_stakes" in data) {
    payload.urgent_decision_stakes = data.urgent_decision_stakes?.trim() || null;
  }
  if ("urgent_decision_horizon" in data) {
    payload.urgent_decision_horizon = data.urgent_decision_horizon ?? null;
  }
  if ("dominant_decision_friction" in data) {
    payload.dominant_decision_friction = data.dominant_decision_friction ?? null;
  }
  if ("raw_dilemma_responses" in data && data.raw_dilemma_responses) {
    payload.raw_dilemma_responses = data.raw_dilemma_responses as unknown as Json;
  }
  if ("peak_focus_time" in data) {
    payload.peak_focus_time = data.peak_focus_time ?? null;
  }
  if ("stress_symptoms" in data && data.stress_symptoms) {
    payload.stress_symptoms = data.stress_symptoms;
  }
  if ("onboarding_step_reached" in data && data.onboarding_step_reached) {
    payload.onboarding_step_reached = data.onboarding_step_reached;
  }

  return payload;
}

/**
 * Debounced, non-blocking upsert into `public.user_executive_profiles`.
 * Safe to invoke on every step interaction on mobile WebView / desktop.
 */
export function syncStepToSupabase(
  partialData: PartialOnboardingSync,
  explicitUserId?: string | null,
): void {
  const key = explicitUserId || useOnboardingStore.getState().ownerUserId || "__active__";
  const merged: PartialOnboardingSync = {
    ...(pendingPatches.get(key) ?? {}),
    ...partialData,
  };
  pendingPatches.set(key, merged);

  const existingTimer = pendingTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    pendingTimers.delete(key);
    const patchToWrite = pendingPatches.get(key);
    pendingPatches.delete(key);
    if (!patchToWrite) return;

    void (async () => {
      try {
        const uid = await resolveUserId(explicitUserId);
        if (!uid) return;
        const payload = buildUpsertPayload(uid, patchToWrite);
        const { error } = await supabase
          .from("user_executive_profiles")
          .upsert(payload, { onConflict: "user_id" });
        if (error) {
          console.warn("[onboardingService] syncStepToSupabase:", error.message);
        }
      } catch (err) {
        console.warn("[onboardingService] syncStepToSupabase failed:", err);
      }
    })();
  }, SYNC_DEBOUNCE_MS);

  pendingTimers.set(key, timer);
}

/**
 * Cancels any pending debounced patch and writes the full onboarding snapshot immediately.
 */
export async function flushSyncToSupabase(
  fullSnapshot: OnboardingProfileSnapshot,
  userId: string,
): Promise<void> {
  for (const key of [userId, "__active__"]) {
    const timer = pendingTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      pendingTimers.delete(key);
    }
    pendingPatches.delete(key);
  }

  const payload = buildUpsertPayload(userId, fullSnapshot);
  const { error } = await supabase
    .from("user_executive_profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    throw new Error(error.message);
  }
}

function clampStep(step: number | null | undefined): OnboardingStep {
  if (step === 2 || step === 3 || step === 4 || step === 5) return step;
  return 1;
}

function parseRemoteRow(row: ExecProfileRow): RemoteExecutiveOnboardingState["profile"] {
  const stakeholders = Array.isArray(row.primary_stakeholders)
    ? (row.primary_stakeholders as unknown as OnboardingStakeholder[])
    : [];
  const rawDilemmas =
    row.raw_dilemma_responses &&
    typeof row.raw_dilemma_responses === "object" &&
    !Array.isArray(row.raw_dilemma_responses)
      ? (row.raw_dilemma_responses as unknown as Record<string, RawDilemmaAnswer>)
      : {};

  return {
    currentStep: clampStep(row.onboarding_step_reached),
    role_title: row.role_title,
    company_stage: row.company_stage,
    team_size: row.team_size,
    annual_revenue_bracket: row.annual_revenue_bracket,
    governance_structure: row.governance_structure,
    primary_stakeholders: stakeholders,
    urgent_decision_title: row.urgent_decision_title ?? "",
    urgent_decision_stakes: row.urgent_decision_stakes ?? "",
    urgent_decision_horizon: row.urgent_decision_horizon,
    dominant_decision_friction: row.dominant_decision_friction,
    raw_dilemma_responses: rawDilemmas,
    peak_focus_time: row.peak_focus_time,
    stress_symptoms: Array.isArray(row.stress_symptoms) ? row.stress_symptoms : [],
    completedAt: row.completed_at,
  };
}

/**
 * Parallel fetch of completion flag (`profiles.onboarding_completed`) and remote draft (`user_executive_profiles`).
 */
export async function fetchExecutiveOnboardingRemote(
  userId: string,
): Promise<RemoteExecutiveOnboardingState> {
  const [profileRes, execRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_executive_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const execRow = execRes.data ?? null;
  const completedFlag = Boolean(
    profileRes.data?.onboarding_completed || execRow?.completed_at,
  );

  return {
    onboardingCompleted: completedFlag,
    profile: execRow ? parseRemoteRow(execRow) : null,
  };
}

/**
 * Flushes local answers to Supabase, executes `finalize_onboarding_and_populate_cockpit()`,
 * marks completion flag for the user, and wipes the draft `localStorage` key.
 */
export async function finalizeOnboarding(
  explicitUserId?: string | null,
): Promise<FinalizeOnboardingResult> {
  const uid = await resolveUserId(explicitUserId);
  if (!uid) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const snapshot = useOnboardingStore.getState().getProfileSnapshot();
  await flushSyncToSupabase(snapshot, uid);

  const { data, error } = await supabase.rpc("finalize_onboarding_and_populate_cockpit");
  if (error) {
    throw new Error(error.message);
  }

  const result = (data ?? null) as unknown as FinalizeOnboardingResult | null;
  if (!result?.success) {
    throw new Error(result?.error ?? "FINALIZE_ONBOARDING_FAILED");
  }

  markExecutiveOnboardingDone(uid);
  useOnboardingStore.getState().resetOnboarding();

  return result;
}
