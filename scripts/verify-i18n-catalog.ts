/**
 * Validates translations.ts: every key has fr + en strings, placeholder names match.
 * Run: npx tsx scripts/verify-i18n-catalog.ts
 */
import { translations } from "../src/i18n/translations.ts";

function placeholders(s: string): Set<string> {
  return new Set([...s.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1]));
}

let failed = false;

for (const [key, val] of Object.entries(translations)) {
  if (!val || typeof val !== "object") {
    console.error(`[BAD] ${key}: not an object`);
    failed = true;
    continue;
  }
  const v = val as Record<string, unknown>;
  if (typeof v.fr !== "string" || typeof v.en !== "string") {
    console.error(`[BAD] ${key}: fr/en must be strings`);
    failed = true;
    continue;
  }
  const pf = placeholders(v.fr as string);
  const pe = placeholders(v.en as string);
  const onlyFr = [...pf].filter((x) => !pe.has(x));
  const onlyEn = [...pe].filter((x) => !pf.has(x));
  if (onlyFr.length || onlyEn.length) {
    console.error(
      `[BAD] ${key}: placeholders fr [${onlyFr.join(", ")}] vs en [${onlyEn.join(", ")}]`,
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log(`[OK] i18n catalog: ${Object.keys(translations).length} keys, fr+en + placeholder parity`);
