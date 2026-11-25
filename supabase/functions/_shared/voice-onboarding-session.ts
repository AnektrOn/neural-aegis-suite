/** Phase 2 — sessions « LOGOS - Onboarding Report » (agent global, KB par membre au token). */

// deno-lint-ignore no-explicit-any
type Admin = any;

export type VoiceAgentKind = "personal_logos" | "onboarding_report";

/** Resolve the workspace onboarding agent from elevenlabs_settings. */
export async function resolveOnboardingReportAgentId(admin: Admin): Promise<string | null> {
  const { data, error } = await admin
    .from("elevenlabs_settings")
    .select("onboarding_report_agent_id")
    .eq("id", true)
    .maybeSingle();
  if (error) {
    console.error("resolveOnboardingReportAgentId", error.message);
    return null;
  }
  const id = data?.onboarding_report_agent_id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

/**
 * Product gate (phase 2 UI): unlock voice after report + optional 48h + RDV.
 * Implement when onboarding funnel wires VITE_VISITOR_AUDIT_BOOKING_URL.
 */
export function isOnboardingVoiceUnlocked(_params: {
  reportPublishedAt: string | null;
  now?: Date;
  delayHours?: number;
}): boolean {
  return false;
}