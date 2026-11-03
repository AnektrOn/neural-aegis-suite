/**
 * Keeps AEGIS landing docs synchronized with code: copy trees, textures,
 * nav anchors, required markdown, and the no-prism-landing import rule.
 *
 * Run: npm run verify:aegis-landing-docs
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { AEGIS_LANDING_COPY, type AegisLandingCopy } from "../src/pages/aegis-landing/i18n/aegisLandingCopy.ts";
import { ARMILLARY_TEXTURES } from "../src/pages/aegis-landing/armillary/armillaryConstants.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LANDING = join(ROOT, "src/pages/aegis-landing");
const PUBLIC = join(ROOT, "public");

const REQUIRED_DOCS = [
  "README.md",
  "docs/ARCHITECTURE.md",
  "docs/ARMILLARY.md",
  "docs/COPY_AND_I18N.md",
  "copy-deck.md",
] as const;

const REQUIRED_COPY_KEYS: (keyof AegisLandingCopy)[] = [
  "meta",
  "nav",
  "hero",
  "problem",
  "manifesto",
  "recevez",
  "comment",
  "comparatif",
  "pourQui",
  "donnees",
  "tarif",
  "faq",
  "finalCta",
  "footer",
];

const NAV_ANCHORS = [
  { href: "#comment", file: "sections/CommentCaMarcheSection.tsx" },
  { href: "#pour-qui", file: "sections/PourQuiSection.tsx" },
  { href: "#tarif", file: "sections/TarifSection.tsx" },
  { href: "#faq", file: "sections/FaqSection.tsx" },
] as const;

const FORBIDDEN_IMPORT = /from\s+['"][^'"]*pages\/dev\/prism-landing/;

let failed = 0;

function fail(msg: string) {
  console.error(`[BAD] ${msg}`);
  failed += 1;
}

function walkTs(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkTs(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

for (const rel of REQUIRED_DOCS) {
  const p = join(LANDING, rel);
  if (!existsSync(p)) fail(`missing doc ${rel}`);
}

for (const src of Object.values(ARMILLARY_TEXTURES)) {
  const disk = join(PUBLIC, src.replace(/^\//, ""));
  if (!existsSync(disk)) fail(`missing texture ${src} → ${relative(ROOT, disk)}`);
}

const audiences = ["individuel", "entreprise"] as const;
const locales = ["fr", "en"] as const;

for (const audience of audiences) {
  for (const locale of locales) {
    const copy = AEGIS_LANDING_COPY[audience][locale];
    if (!copy) {
      fail(`missing copy tree ${audience}/${locale}`);
      continue;
    }
    for (const key of REQUIRED_COPY_KEYS) {
      if (!(key in copy)) fail(`${audience}/${locale} missing key "${key}"`);
    }
    if (!copy.meta?.title || !copy.meta?.description) {
      fail(`${audience}/${locale} meta.title/description required`);
    }
    if (!copy.hero?.title || !copy.hero?.cta) {
      fail(`${audience}/${locale} hero.title/cta required`);
    }
    if (!Array.isArray(copy.faq?.items) || copy.faq.items.length === 0) {
      fail(`${audience}/${locale} faq.items must be a non-empty array`);
    }
    if (!Array.isArray(copy.footer?.links) || copy.footer.links.length === 0) {
      fail(`${audience}/${locale} footer.links must be a non-empty array`);
    }

    if (audience === "individuel" && copy.manifesto !== null) {
      fail(`${audience}/${locale} manifesto must be null`);
    }
    if (audience === "entreprise" && (copy.manifesto === null || copy.manifesto === undefined)) {
      fail(`${audience}/${locale} manifesto must be an object`);
    }
    if (audience === "entreprise" && !copy.recevez?.mockup?.heatmapRows) {
      fail(`${audience}/${locale} recevez.mockup.heatmapRows required for org mockup`);
    }
  }
}

const navSrc = readFileSync(join(LANDING, "components/LandingNav.tsx"), "utf8");
for (const { href, file } of NAV_ANCHORS) {
  if (!navSrc.includes(`href: "${href}"`) && !navSrc.includes(`href: '${href}'`)) {
    fail(`LandingNav missing ${href}`);
  }
  const section = readFileSync(join(LANDING, file), "utf8");
  const id = href.slice(1);
  if (!section.includes(`id="${id}"`) && !section.includes(`id='${id}'`)) {
    fail(`${file} missing id="${id}"`);
  }
}

for (const file of walkTs(LANDING)) {
  const text = readFileSync(file, "utf8");
  if (FORBIDDEN_IMPORT.test(text)) {
    fail(`forbidden prism-landing import in ${relative(ROOT, file)}`);
  }
}

if (failed) {
  console.error(`[FAIL] aegis-landing docs: ${failed} issue(s)`);
  process.exit(1);
}

const treeCount = audiences.length * locales.length;
console.log(
  `[OK] aegis-landing docs: ${treeCount} copy trees, ${Object.keys(ARMILLARY_TEXTURES).length} textures, ${REQUIRED_DOCS.length} markdown files, nav anchors aligned`,
);
