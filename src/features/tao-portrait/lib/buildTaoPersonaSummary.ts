import type { TaoPortraitPartRow, WuXingPole } from "../domain/types";
import {
  POLE_PART_ORDER,
  TAO_POLES_ENABLED,
  WU_XING_META,
  WU_XING_POLES,
} from "../domain/types";
import { countFilledParts, hasTransversalT2 } from "../services/taoPortraitService";
import { extractTaoMarkdownPreview } from "./taoMarkdownGlimpse";

export interface TaoPoleProgress {
  pole: WuXingPole;
  filled: number;
  total: number;
}

export interface TaoPersonaSummary {
  hasContent: boolean;
  t2Available: boolean;
  t2Title: string | null;
  t2Lead: string | null;
  t2Excerpt: string | null;
  t2Glyphe: string | null;
  t2Stade: string | null;
  t2Domaine: string | null;
  poleProgress: TaoPoleProgress[];
  totalFilled: number;
  totalSections: number;
  /** Pole with the most filled sections (for accent color). */
  primaryPole: WuXingPole | null;
  /** Fallback title when T2 is missing. */
  fallbackTitle: string | null;
  fallbackLead: string | null;
}

const SECTIONS_PER_POLE = POLE_PART_ORDER.length;
const TOTAL_POLE_SECTIONS = TAO_POLES_ENABLED.length * SECTIONS_PER_POLE;
const T2_SECTION_COUNT = 1;

function firstFilledPolePart(rows: TaoPortraitPartRow[]): TaoPortraitPartRow | null {
  for (const pole of TAO_POLES_ENABLED) {
    for (const partId of POLE_PART_ORDER) {
      const row = rows.find((r) => r.pole === pole && r.part_id === partId && r.content_md.trim());
      if (row) return row;
    }
  }
  return null;
}

function resolvePrimaryPole(progress: TaoPoleProgress[]): WuXingPole | null {
  let best: TaoPoleProgress | null = null;
  for (const entry of progress) {
    if (entry.filled === 0) continue;
    if (!best || entry.filled > best.filled) best = entry;
  }
  return best?.pole ?? null;
}

export function buildTaoPersonaSummary(parts: TaoPortraitPartRow[]): TaoPersonaSummary {
  const t2Available = hasTransversalT2(parts);
  const poleProgress: TaoPoleProgress[] = WU_XING_POLES.map((pole) => ({
    pole,
    filled: countFilledParts(parts, pole),
    total: SECTIONS_PER_POLE,
  }));

  const polesFilled = poleProgress.reduce((sum, p) => sum + p.filled, 0);
  const totalFilled = polesFilled + (t2Available ? T2_SECTION_COUNT : 0);
  const totalSections = TOTAL_POLE_SECTIONS + T2_SECTION_COUNT;
  const primaryPole = resolvePrimaryPole(poleProgress);

  const t2Row = parts.find(
    (r) => r.pole === "transversal" && r.part_id === "T2_SYNTHESIS" && r.content_md.trim(),
  );

  let t2Title: string | null = null;
  let t2Lead: string | null = null;
  let t2Excerpt: string | null = null;
  let t2Glyphe: string | null = null;
  let t2Stade: string | null = null;
  let t2Domaine: string | null = null;

  if (t2Row) {
    const preview = extractTaoMarkdownPreview(t2Row.content_md, { maxChars: 520, maxParagraphs: 4 });
    t2Title = preview.title || null;
    t2Lead = preview.lead || null;
    t2Excerpt = preview.excerpt || null;
    t2Glyphe = preview.frontmatter?.glyphe ?? null;
    t2Stade = preview.frontmatter?.stade ?? null;
    t2Domaine = preview.frontmatter?.domaine ?? null;
  }

  let fallbackTitle: string | null = null;
  let fallbackLead: string | null = null;
  if (!t2Row) {
    const fallback = firstFilledPolePart(parts);
    if (fallback) {
      const preview = extractTaoMarkdownPreview(fallback.content_md, { maxChars: 280, maxParagraphs: 2 });
      fallbackTitle = preview.title || null;
      fallbackLead = preview.lead || null;
    }
  }

  const hasContent = totalFilled > 0;

  return {
    hasContent,
    t2Available,
    t2Title,
    t2Lead,
    t2Excerpt,
    t2Glyphe,
    t2Stade,
    t2Domaine,
    poleProgress,
    totalFilled,
    totalSections,
    primaryPole,
    fallbackTitle,
    fallbackLead,
  };
}

export function spotlightPoleLabel(pole: WuXingPole, locale: "fr" | "en"): string {
  if (pole === "transversal") return locale === "fr" ? "Synthèse T2" : "T2 synthesis";
  const m = WU_XING_META[pole];
  return locale === "fr" ? `${m.emoji} ${m.label_fr}` : `${m.emoji} ${m.label_en}`;
}

export function taoDeepDiveHref(options?: { view?: "t2" | "poles"; pole?: WuXingPole }): string {
  const params = new URLSearchParams({ lens: "tao" });
  if (options?.view === "t2") params.set("view", "t2");
  if (options?.pole && options.pole !== "transversal") params.set("pole", options.pole);
  return `/deep-dive?${params.toString()}`;
}
