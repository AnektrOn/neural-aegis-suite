import { describe, expect, it } from "vitest";
import {
  buildOnboardingReportFirstMessage,
  parseTopThreeMajorArchetypes,
} from "../../supabase/functions/_shared/onboarding-report-opening";

describe("onboardingReportOpening", () => {
  it("extracts top 3 majors from balance report snippet", () => {
    const snippet = `
    - Mystique : 74 points (Ombre : 13)
    - Sage : 65 points (Ombre : 29)
    - Guérisseur : 64 points (Ombre : 0 STRICTEMENT)
    - Victime (88 pts)
    - Prostituée (60 pts)
    `;
    const top = parseTopThreeMajorArchetypes(snippet);
    expect(top.map((t) => t.label)).toEqual(["Mystique", "Sage", "Guérisseur"]);
    expect(top[0].score).toBe(74);
  });

  it("first message names the triple", () => {
    const msg = buildOnboardingReportFirstMessage("Note", [
      { label: "Mystique", score: 74 },
      { label: "Sage", score: 65 },
      { label: "Guérisseur", score: 64 },
    ]);
    expect(msg).toContain("trois archétypes majeurs");
    expect(msg).toContain("Mystique (74 points)");
    expect(msg).toContain("Sage (65 points)");
    expect(msg).toContain("Guérisseur (64 points)");
  });
});