import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseMarkdownCard, parseMarkdownCards } from "./pulseMarkdownParser";

const VAULT = join(process.cwd(), "scripts/pulse-sync/vault-example");

function walkMd(dir: string, base = dir): { name: string; content: string }[] {
  const out: { name: string; content: string }[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walkMd(p, base));
    else if (e.endsWith(".md")) {
      out.push({
        name: p.slice(base.length + 1),
        content: readFileSync(p, "utf-8"),
      });
    }
  }
  return out;
}

describe("pulseMarkdownParser", () => {
  it("parses a standard card md file", () => {
    const content = readFileSync(
      join(VAULT, "MENTALISM/001-le-filtre-de-la-realite.md"),
      "utf-8",
    );
    const result = parseMarkdownCard(content, "001-le-filtre-de-la-realite.md");
    expect(result.errors).toEqual([]);
    expect(result.card?.external_key).toBe("pulse_mentalism_filter");
    expect(result.card?.course_content.fr?.hook).toContain("videur");
  });

  it("parses Hook — FR heading variant", () => {
    const md = `---
external_key: pulse_test_hook
principle: MENTALISM
title:
  fr: Titre
  en: Title
format:
  fr: MICRO-CONCEPT
  en: MICRO-CONCEPT
problem:
  fr: Problème
  en: Problem
bullets:
  fr:
    - a
  en:
    - b
---

# Hook — FR
Hook texte

# Hook — EN
Hook en

# Concept FR
Concept fr

# Concept EN
Concept en

# Action FR
Action fr

# Action EN
Action en
`;
    const result = parseMarkdownCard(md, "test.md");
    expect(result.errors).toEqual([]);
    expect(result.card?.course_content.fr?.hook).toBe("Hook texte");
  });

  it("skips course files without crashing", () => {
    const content = readFileSync(
      join(VAULT, "courses/course-mentalism-filtre-realite.md"),
      "utf-8",
    );
    const result = parseMarkdownCards([
      { name: "courses/course-mentalism-filtre-realite.md", content },
    ]);
    expect(result.cards).toHaveLength(0);
    expect(result.errors.some((e) => e.includes("course"))).toBe(true);
  });

  it("parses batch of 2 via pulse-item markers and nested # FR / # Hook", () => {
    const content = readFileSync(
      join(process.cwd(), "src/pages/admin/pulse/fixtures/petter-pulse-batch-2.md"),
      "utf-8",
    );
    const result = parseMarkdownCards([{ name: "petter-batch.md", content }]);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(2);
    expect(result.total).toBe(2);
    expect(result.cards.map((c) => c.external_key)).toEqual([
      "pulse_CREATOR_petter_01",
      "pulse_SOVEREIGN_petter_02",
    ]);
    expect(result.cards[0].course_content.fr?.hook).toBe("Hook FR texte");
    expect(result.cards[0].content_type).toBe("card");
    expect(result.cards[0].target_user_ids).toEqual([
      "ad1893b4-43df-4e08-9132-d9987c2edac0",
    ]);
  });

  it("ignores pulse-item mentioned inside documentation HTML comment (11th false split)", () => {
    const content = readFileSync(
      join(process.cwd(), "src/pages/admin/pulse/fixtures/petter-pulse-batch-10.md"),
      "utf-8",
    );
    const result = parseMarkdownCards([{ name: "import-pulses-petter-batch-2026-06-11.md", content }]);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(10);
    expect(result.total).toBe(10);
  });

  it("ignores optional batch frontmatter without external_key (11th false segment)", () => {
    const content = readFileSync(
      join(process.cwd(), "src/pages/admin/pulse/fixtures/petter-pulse-batch-10.md"),
      "utf-8",
    );
    const withPreamble =
      `---\nversion: pulse-md-batch-v1\ndistribution:\n  mode: individual\n---\n\n${content}`;
    const result = parseMarkdownCards([{ name: "import-pulses-petter-batch.md", content: withPreamble }]);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(10);
    expect(result.total).toBe(10);
  });

  it("ignores pulse_batch_header_bypass batch header (11th false segment)", () => {
    const content = readFileSync(
      join(process.cwd(), "src/pages/admin/pulse/fixtures/petter-pulse-batch-10.md"),
      "utf-8",
    );
    const withHeader = `---
external_key: pulse_batch_header_bypass
version: pulse-md-batch-v1
distribution:
  mode: individual
---

${content}`;
    const result = parseMarkdownCards([
      { name: "import-pulses-petter-batch-2026-06-11.md", content: withHeader },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(10);
    expect(result.total).toBe(10);
    expect(result.cards[0].external_key).toBe("pulse_CREATOR_petter_01");
  });

  it("ignores pulse_batch_header_bypass even when it has principle + title (full meta, no course body)", () => {
    const content = readFileSync(
      join(process.cwd(), "src/pages/admin/pulse/fixtures/petter-pulse-batch-10.md"),
      "utf-8",
    );
    // Simule un en-tête de lot complet avec principle/title mais sans sections # FR / # EN
    const withFullHeader = `---
external_key: pulse_batch_header_bypass
version: pulse-md-batch-v1
principle: MENTALISM
title:
  fr: En-tête de lot
  en: Batch header
distribution:
  mode: individual
  user_id: ad1893b4-43df-4e08-9132-d9987c2edac0
---

${content}`;
    const result = parseMarkdownCards([
      { name: "import-pulses-petter-batch-2026-06-11.md", content: withFullHeader },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(10);
    expect(result.total).toBe(10);
    expect(result.cards[0].external_key).toBe("pulse_CREATOR_petter_01");
  });

  it("ignores pulse-item on its own line inside doc comment block", () => {
    const card = readFileSync(
      join(process.cwd(), "src/pages/admin/pulse/fixtures/petter-pulse-batch-2.md"),
      "utf-8",
    );
    const content = `<!--
Guide import
Exemple de marqueur (ne doit pas découper) :
<!-- pulse-item -->
Fin du guide
-->

${card}`;
    const result = parseMarkdownCards([{ name: "batch.md", content }]);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(2);
    expect(result.total).toBe(2);
  });

  it("parses full Petter batch of 10 via pulse-item markers", () => {
    const content = readFileSync(
      join(process.cwd(), "src/pages/admin/pulse/fixtures/petter-pulse-batch-10.md"),
      "utf-8",
    );
    const result = parseMarkdownCards([{ name: "petter-gryding-pulses.md", content }]);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(10);
    expect(result.total).toBe(10);
    expect(result.cards.every((c) => c.is_active === false)).toBe(true);
    expect(result.cards.every((c) => c.target_user_ids?.[0] === "ad1893b4-43df-4e08-9132-d9987c2edac0")).toBe(
      true,
    );
    expect(result.cards[0].course_content.fr?.hook).toContain("Créateur");
    expect(result.cards[9].external_key).toBe("pulse_CENTERING_petter_10");
  });

  it("parses MYSS batch with principle equal to rune (# Hook FR sections)", () => {
    const md = `<!--
IMPORT PAR LOT (MYSS)
-->

<!-- pulse-item -->

---
external_key: pulse_rebel_petter_110
glyph: MYSS
rune: REBEL
principle: REBEL
sort_order: 110
time_label: "2 MIN"
is_active: false
user: "petter-gryding"
user_id: "ad1893b4-43df-4e08-9132-d9987c2edac0"
archetype_targets:
  - creator
  - sovereign
title:
  fr: "La Révolution des Règles"
  en: "The Rule Revolution"
format:
  fr: "MICRO-CONCEPT"
  en: "MICRO-CONCEPT"
problem:
  fr: "Suivre des processus obsolètes par simple habitude de contrôle."
  en: "Following obsolete processes out of simple habit of control."
bullets:
  fr:
    - "Point FR"
  en:
    - "Point EN"
---

# Hook FR
Le Rebelle détruit les structures inutiles.

# Hook EN
The Rebel destroys useless structures.

# Concept FR
Utilise la force de la Rune REBEL.

# Concept EN
Use the strength of the REBEL Rune.

# Action FR
Supprime une règle inutile aujourd'hui.

# Action EN
Delete one useless rule today.
`;
    const result = parseMarkdownCards([{ name: "myss-batch.md", content: md }]);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(1);
    expect(result.cards[0].principle).toBe("REBEL");
    expect(result.cards[0].course_content.fr?.hook).toContain("Rebelle");
    expect(result.cards[0].is_active).toBe(false);
  });

  it("parses ECHOLS card with principle equal to rune", () => {
    const md = `<!-- pulse-item -->

---
external_key: pulse_shielding_petter_05
glyph: ECHOLS
rune: SHIELDING
principle: SHIELDING
sort_order: 5
time_label: "2 MIN"
is_active: false
user_id: "ad1893b4-43df-4e08-9132-d9987c2edac0"
title:
  fr: "Cognitive Firewall"
  en: "Cognitive Firewall"
format:
  fr: "MICRO-CONCEPT"
  en: "MICRO-CONCEPT"
problem:
  fr: "Problème FR"
  en: "Problem EN"
bullets:
  fr:
    - "Point FR"
  en:
    - "Point EN"
---

# Hook FR
Hook FR

# Hook EN
Hook EN

# Concept FR
Concept FR

# Concept EN
Concept EN

# Action FR
Action FR

# Action EN
Action EN
`;
    const result = parseMarkdownCards([{ name: "echols-batch.md", content: md }]);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(1);
    expect(result.cards[0].principle).toBe("SHIELDING");
  });

  it("normalizes Title Case archetype_targets (Sovereign → sovereign)", () => {
    const md = `---
external_key: pulse_SHIELDING_space
glyph: ECHOLS
rune: SHIELDING
principle: SHIELDING
sort_order: 3
time_label: "2 MIN"
is_active: true
user_id: "ad1893b4-43df-4e08-9132-d9987c2edac0"
archetype_targets:
  - Sovereign
title:
  fr: "Bouclier d'Espace Personnel"
  en: "Personal Space Shielding"
format:
  fr: "RITUEL"
  en: "RITUAL"
problem:
  fr: "Perte de soi."
  en: "Losing oneself."
bullets:
  fr:
    - "Point FR"
  en:
    - "Point EN"
---

# FR

# Hook
Hook FR

# Concept
Concept FR

# Action
Action FR

# EN

# Hook
Hook EN

# Concept
Concept EN

# Action
Action EN
`;
    const result = parseMarkdownCards([{ name: "pulse_SHIELDING_space.md", content: md }]);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(1);
    expect(result.cards[0].archetype_targets).toEqual(["sovereign"]);
  });

  it("imports vault cards when folder also contains course files", () => {
    const files = walkMd(VAULT);
    const result = parseMarkdownCards(files);
    expect(result.valid).toBe(3);
    expect(result.cards.map((c) => c.external_key).sort()).toEqual([
      "pulse_mentalism_filter",
      "pulse_polarity_emotions",
      "pulse_vibration_media_diet",
    ]);
  });
});
