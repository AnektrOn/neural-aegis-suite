import { supabase } from "@/integrations/supabase/client";
import { TOTAL_ONBOARDING_MICRO_STEPS } from "@/features/onboarding/onboardingPrimitives";

const VISITOR_KEY_STORAGE = "aegis_exec_funnel_visitor:v1";
const ABANDON_SENT_SESSION = "aegis_exec_funnel_abandon_sent";

export type FunnelEventType = "step_view" | "abandon" | "complete";

function randomVisitorKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function getExecutiveOnboardingVisitorKey(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY_STORAGE);
    if (existing && existing.length >= 8) return existing;
    const next = randomVisitorKey();
    localStorage.setItem(VISITOR_KEY_STORAGE, next);
    return next;
  } catch {
    return randomVisitorKey();
  }
}

export function markExecutiveOnboardingCompleteTracked(): void {
  try {
    sessionStorage.setItem(ABANDON_SENT_SESSION, "1");
  } catch {
    /* ignore */
  }
}

export function shouldSkipAbandonTracking(): boolean {
  try {
    return sessionStorage.getItem(ABANDON_SENT_SESSION) === "1";
  } catch {
    return false;
  }
}

export async function recordExecutiveOnboardingFunnel(params: {
  eventType: FunnelEventType;
  microStep: number;
  locale?: string;
  contactEmail?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const visitorKey = getExecutiveOnboardingVisitorKey();
  const contactEmail = params.contactEmail?.trim() || undefined;

  try {
    const { error } = await supabase.rpc("record_executive_onboarding_funnel" as never, {
      p_visitor_key: visitorKey,
      p_event_type: params.eventType,
      p_micro_step: params.microStep,
      p_total_steps: TOTAL_ONBOARDING_MICRO_STEPS,
      p_locale: params.locale ?? null,
      p_contact_email: contactEmail ?? null,
      p_metadata: params.metadata ?? {},
    } as never);

    if (error) {
      console.warn("[executiveOnboardingFunnel]", error.message);
    }
  } catch (err) {
    console.warn("[executiveOnboardingFunnel]", err);
  }
}