import { describe, expect, it } from "vitest";
import { buildPortraitLenses, defaultPortraitLensId } from "../buildPortraitLenses";
import type { SampleProfile } from "@/features/archetype-deepdive-v2/domain/sampleProfile";

const minimalProfile = {
  label: "Test — Sovereign",
  subtitle: "Tier 2",
  narrative: {
    archetypeBlocks: [{ archetype: "SOVEREIGN", tagline: "Lead" }],
    primaryShadowTheme: "Control",
    strengths: ["**Force** de vision"],
    closingNarrativeUser: "",
    practices: [],
    overviewLead: "",
  },
  majors: [],
} as unknown as SampleProfile;

describe("buildPortraitLenses", () => {
  it("registers myss and tao lenses", () => {
    const lenses = buildPortraitLenses({
      profile: minimalProfile,
      taoSummary: {
        hasContent: true,
        t2Available: true,
        t2Title: "Synthèse T2",
        t2Lead: "Lead",
        t2Excerpt: "Excerpt",
        t2Glyphe: "☯",
        t2Stade: "synthese",
        t2Domaine: "transversal",
        poleProgress: [],
        totalFilled: 3,
        totalSections: 26,
        primaryPole: "wood",
        fallbackTitle: null,
        fallbackLead: null,
      },
      glimpseLine: "A glimpse",
      dominantColor: "#fff",
    });

    expect(lenses.map((l) => l.id)).toEqual(["myss", "manly_hall", "tao", "jung", "blavatsky"]);
    expect(lenses[0].status).toBe("ready");
    expect(lenses[2].status).toBe("ready");
    expect(lenses[0].coverArtUrl).toContain("myss-cover");
    expect(lenses[1].coverArtUrl).toContain("manly-hall-cover");
    expect(lenses[2].coverArtUrl).toContain("tao-cover");
    expect(defaultPortraitLensId(lenses)).toBe("myss");
  });
});
