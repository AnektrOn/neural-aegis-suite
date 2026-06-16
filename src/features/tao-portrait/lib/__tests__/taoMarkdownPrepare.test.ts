import { describe, expect, it } from "vitest";
import { prepareTaoPortraitMarkdown } from "../taoMarkdownPrepare";

const SAMPLE = `titre: "P01DiaBois"
stade: "champ"
domaine: "systémique"
glyphe: "⊕"
principe-dominant: "champ-morphique"
principes-secondaires: ["verticalité", "vision", "mise-en-mouvement"]
tags: ["bois", "diagnostic"]

# Diagnostic du pôle Bois

Le champ morphique révèle une **verticalité** structurelle.

| Signal | Intensité |
| :--- | :--- |
| Vision | Haute |
| Mouvement | Modérée |
`;

describe("prepareTaoPortraitMarkdown", () => {
  it("strips YAML frontmatter and parses metadata", () => {
    const { frontmatter, body } = prepareTaoPortraitMarkdown(SAMPLE);

    expect(frontmatter?.titre).toBe("P01DiaBois");
    expect(frontmatter?.glyphe).toBe("⊕");
    expect(frontmatter?.principesSecondaires).toEqual([
      "verticalité",
      "vision",
      "mise-en-mouvement",
    ]);
    expect(body).not.toMatch(/^titre:/m);
    expect(body).toContain("# Diagnostic du pôle Bois");
    expect(body).toContain("| Signal | Intensité |");
  });
});
