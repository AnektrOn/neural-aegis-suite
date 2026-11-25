import { describe, expect, it } from "vitest";
import { decodeExecutiveProfile, executiveOnboardingSheetRow } from "@/lib/executiveOnboardingLead";

describe("decodeExecutiveProfile", () => {
  it("maps harvest columns to lead fields", () => {
    const decoded = decodeExecutiveProfile({
      annual_revenue_bracket: "Camille Laurent",
      team_size: "camille@example.com",
      company_stage: "1988-04-01",
      governance_structure: "Paris, France",
      role_title: "Business Owner",
      urgent_decision_title: "Licencier le CTO",
      primary_stakeholders: [{ name: "Thomas" }],
    });

    expect(decoded.fullName).toBe("Camille Laurent");
    expect(decoded.contactEmail).toBe("camille@example.com");
    expect(decoded.stakeholders).toBe("Thomas");
  });

  it("builds sheet row in column order", () => {
    const row = executiveOnboardingSheetRow({
      userId: "00000000-0000-4000-8000-000000000001",
      completedAt: "2026-03-27T10:00:00Z",
      authEmail: "auth@example.com",
      fullName: "Camille",
      contactEmail: "camille@example.com",
      birthDate: "1988-04-01",
      location: "Paris",
      occupation: "Leader",
      urgentDecision: "Decision",
      stakeholders: "Thomas",
      clarityScore: "72",
    });
    expect(row[1]).toBe("00000000-0000-4000-8000-000000000001");
    expect(row[row.length - 1]).toBe("72");
  });
});