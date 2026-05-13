/**
 * Guardrail tests for `narrativeContent.ts`.
 *
 * These tests enforce the editorial rules defined at the top of
 * `narrativeContent.ts` (STYLE GUARDRAILS section). They are intentionally
 * strict: editing the narrative content without keeping the anchors in place
 * MUST fail CI so a human reviews the change.
 */

import { describe, it, expect } from "vitest";
import {
  get,
  archLabel,
  CORE_ARCH_KEYS,
  SURVIVAL_ARCH_KEYS,
} from "../narrativeContent";
import type { AnyArchetypeKey } from "../types";

const LOCALES = ["fr", "en"] as const;

describe("narrativeContent — TAGLINES", () => {
  it("are defined for every core archetype in both locales", () => {
    for (const key of CORE_ARCH_KEYS) {
      for (const locale of LOCALES) {
        const tagline = get.tagline(key, locale);
        expect(tagline, `missing tagline for ${key} (${locale})`).toBeTruthy();
        expect(tagline!.length, `tagline too short for ${key} (${locale})`).toBeGreaterThan(10);
      }
    }
  });

  it("are unique across core archetypes (FR + EN)", () => {
    for (const locale of LOCALES) {
      const seen = new Map<string, AnyArchetypeKey>();
      for (const key of CORE_ARCH_KEYS) {
        const tagline = (get.tagline(key, locale) ?? "").trim().toLowerCase();
        const prior = seen.get(tagline);
        expect(prior, `duplicate tagline (${locale}) between ${prior} and ${key}`).toBeUndefined();
        seen.set(tagline, key);
      }
    }
  });
});

describe("narrativeContent — WATCHOUTS anchor", () => {
  it("each FR watchout contains 'Signal précoce'", () => {
    for (const key of CORE_ARCH_KEYS) {
      const w = get.watchout(key, "fr");
      expect(w, `missing watchout for ${key} (fr)`).toBeTruthy();
      expect(
        w!.includes("Signal précoce"),
        `watchout for ${key} (fr) must include the 'Signal précoce' anchor`,
      ).toBe(true);
    }
  });

  it("each EN watchout contains 'Early signal'", () => {
    for (const key of CORE_ARCH_KEYS) {
      const w = get.watchout(key, "en");
      expect(w, `missing watchout for ${key} (en)`).toBeTruthy();
      expect(
        w!.includes("Early signal"),
        `watchout for ${key} (en) must include the 'Early signal' anchor`,
      ).toBe(true);
    }
  });
});

describe("narrativeContent — ADMIN_RISKS anchor", () => {
  it("each FR adminRisks contains 'Pattern chronique'", () => {
    for (const key of CORE_ARCH_KEYS) {
      const r = get.adminRisks(key, "fr");
      expect(r, `missing adminRisks for ${key} (fr)`).toBeTruthy();
      expect(
        r!.includes("Pattern chronique"),
        `adminRisks for ${key} (fr) must include 'Pattern chronique' anchor`,
      ).toBe(true);
    }
  });

  it("each EN adminRisks contains 'Chronic pattern'", () => {
    for (const key of CORE_ARCH_KEYS) {
      const r = get.adminRisks(key, "en");
      expect(r, `missing adminRisks for ${key} (en)`).toBeTruthy();
      expect(
        r!.includes("Chronic pattern"),
        `adminRisks for ${key} (en) must include 'Chronic pattern' anchor`,
      ).toBe(true);
    }
  });
});

describe("narrativeContent — GIVES distinctiveness", () => {
  it("are defined for every core archetype (FR)", () => {
    for (const key of CORE_ARCH_KEYS) {
      const g = get.gives(key, "fr");
      expect(g, `missing gives for ${key} (fr)`).toBeTruthy();
      expect(g!.length, `gives too short for ${key} (fr)`).toBeGreaterThan(60);
    }
  });

  it("are not interchangeable: each gives text mentions a distinctive marker", () => {
    // Lightweight smell-check: every block should contain at least one
    // archetype-specific marker word. This is intentionally non-exhaustive —
    // it catches obvious "you are good at things" copy-paste regressions.
    const markers: Record<AnyArchetypeKey, RegExp> = {
      sovereign: /autorité|cadre|responsabilité|systèmes/i,
      warrior:   /pression|combat|endurance|exécut/i,
      lover:     /intens|connexion|présent|engagement/i,
      caregiver: /sécurité|anticip|soin|contient/i,
      creator:   /forme|tangible|signature|aligné/i,
      explorer:  /inconnu|chemin|terrain|script/i,
      rebel:     /injuste|brèche|non|défier|défi/i,
      sage:      /structure|synth|patterns|clarté/i,
      mystic:    /symbolique|intuition|sens|synchron/i,
      healer:    /blessure|écoute|souffrance|clinique/i,
      magician:  /invisible|stratégique|leviers|orchestr/i,
      jester:    /rire|humour|tension|renvers|figé/i,
      // survival keys not required to have GIVES in core list
      child: /./, victim: /./, saboteur: /./, prostitute: /./,
    };
    for (const key of CORE_ARCH_KEYS) {
      const g = get.gives(key, "fr")!;
      expect(
        markers[key].test(g),
        `gives for ${key} (fr) should mention an archetype-specific marker`,
      ).toBe(true);
    }
  });
});

describe("narrativeContent — Survival guardians (Myss)", () => {
  it("each survival archetype has a positive guardian function", () => {
    for (const key of SURVIVAL_ARCH_KEYS) {
      for (const locale of LOCALES) {
        const f = get.survivalGuardianFunction(key, locale);
        expect(f, `missing guardian function for ${key} (${locale})`).toBeTruthy();
        expect(f!.length).toBeGreaterThan(60);
      }
    }
  });

  it("each survival archetype has a healing axis (integrate, not fight)", () => {
    for (const key of SURVIVAL_ARCH_KEYS) {
      for (const locale of LOCALES) {
        const h = get.survivalHealingAxis(key, locale);
        expect(h, `missing healing axis for ${key} (${locale})`).toBeTruthy();
        expect(h!.length).toBeGreaterThan(60);
      }
    }
  });

  it("each survival archetype has a SHADOW_THEME", () => {
    for (const key of SURVIVAL_ARCH_KEYS) {
      for (const locale of LOCALES) {
        const t = get.shadowTheme(key, locale);
        expect(t, `missing shadow theme for survival ${key} (${locale})`).toBeTruthy();
      }
    }
  });

  it("core (non-survival) archetypes return null for shadowTheme — builder MUST provide a fallback", () => {
    for (const key of CORE_ARCH_KEYS) {
      for (const locale of LOCALES) {
        expect(get.shadowTheme(key, locale)).toBeNull();
      }
    }
  });
});

describe("narrativeContent — ADMIN_WORK action-first", () => {
  it("each FR adminWork starts with an imperative verb (typical for action-first)", () => {
    // Heuristic: French infinitives or imperatives used as instructions usually
    // end in -er / -ir / -re. We don't enforce a tight grammar check, just
    // require that the first word is a verb form (no determiners "le", "la").
    const FORBIDDEN_LEADS = ["Le ", "La ", "Les ", "Un ", "Une ", "Des "];
    for (const key of CORE_ARCH_KEYS) {
      const w = get.adminWork(key, "fr")!;
      for (const forbidden of FORBIDDEN_LEADS) {
        expect(
          w.startsWith(forbidden),
          `adminWork for ${key} (fr) should start with an action verb, not "${forbidden.trim()}"`,
        ).toBe(false);
      }
    }
  });
});

describe("narrativeContent — Tensions (dyads)", () => {
  it("returns a tension reading for known dyads (order-independent)", () => {
    const knownPairs: Array<[AnyArchetypeKey, AnyArchetypeKey]> = [
      ["sovereign", "rebel"],
      ["rebel", "sovereign"],
      ["warrior", "lover"],
      ["mystic", "sage"],
    ];
    for (const [a, b] of knownPairs) {
      expect(
        get.tension(a, b, "fr"),
        `expected tension reading for ${a} + ${b}`,
      ).toBeTruthy();
    }
  });

  it("returns undefined for undefined dyads (no silent fallback)", () => {
    expect(get.tension("sovereign", "jester", "fr")).toBeUndefined();
  });
});

describe("narrativeContent — archLabel resolves every key", () => {
  it("returns a non-empty label for every archetype", () => {
    const allKeys: AnyArchetypeKey[] = [...CORE_ARCH_KEYS, ...SURVIVAL_ARCH_KEYS];
    for (const key of allKeys) {
      for (const locale of LOCALES) {
        expect(archLabel(key, locale).length).toBeGreaterThan(0);
      }
    }
  });
});
