import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseToolboxMarkdownBatch,
  splitToolboxMarkdownFile,
} from "./toolboxMarkdownParser";

const batchTemplate = readFileSync(
  resolve(process.cwd(), "content/toolbox/_templates/toolbox-batch-template.md"),
  "utf8",
);

const actionableStopLove = readFileSync(
  resolve(process.cwd(), "src/features/toolbox-admin/fixtures/actionable-tool-stop-love.md"),
  "utf8",
);

describe("toolboxMarkdownParser batch", () => {
  it("splits batch template into 10 items", () => {
    const chunks = splitToolboxMarkdownFile(batchTemplate, "batch-01.md");
    expect(chunks).toHaveLength(10);
  });

  it("parses all 10 items from one batch file", () => {
    const result = parseToolboxMarkdownBatch([
      { name: "batch-01.md", content: batchTemplate },
    ]);
    expect(result.total).toBe(10);
    expect(result.valid).toBe(10);
    expect(result.errors).toHaveLength(0);
    expect(result.payload.toolbox_items).toHaveLength(10);
    expect(result.importIssues).toEqual([]);
  });

  it("parses Petter Gryding individual batch without import blockers", () => {
    const petter = readFileSync(
      resolve(process.cwd(), "src/features/toolbox-admin/fixtures/petter-gryding-batch.md"),
      "utf8",
    );
    const result = parseToolboxMarkdownBatch([
      { name: "petter-gryding.md", content: petter },
    ]);
    expect(result.total).toBe(5);
    expect(result.valid).toBe(5);
    expect(result.errors).toEqual([]);
    expect(result.importIssues).toEqual([]);
    expect(result.items.every((i) => i.distribution.mode === "individual")).toBe(true);
    expect(result.items.every((i) => i.distribution.user_id)).toBeTruthy();
  });

  it("accepts pulse-style frontmatter (problem → description, inferred content_type)", () => {
    const md = `---
external_key: TOOL_Boundary_Navigation
glyph: ECHOLS
rune: SHIELDING
principle: SHIELDING
is_active: true
user_id: "ad1893b4-43df-4e08-9132-d9987c2edac0"
archetype_targets:
  - Sovereign
problem:
  fr: "Perte de soi dans la présence de l'autre."
  en: "Losing oneself in the presence of the other."
bullets:
  fr:
    - "Créer une membrane énergétique."
  en:
    - "Creating an energetic membrane."
---

# FR

# Hook
Tu ne peux pas faire ton propre travail interne si tu es baigné dans le champ de l'autre.

# Concept
La pratique de Shielding crée une membrane semi-perméable.

# Action
Visualise une bulle dorée autour de toi.

# EN

# Hook
You cannot do inner work while bathed in someone else's field.

# Concept
Shielding creates a semi-permeable membrane.

# Action
Visualize a golden bubble around you.
`;
    const result = parseToolboxMarkdownBatch([
      { name: "TOOL_Boundary_Navigation.md", content: md },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(1);
    expect(result.items[0].content_type).toBe("boundary_practice");
    expect(result.items[0].title_i18n.fr).toBe("Boundary Navigation");
    expect(result.items[0].description_i18n.fr).toContain("Perte de soi");
    expect(result.items[0].archetype_targets).toEqual(["sovereign"]);
    expect(result.items[0].distribution.mode).toBe("individual");
  });

  it("parses actionable_tool STOP format with distinct FR/EN title and embedded S/T/O/P steps", () => {
    const result = parseToolboxMarkdownBatch([
      { name: "actionable-tool-stop-love.md", content: actionableStopLove },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(1);
    expect(result.importIssues).toEqual([]);

    const item = result.items[0];
    expect(item.content_type).toBe("stop_protocol");
    expect(item.external_key).toBe("toolbox_regulation_stop_love");
    expect(item.title_i18n.fr).toBe("S.T.O.P. Profond : L'Illusion du Sacrifice (Amour)");
    expect(item.title_i18n.en).toBe("Deep S.T.O.P.: The Illusion of Sacrifice (Love)");
    expect(item.description_i18n.en).toContain("universal Love");
    expect(item.description_i18n.fr).not.toBe(item.description_i18n.en);

    const steps = item.widget_config.steps as Array<{
      title_i18n: { fr: string; en: string };
      hint_i18n: { fr: string; en: string };
    }>;
    expect(steps).toHaveLength(4);
    expect(steps[0].title_i18n.fr).toMatch(/^S — Stop/);
    expect(steps[0].title_i18n.en).toMatch(/^S — Stop/);
    expect(steps[0].hint_i18n.fr).toContain("Immobilise ton corps");
    expect(steps[0].hint_i18n.en).toContain("Immobilize your body");
    expect(steps[0].hint_i18n.fr).not.toBe(steps[0].hint_i18n.en);

    expect(item.widget_config.mode).toBe("timed");
    expect(item.widget_config.duration_min).toBe(2);
    expect(item.widget_config.prompt_i18n).toEqual({
      fr: expect.stringContaining("Démarrer"),
      en: expect.stringContaining("Press Start"),
    });
  });
});
