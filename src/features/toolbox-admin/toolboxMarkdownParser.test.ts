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

const cognitiveFrameworkLifeJacket = readFileSync(
  resolve(process.cwd(), "src/features/toolbox-admin/fixtures/cognitive-framework-life-jacket.md"),
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

  it("parses cognitive framework MD (content_type framework, inline YAML arrays, timed steps)", () => {
    const result = parseToolboxMarkdownBatch([
      { name: "TOOL_01_Drop_The_Life_Jacket.md", content: cognitiveFrameworkLifeJacket },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(1);
    expect(result.importIssues).toEqual([]);

    const item = result.items[0];
    expect(item.content_type).toBe("micro_practice");
    expect(item.external_key).toBe("toolbox_cognitive_drop_life_jacket");
    expect(item.shadow_targets).toContain("saboteur");
    expect(item.shadow_targets).toContain("defensive_shielding");
    expect(item.archetype_targets).toEqual([]);

    const steps = item.widget_config.steps as Array<{
      text_i18n: { fr: string; en: string };
    }>;
    expect(steps).toHaveLength(3);
    expect(steps[0].text_i18n.fr).toContain("Calibration");
    expect(steps[0].text_i18n.fr).toContain("arrêt de 5 secondes");
    expect(item.widget_config.duration_sec).toBe(120);
    expect(item.widget_config.mode).toBeUndefined();
    expect(item.widget_config.step_duration_sec).toBeUndefined();
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

  it("imports a global Mode Débutant item and an individual item with # Context FR / # Context EN", () => {
    const dualBatchMd = `---
version: toolbox-md-batch-v1
---

<!-- toolbox-item -->
---
external_key: aegis_global_beginner_delegation_70
content_type: micro_practice
is_active: true
duration: "3 MIN"
category: cognitive
tier: beginner
pillar: gouvernance_souveraine
exocortex_organ: decision_log
mechanism_tag: delegation_70_framework
resistance_fallback_sec: 90
archetype_targets: [sovereign]
shadow_targets: [saboteur]
title:
  fr: "Le Framework de Délégation à 70 %"
  en: "The 70% Delegation Framework"
description:
  fr: "Neutraliser le besoin de contrôle du Saboteur en acceptant 30 % d'écart pour racheter sa bande passante souveraine."
  en: "Neutralize the Saboteur's need for control by accepting a 30% gap to buy back sovereign bandwidth."
distribution:
  mode: global
  assignment_status: active
---

# Instructions FR
Identifiez une tâche opérationnelle que vous refusez de déléguer par perfectionnisme défensif.

# Instructions EN
Identify an operational task you refuse to delegate out of defensive perfectionism.

# Steps FR
- Cible — Nommez la tâche qui encombre votre bande passante exécutive.
- Seuil 70 % : Définissez les 3 critères non-négociables qui suffisent à valider le livrable.
- Relâchement — Renoncez explicitement aux 30 % de forme restants et transférez l'exécution.

# Steps EN
- Target — Name the task clogging your executive bandwidth.
- 70% Threshold: Define the 3 non-negotiable criteria sufficient to validate the deliverable.
- Release — Explicitly let go of the remaining 30% stylistic preference and hand over execution.

<!-- toolbox-item -->
---
external_key: aegis_individual_vortex_stop_custom
content_type: stop_protocol
is_active: true
duration: "4 MIN"
category: regulation
tier: beginner
pillar: gouvernance_souveraine
exocortex_organ: vortex_emergency
parent_template_key: aegis_global_stop_vortex
resistance_fallback_sec: 60
archetype_targets: [sovereign, warrior]
shadow_targets: [saboteur, victim]
title:
  fr: "Coupe-Circuit Anti-Choc : Comité Exécutif"
  en: "Anti-Shock Circuit Breaker: Executive Board"
description:
  fr: "Protocole de gel décisionnel calibré pour vos réunions de comité sous tension."
  en: "Decision-freeze protocol calibrated for high-tension board meetings."
distribution:
  mode: individual
  user_id: "ad1893b4-43df-4e08-9132-d9987c2edac0"
  assignment_status: active
config:
  mode: timed
  step_duration_sec: 60
---

# Context FR
Suite à votre dernier arbitrage sous pression, ce protocole intercepte le réflexe de sur-justification du Saboteur avant toute prise de parole engageante.

# Context EN
Following your recent high-pressure arbitration, this protocol intercepts the Saboteur's over-justification reflex before any binding statement.

# Instructions FR
Exécutez ces 4 paliers dès que la contraction thoracique apparaît.

# Instructions EN
Execute these 4 steps as soon as chest contraction appears.

# Steps FR
- S — Stopper l'impulsion : Coupez immédiatement toute réponse verbale pendant 10 secondes.
- T — Respirer dans la contraction : Relâchez la mâchoire et allongez l'expiration sur 6 secondes.
- O — Séparer Fait Brut et Scénario : Isolez la donnée mesurable de l'interprétation défensive.
- P — Différer ou trancher au calme : Ne rendez votre arbitrage qu'après retour au Point Zéro.

# Steps EN
- S — Stop the impulse: Immediately halt any verbal response for 10 seconds.
- T — Breathe into the contraction: Release the jaw and lengthen the exhale to 6 seconds.
- O — Separate Raw Fact from Story: Isolate measurable data from defensive interpretation.
- P — Defer or decide in calm: Deliver your arbitration only after returning to Zero Point.
`;

    const result = parseToolboxMarkdownBatch([
      { name: "aegis-dual-batch.md", content: dualBatchMd },
    ]);

    expect(result.errors).toEqual([]);
    expect(result.importIssues).toEqual([]);
    expect(result.valid).toBe(2);

    const globalItem = result.items[0];
    expect(globalItem.distribution.mode).toBe("global");
    expect(globalItem.distribution.user_id).toBeUndefined();
    expect(globalItem.widget_config.tier).toBe("beginner");
    expect(globalItem.widget_config.pillar).toBe("gouvernance_souveraine");
    expect(globalItem.widget_config.exocortex_organ).toBe("decision_log");
    expect(globalItem.widget_config.mechanism_tag).toBe("delegation_70_framework");
    expect(globalItem.widget_config.resistance_fallback_sec).toBe(90);
    const globalSteps = globalItem.widget_config.steps as Array<{
      title: string;
      hint: string;
      text_i18n: { fr: string; en: string };
    }>;
    expect(globalSteps).toHaveLength(3);
    expect(globalSteps[0].title).toBe("Cible");
    expect(globalSteps[1].title).toBe("Seuil 70 %");
    expect(globalSteps[1].hint).toContain("3 critères non-négociables");

    const individualItem = result.items[1];
    expect(individualItem.distribution.mode).toBe("individual");
    expect(individualItem.distribution.user_id).toBe("ad1893b4-43df-4e08-9132-d9987c2edac0");
    expect(individualItem.widget_config.tier).toBe("beginner");
    expect(individualItem.widget_config.exocortex_organ).toBe("vortex_emergency");
    expect(individualItem.widget_config.parent_template_key).toBe("aegis_global_stop_vortex");
    expect(individualItem.widget_config.resistance_fallback_sec).toBe(60);
    expect(individualItem.widget_config.why_this_for_you).toContain("sur-justification du Saboteur");
    expect(individualItem.widget_config.why_this_for_you_i18n).toEqual({
      fr: expect.stringContaining("sur-justification du Saboteur"),
      en: expect.stringContaining("over-justification reflex"),
    });
  });
});
