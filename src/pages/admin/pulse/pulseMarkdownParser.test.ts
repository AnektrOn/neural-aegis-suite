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
