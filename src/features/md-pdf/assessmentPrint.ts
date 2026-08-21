import { MAJOR_ARCHETYPE_KEYS, getArchetype } from "@/features/archetype-assessment/domain/archetypes";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";

export interface MdPdfScoreRow {
  key: string;
  name: string;
  rank: number;
  raw: number;
  normalized: number;
}

export interface MdPdfAssessment {
  userId: string;
  displayName: string;
  submittedAt: string | null;
  scores: MdPdfScoreRow[];
  top: MdPdfScoreRow[];
}

export function pdfUserHandles(user: string, tags: string[] = []): string[] {
  const handles: string[] = [];
  const push = (value: string) => {
    const v = value.replace(/^#/, "").trim();
    if (!v) return;
    if (handles.some((h) => h.toLowerCase() === v.toLowerCase())) return;
    handles.push(v);
  };
  push(user);
  for (const tag of tags) {
    const t = tag.replace(/^#/, "").trim();
    if (/^(diagnostic|balance|vault|md)$/i.test(t)) continue;
    push(t);
  }
  return handles;
}

function labelFor(key: string, locale: "fr" | "en"): string {
  try {
    const meta = getArchetype(key as ArchetypeKey);
    return locale === "en" ? meta.name_en : meta.name_fr;
  } catch {
    return key;
  }
}

export function rowsFromScores(
  scores: Array<{ archetype_key: string; rank: number; raw_score: number; normalized_score: number }>,
  locale: "fr" | "en",
): MdPdfScoreRow[] {
  const major = new Set<string>(MAJOR_ARCHETYPE_KEYS);
  return scores
    .filter((s) => major.has(s.archetype_key))
    .map((s) => ({
      key: s.archetype_key,
      name: labelFor(s.archetype_key, locale),
      rank: s.rank,
      raw: Math.round(Number(s.raw_score) || 0),
      normalized: Math.round(Number(s.normalized_score) || 0),
    }))
    .toSorted((a, b) => a.rank - b.rank || b.normalized - a.normalized);
}

interface RadarColors {
  stroke: string;
  fill: string;
  grid: string;
  text: string;
}

export function assessmentRadarSvg(
  rows: MdPdfScoreRow[],
  colors: RadarColors,
  locale: "fr" | "en" = "fr",
): string {
  const n = MAJOR_ARCHETYPE_KEYS.length;
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const ordered = MAJOR_ARCHETYPE_KEYS.map((key) => byKey.get(key) ?? {
    key,
    name: labelFor(key, locale),
    rank: 99,
    raw: 0,
    normalized: 0,
  });
  const cx = 240;
  const cy = 236;
  const maxR = 172;
  // Same domain as DualLayerRadar: scale to the peak, not a fixed 0–100.
  // Composition scores (~15–30) would otherwise sit as a tiny inner blob.
  const maxVal = Math.max(20, ...ordered.map((r) => r.normalized), 1);

  const polar = (i: number, radius: number): [number, number] => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  };

  const rings = [0.25, 0.5, 0.75, 1].map((t) => {
    const pts = Array.from({ length: n }, (_, i) => polar(i, maxR * t).join(",")).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="${colors.grid}" stroke-width="0.8"/>`;
  });

  const spokes = ordered
    .map((_, i) => {
      const [x, y] = polar(i, maxR);
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${colors.grid}" stroke-width="0.8"/>`;
    })
    .join("");

  const valuePts = ordered
    .map((row, i) => polar(i, maxR * (row.normalized / maxVal)).join(","))
    .join(" ");

  const labels = ordered
    .map((row, i) => {
      const [x, y] = polar(i, maxR + 28);
      const anchor = x < cx - 8 ? "end" : x > cx + 8 ? "start" : "middle";
      const short = row.name.replace(/^(Le |La |L')/, "");
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" fill="${colors.text}" font-family="Barlow, sans-serif" font-size="11">${short}</text>`;
    })
    .join("");

  return `<svg class="score-radar-svg" viewBox="0 0 480 480" width="480" height="480" role="img" aria-label="Radar archétypal">
    <g>${rings.join("")}${spokes}</g>
    <polygon class="score-radar-fill" points="${valuePts}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="2.4"/>
    ${labels}
  </svg>`;
}
