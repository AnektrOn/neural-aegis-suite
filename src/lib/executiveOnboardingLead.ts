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

/** Map quirky user_executive_profiles columns back to member-facing labels. */
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