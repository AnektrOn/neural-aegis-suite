#!/usr/bin/env node
/**
 * i18n-export-deepdive.mjs
 *
 * Exports all FR editorial content from the Deep Dive module into a flat JSON
 * with hierarchical dotted keys (e.g. "deepdive.archetypeIntro.child").
 *
 * Usage:
 *   node scripts/i18n-export-deepdive.mjs            → writes /tmp/deepdive_fr.json
 *   node scripts/i18n-export-deepdive.mjs --out path → custom output path
 *
 * Workflow:
 *   1. Run this script   → get deepdive_fr.json
 *   2. Translate it with your AI of choice (ChatGPT/Claude/DeepL/Gemini)
 *      → produce deepdive_en.json with the SAME keys, English values
 *   3. Run `i18n-import-deepdive.mjs` to merge both into translations.ts
 *      and refactor the source files to use t('key').
 *
 * IMPORTANT: Do NOT change keys when translating. Only translate values.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ------------------------------------------------------------------
// 1. Static narrative templates (extracted from narrativeTemplates.ts)
// ------------------------------------------------------------------
import {
  archetypeIntro,
  houseContext,
} from "../src/features/archetype-deepdive-v2/domain/narrativeTemplates.ts";

const out = {};

// archetypeIntro.{key}
for (const [k, v] of Object.entries(archetypeIntro)) {
  out[`deepdive.archetypeIntro.${k}`] = v;
}

// houseContext.{n}
for (const [n, v] of Object.entries(houseContext)) {
  out[`deepdive.houseContext.${n}`] = v;
}

// ------------------------------------------------------------------
// 2. tonePhrase variants (hardcoded in tonePhrase function)
// ------------------------------------------------------------------
const tonePhrases = {
  none: "Aucun signal significatif sur ce thème pour l’instant.",
  fullLight: "Tu opères ici principalement depuis la lumière de cet archétype.",
  mostlyLight: "Lumière dominante, avec quelques zones d’ombre à intégrer.",
  balanced: "Terrain de bascule : la lumière et l’ombre se disputent à parts presque égales.",
  mostlyShadow: "Ombre dominante, avec des éclats de lumière à cultiver.",
  fullShadow: "Tu opères ici principalement depuis l’ombre de cet archétype.",
};
for (const [k, v] of Object.entries(tonePhrases)) {
  out[`deepdive.tonePhrase.${k}`] = v;
}
out["deepdive.house.label"] = "Maison";

// ------------------------------------------------------------------
// 3. UI strings — extract hardcoded FR strings from .tsx pages/components
// ------------------------------------------------------------------
const UI_FILES = [
  "src/features/archetype-deepdive-v2/pages/DeepDiveReportPage.tsx",
  "src/features/archetype-deepdive-v2/pages/DeepDiveSampleReport.tsx",
  "src/features/archetype-deepdive-v2/pages/DeepDiveUserReport.tsx",
  "src/features/archetype-deepdive-v2/components/DeepDiveUserCards.tsx",
  "src/features/archetype-deepdive-v2/components/DeepDiveAdminCards.tsx",
  "src/features/archetype-deepdive-v2/components/DeepDiveRadarChart.tsx",
];

// Heuristic regex: capture French-looking string literals inside JSX text or
// string props. We capture: >TEXT<, "TEXT", 'TEXT', `TEXT` where TEXT contains
// at least one accented char OR a French stop-word.
const FR_HINT = /[àâäéèêëîïôöùûüÿçœ]|(\b(le|la|les|un|une|des|du|de|et|ou|tu|ton|ta|tes|votre|nos|que|qui|pour|avec|dans|sur|sans|aux|au|cette|ces|ce|son|sa|ses|est|sont|fait|faire|peux|peut|veux|veut|comme|plus|moins|très|déjà|encore|aussi)\b)/i;

function extractFromFile(file) {
  const abs = resolve(ROOT, file);
  let src;
  try { src = readFileSync(abs, "utf8"); }
  catch { console.warn(`⚠ skipped (not found): ${file}`); return []; }

  const found = new Set();

  // JSX text content: >Some French text<
  for (const m of src.matchAll(/>\s*([^<>{}\n][^<>{}]{2,})\s*</g)) {
    const txt = m[1].trim();
    if (txt && FR_HINT.test(txt) && !txt.startsWith("{")) found.add(txt);
  }
  // String literals in single/double quotes (skip imports, classNames-like)
  for (const m of src.matchAll(/(["'`])((?:(?!\1)[^\\]|\\.){4,}?)\1/g)) {
    const txt = m[2];
    if (FR_HINT.test(txt) && !/^(@\/|\.\/|\.\.\/|https?:|data:|#|hsl|rgb|var\()/.test(txt)) {
      found.add(txt);
    }
  }
  return [...found];
}

let uiCounter = 0;
for (const file of UI_FILES) {
  const strings = extractFromFile(file);
  const slug = file.split("/").pop().replace(/\.[tj]sx?$/, "");
  for (const s of strings) {
    out[`deepdive.ui.${slug}.${++uiCounter}`] = s;
  }
}

// ------------------------------------------------------------------
// 4. Write output
// ------------------------------------------------------------------
const outPath = (() => {
  const i = process.argv.indexOf("--out");
  return i >= 0 ? process.argv[i + 1] : "/tmp/deepdive_fr.json";
})();

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");

console.log(`✅ Exported ${Object.keys(out).length} FR strings → ${outPath}`);
console.log(`\nNext steps:`);
console.log(`  1. Open ${outPath}`);
console.log(`  2. Translate values to EN with your AI (keep keys identical!)`);
console.log(`  3. Save as /tmp/deepdive_en.json`);
console.log(`  4. Run: node scripts/i18n-import-deepdive.mjs`);
