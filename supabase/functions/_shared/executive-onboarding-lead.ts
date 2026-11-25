import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { escapeHtml } from "../send-email-notification/activity-rules.ts";

export type ExecutiveLeadRow = {
  userId: string;
  completedAt: string;
  authEmail: string | null;
  fullName: string;
  contactEmail: string;
  birthDate: string;
  location: string;
  occupation: string;
  urgentDecision: string;
  stakeholders: string;
  clarityScore: string;
};

export function decodeExecutiveProfile(
  row: Record<string, unknown>,
): Omit<ExecutiveLeadRow, "userId" | "completedAt" | "authEmail" | "clarityScore"> {
  const stakeholders = Array.isArray(row.primary_stakeholders)
    ? (row.primary_stakeholders as { name?: string }[])
        .map((s) => (typeof s?.name === "string" ? s.name.trim() : ""))
        .filter(Boolean)
        .join(", ")
    : "";

  return {
    fullName: String(row.annual_revenue_bracket ?? "").trim(),
    contactEmail: String(row.team_size ?? "").trim(),
    birthDate: String(row.company_stage ?? "").trim(),
    location: String(row.governance_structure ?? "").trim(),
    occupation: String(row.role_title ?? "").trim(),
    urgentDecision: String(row.urgent_decision_title ?? "").trim(),
    stakeholders,
  };
}

export async function loadExecutiveLead(
  admin: SupabaseClient,
  userId: string,
): Promise<ExecutiveLeadRow | null> {
  const [{ data: exec }, { data: auth }, { data: score }] = await Promise.all([
    admin.from("user_executive_profiles").select("*").eq("user_id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId),
    admin
      .from("aegis_health_scores")
      .select("overall_score, computed_at")
      .eq("user_id", userId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!exec) return null;

  const decoded = decodeExecutiveProfile(exec as Record<string, unknown>);
  const completedAt =
    (exec.completed_at as string | null) ??
    (score?.computed_at as string | undefined) ??
    new Date().toISOString();

  return {
    userId,
    completedAt,
    authEmail: auth?.user?.email ?? null,
    clarityScore: score?.overall_score != null ? String(score.overall_score) : "",
    ...decoded,
  };
}

export function executiveOnboardingAdminHtml(lead: ExecutiveLeadRow): string {
  return [
    "<h2>Pré-onboarding exécutif complété</h2>",
    `<p><strong>Membre :</strong> ${escapeHtml(lead.fullName || lead.authEmail || lead.userId)}</p>`,
    `<p><strong>Email compte :</strong> ${escapeHtml(lead.authEmail ?? "—")}</p>`,
    `<p><strong>Email saisi (pré-login) :</strong> ${escapeHtml(lead.contactEmail || "—")}</p>`,
    `<p><strong>Occupation :</strong> ${escapeHtml(lead.occupation)}</p>`,
    `<p><strong>Lieu :</strong> ${escapeHtml(lead.location)}</p>`,
    `<p><strong>Décision urgente :</strong> ${escapeHtml(lead.urgentDecision)}</p>`,
    `<p><strong>Parties prenantes :</strong> ${escapeHtml(lead.stakeholders || "—")}</p>`,
    `<p><strong>Score clarté (cockpit) :</strong> ${escapeHtml(lead.clarityScore || "—")}</p>`,
    `<p><strong>Terminé le :</strong> ${escapeHtml(lead.completedAt)} (UTC)</p>`,
    `<p><a href="https://aegis.humancatalystbeacon.com/admin/users">Voir dans l’admin</a></p>`,
  ].join("");
}

export type FunnelEventRow = {
  id: string;
  createdAt: string;
  visitorKey: string;
  userId: string | null;
  microStep: number;
  totalSteps: number;
  locale: string | null;
  contactEmail: string | null;
  metadata: Record<string, unknown>;
};

export async function loadFunnelEvent(
  admin: SupabaseClient,
  eventId: string,
): Promise<FunnelEventRow | null> {
  const { data, error } = await admin
    .from("executive_onboarding_funnel_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id as string,
    createdAt: data.created_at as string,
    visitorKey: data.visitor_key as string,
    userId: (data.user_id as string | null) ?? null,
    microStep: Number(data.micro_step ?? 0),
    totalSteps: Number(data.total_steps ?? 11),
    locale: (data.locale as string | null) ?? null,
    contactEmail: (data.contact_email as string | null) ?? null,
    metadata: (data.metadata as Record<string, unknown>) ?? {},
  };
}

export function executiveOnboardingAbandonHtml(event: FunnelEventRow): string {
  const meta = event.metadata;
  const name = typeof meta.full_name === "string" ? meta.full_name : "";
  const occupation = typeof meta.occupation === "string" ? meta.occupation : "";
  return [
    "<h2>Pré-onboarding abandonné</h2>",
    `<p><strong>Étape atteinte :</strong> ${event.microStep} / ${event.totalSteps}</p>`,
    `<p><strong>Email saisi :</strong> ${escapeHtml(event.contactEmail ?? "—")}</p>`,
    `<p><strong>Nom saisi :</strong> ${escapeHtml(name || "—")}</p>`,
    `<p><strong>Occupation :</strong> ${escapeHtml(occupation || "—")}</p>`,
    `<p><strong>Visiteur :</strong> ${escapeHtml(event.visitorKey)}</p>`,
    `<p><strong>Heure :</strong> ${escapeHtml(event.createdAt)} (UTC)</p>`,
  ].join("");
}

export function executiveOnboardingSheetRow(lead: ExecutiveLeadRow): string[] {
  return [
    lead.completedAt,
    lead.userId,
    lead.authEmail ?? "",
    lead.fullName,
    lead.contactEmail,
    lead.birthDate,
    lead.location,
    lead.occupation,
    lead.urgentDecision,
    lead.stakeholders,
    lead.clarityScore,
  ];
}

/** Same column layout as {@link executiveOnboardingSheetRow}; clarity column = last micro-step reached. */
export function executiveOnboardingAbandonSheetRow(event: FunnelEventRow): string[] {
  const meta = event.metadata;
  const fullName = typeof meta.full_name === "string" ? meta.full_name : "";
  return [
    event.createdAt,
    event.userId ?? "",
    "",
    fullName,
    event.contactEmail ?? "",
    "",
    "",
    typeof meta.occupation === "string" ? meta.occupation : "",
    `abandoned step ${event.microStep}/${event.totalSteps}`,
    event.visitorKey,
    String(event.microStep),
  ];
}