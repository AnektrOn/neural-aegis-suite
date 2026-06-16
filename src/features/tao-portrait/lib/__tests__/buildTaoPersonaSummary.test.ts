import { describe, expect, it } from "vitest";
import { buildTaoPersonaSummary } from "../buildTaoPersonaSummary";
import type { TaoPortraitPartRow } from "../../domain/types";

const T2_MD = `titre: "T2Global"
stade: "synthese"
domaine: "transversal"
glyphe: "☯"

# Synthèse Wu Xing · Tier 2

Le champ révèle une dynamique **morphique** entre les cinq pôles.

La verticalité du Bois structure l'ensemble du portrait.

L'Eau apporte la profondeur réceptive nécessaire à l'intégration.
`;

const POLE_MD = `titre: "P01DiaBois"
glyphe: "⊕"

# Diagnostic du pôle Bois

Signal principal détecté dans le champ morphique.
`;

function row(
  pole: TaoPortraitPartRow["pole"],
  partId: TaoPortraitPartRow["part_id"],
  content_md: string,
): TaoPortraitPartRow {
  return {
    id: `${pole}-${partId}`,
    user_id: "u1",
    pole,
    part_id: partId,
    content_md,
    created_at: "",
    updated_at: "",
  };
}

describe("buildTaoPersonaSummary", () => {
  it("prioritizes T2 title and excerpt for persona", () => {
    const summary = buildTaoPersonaSummary([
      row("transversal", "T2_SYNTHESIS", T2_MD),
      row("wood", "P01_DIA", POLE_MD),
    ]);

    expect(summary.t2Available).toBe(true);
    expect(summary.t2Title).toContain("Synthèse Wu Xing");
    expect(summary.t2Excerpt).toContain("dynamique morphique");
    expect(summary.t2Glyphe).toBe("☯");
    expect(summary.totalFilled).toBe(2);
    expect(summary.totalSections).toBe(26);
    expect(summary.primaryPole).toBe("wood");
  });

  it("falls back to pole content when T2 is missing", () => {
    const summary = buildTaoPersonaSummary([row("wood", "P01_DIA", POLE_MD)]);

    expect(summary.t2Available).toBe(false);
    expect(summary.fallbackTitle).toContain("Diagnostic du pôle Bois");
    expect(summary.fallbackLead).toContain("Signal principal");
  });
});
