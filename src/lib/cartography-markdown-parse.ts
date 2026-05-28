import type {
  CartographyGuardian,
  CartographyHouse,
  CartographyMeta,
  DetailedReport,
  ReportSection,
  TextBlock,
} from "@/lib/archetype-cartography/types";
import type { DbCartographyBundle } from "@/services/cartographyService";
import { parseMarkdownBlocks as parseDocumentMarkdownBlocks } from "@/lib/cartography-document-parse";

const ZODIAC = "♈♉♊♋♌♍♎♏♐♑♒♓";

const HOUSE_HEADING_RE =
  /^#{2,4}\s+(?:([♈♉♊♋♌♍♎♏♐♑♒♓])\s+)?Maison\s+(\d+)\s*[—–-]\s*(.+)$/gim;

const GUARDIAN_HEADING_RE = /^###\s+(?!Maison\s+\d)(.+)$/gim;

const POLE_LINE_RE =
  /^[-*]\s+\*\*(SHADOW|OMBRE|LIGHT|LUMI[EÈ]RE|BALANCE|SHD|LGT|BAL)\s*:\*\*\s*(.+)$/i;

export interface ParsedCartographyDisplay {
  meta: CartographyMeta;
  houses: CartographyHouse[];
  guardians: CartographyGuardian[];
  synthesis: ReportSection[];
  detailedReports: DetailedReport[];
  /** True when at least one tab has structured content */
  hasStructured: boolean;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizePoleKey(raw: string): "shadow" | "light" | "balance" | null {
  const k = raw.toUpperCase();
  if (k === "SHADOW" || k === "OMBRE" || k === "SHD") return "shadow";
  if (k === "LIGHT" || k === "LUMIERE" || k === "LUMIÈRE" || k === "LGT") return "light";
  if (k === "BALANCE" || k === "BAL") return "balance";
  return null;
}

function extractPoles(block: string): Pick<CartographyHouse, "shadow" | "light" | "balance"> {
  const result = { shadow: "", light: "", balance: "" };
  for (const line of block.split("\n")) {
    const m = line.trim().match(POLE_LINE_RE);
    if (!m) continue;
    const key = normalizePoleKey(m[1]);
    if (key) result[key] = m[2].trim();
  }
  return result;
}

function extractTagline(block: string): string {
  const m = block.match(/^\s*\*([^*]+)\*\s*$/m);
  return m?.[1]?.trim() ?? "";
}

export function splitCartographyAndGuardians(markdown: string): {
  housesPart: string;
  guardiansPart: string;
} {
  const match = markdown.match(/^##\s+.*\b(gardiens|guardians)\b/im);
  if (!match || match.index === undefined) {
    return { housesPart: markdown, guardiansPart: "" };
  }
  return {
    housesPart: markdown.slice(0, match.index),
    guardiansPart: markdown.slice(match.index),
  };
}

export function parseHousesFromMarkdown(markdown: string): CartographyHouse[] {
  const houses: CartographyHouse[] = [];
  const headings = [...markdown.matchAll(HOUSE_HEADING_RE)];
  if (!headings.length) return houses;

  for (let i = 0; i < headings.length; i++) {
    const m = headings[i];
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < headings.length ? headings[i + 1].index! : markdown.length;
    const body = markdown.slice(start, end).trim();
    const sign = m[1] ?? "";
    const id = Number(m[2]);
    const titleRest = m[3].trim();
    const poles = extractPoles(body);
    const tagline = extractTagline(body);

    houses.push({
      id,
      sign: sign || ZODIAC[id - 1] || "",
      title: `Maison ${id} — ${titleRest}`,
      tagline,
      ...poles,
    });
  }

  return houses.sort((a, b) => a.id - b.id);
}

export function parseGuardiansFromMarkdown(markdown: string): CartographyGuardian[] {
  const guardians: CartographyGuardian[] = [];
  const headings = [...markdown.matchAll(GUARDIAN_HEADING_RE)];
  if (!headings.length) return guardians;

  for (let i = 0; i < headings.length; i++) {
    const m = headings[i];
    const name = m[1].trim();
    if (/^maison\s+\d/i.test(name)) continue;

    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < headings.length ? headings[i + 1].index! : markdown.length;
    const body = markdown.slice(start, end).trim();
    const poles = extractPoles(body);

    if (poles.shadow || poles.light || poles.balance) {
      guardians.push({ name, ...poles });
    }
  }

  return guardians;
}

export function parseMarkdownBlocks(text: string): TextBlock[] {
  return parseDocumentMarkdownBlocks(text);
}

function parseSectionBody(body: string): { blocks: TextBlock[]; subsections: ReportSection[] } {
  const subHeadingRe = /^###\s+(.+)$/gm;
  const matches = [...body.matchAll(subHeadingRe)];

  if (!matches.length) {
    return { blocks: parseMarkdownBlocks(body), subsections: [] };
  }

  const subsections: ReportSection[] = [];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const title = m[1].trim();
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : body.length;
    const chunk = body.slice(start, end).trim();
    subsections.push({
      id: slugify(title),
      title,
      blocks: parseMarkdownBlocks(chunk),
    });
  }

  const preamble = body.slice(0, matches[0].index ?? 0).trim();
  return {
    blocks: preamble ? parseMarkdownBlocks(preamble) : [],
    subsections,
  };
}

export function parseSynthesisFromMarkdown(markdown: string): ReportSection[] {
  const stripped = markdown.replace(/^#\s+.+$/m, "").trim();
  const parts = stripped.split(/^##\s+/m).filter((p) => p.trim());
  const sections: ReportSection[] = [];

  for (const part of parts) {
    const lines = part.split("\n");
    const title = lines[0]?.trim() ?? "Section";
    let bodyStart = 1;
    let subtitle: string | undefined;

    if (lines[1]?.trim().startsWith("*") && lines[1].includes("*")) {
      subtitle = lines[1].replace(/^\*|\*$/g, "").trim();
      bodyStart = 2;
    }

    const body = lines.slice(bodyStart).join("\n").trim();
    const { blocks, subsections } = parseSectionBody(body);

    sections.push({
      id: slugify(title),
      title,
      subtitle,
      blocks,
      subsections: subsections.length ? subsections : undefined,
    });
  }

  return sections;
}

export function parseDetailedReportFromMarkdown(
  markdown: string,
  reportCode: string,
): DetailedReport | null {
  const h1 = markdown.match(/^#\s+(.+)$/m);
  if (!h1) return null;

  const codeMatch = reportCode.match(/p0?(\d)/i) ?? markdown.match(/\bP0?(\d)\b/i);
  const code = codeMatch ? `P0${codeMatch[1]}` : reportCode.toUpperCase();

  const footerMatch = markdown.match(/^(FIN\s+DU\s+RAPPORT.+)$/im);
  const footer = footerMatch?.[1]?.trim();
  const bodyWithoutFooter = footer
    ? markdown.replace(footerMatch![0], "").trim()
    : markdown;

  const afterH1 = bodyWithoutFooter.replace(/^#\s+.+$/m, "").trim();
  const parts = afterH1.split(/^##\s+/m).filter((p) => p.trim());

  let title = h1[1].trim();
  let subtitle = "";
  const sections: ReportSection[] = [];

  for (let idx = 0; idx < parts.length; idx++) {
    const part = parts[idx];
    const lines = part.split("\n");
    const sectionTitle = lines[0]?.trim() ?? "";
    const sectionBody = lines.slice(1).join("\n").trim();

    if (idx === 0 && /^P0?\d\b/i.test(sectionTitle)) {
      const arc = sectionTitle.match(/P0?(\d)\s*[·.\-]?\s*(\w+)?/i);
      if (arc) subtitle = sectionTitle;
      const { blocks, subsections } = parseSectionBody(sectionBody);
      if (blocks.length || subsections.length) {
        sections.push({
          id: slugify(sectionTitle),
          title: sectionTitle,
          blocks,
          subsections: subsections.length ? subsections : undefined,
        });
      }
      continue;
    }

    const { blocks, subsections } = parseSectionBody(sectionBody);
    sections.push({
      id: slugify(sectionTitle),
      title: sectionTitle,
      blocks,
      subsections: subsections.length ? subsections : undefined,
    });
  }

  if (!sections.length) {
    const { blocks, subsections } = parseSectionBody(afterH1);
    if (blocks.length || subsections.length) {
      sections.push({
        id: "main",
        title: "Contenu",
        blocks,
        subsections: subsections.length ? subsections : undefined,
      });
    }
  }

  const arcInTitle = title.match(/P0?(\d)\s*[·.\-]\s*(\w+)/i);
  if (!subtitle && arcInTitle) {
    subtitle = `${arcInTitle[0]} · ${arcInTitle[2] ?? ""}`.trim();
  }

  return {
    id: reportCode.toLowerCase(),
    code,
    title,
    subtitle,
    sections,
    footer,
  };
}

export function parseMetaFromMarkdown(
  markdown: string,
  bundleMeta: Record<string, unknown>,
  poleLabel: string,
): CartographyMeta {
  const h1 = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const user =
    markdown.match(/\*\*Utilisateur\s*:\*\*\s*([^|\n]+)/i)?.[1]?.trim() ??
    (typeof bundleMeta.user_value === "string" ? bundleMeta.user_value : "");
  const date =
    markdown.match(/\*\*Date\s*:\*\*\s*([^|\n]+)/i)?.[1]?.trim() ??
    (typeof bundleMeta.date === "string" ? bundleMeta.date : "");
  const stage =
    markdown.match(/\*\*Stade\s*:\*\*\s*([^|\n]+)/i)?.[1]?.trim() ??
    (typeof bundleMeta.stage === "string" ? bundleMeta.stage : "");

  return {
    title:
      (typeof bundleMeta.title === "string" ? bundleMeta.title : "") ||
      h1?.replace(/^[^\w\s]+\s*/, "") ||
      "Cartographie Archétypale Intégrale",
    subtitle:
      (typeof bundleMeta.subtitle === "string" ? bundleMeta.subtitle : "") ||
      h1 ||
      "",
    userLabel:
      (typeof bundleMeta.user_label === "string" ? bundleMeta.user_label : "") ||
      "Utilisateur",
    userValue: user,
    date,
    stage,
    poleLabel:
      (typeof bundleMeta.pole_label === "string" ? bundleMeta.pole_label : "") ||
      poleLabel,
  };
}

const INDEX_MARKERS_RE =
  /STRUCTURE DU DOSSIER|FOLDER STRUCTURE|Ce répertoire contient|This directory contains|ordre de lecture est strict|reading order is strict/i;

const HAS_MAISON_HEADING_RE = /^#{2,4}\s+(?:[♈♉♊♋♌♍♎♏♐♑♒♓]\s+)?Maison\s+\d/im;

/** Fichier 00-README = table des matières interne, pas le rapport utilisateur. */
export function isCartographyIndexMarkdown(markdown: string, _title?: string | null): boolean {
  if (HAS_MAISON_HEADING_RE.test(markdown)) return false;
  if (POLE_LINE_RE.test(markdown)) return false;
  return INDEX_MARKERS_RE.test(markdown.slice(0, 1500));
}

function joinSectionMarkdown(
  sections: DbCartographyBundle["sections"],
  sectionKey: DbCartographyBundle["sections"][number]["sectionKey"],
  skipIndex = false,
): string {
  return sections
    .filter((s) => s.sectionKey === sectionKey)
    .filter((s) => !skipIndex || !isCartographyIndexMarkdown(s.markdown, s.title))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => s.markdown)
    .join("\n\n");
}

function findHousesInMarkdownSources(...sources: string[]): {
  houses: CartographyHouse[];
  guardiansPart: string;
} {
  for (const md of sources) {
    if (!md.trim()) continue;
    const { housesPart, guardiansPart } = splitCartographyAndGuardians(md);
    const houses = parseHousesFromMarkdown(housesPart);
    if (houses.length > 0) return { houses, guardiansPart };
  }
  return { houses: [], guardiansPart: "" };
}

export function detectCartographyContentLocale(
  markdown: string,
  meta?: Record<string, unknown>,
): "fr" | "en" {
  const fromMeta = meta?.content_locale;
  if (fromMeta === "en" || fromMeta === "fr") return fromMeta;
  const sample = markdown.slice(0, 4000).toLowerCase();
  const frScore =
    (sample.match(/\b(le|la|les|des|du|une|est|pour|avec|contient|répertoire)\b/g) ?? []).length;
  const enScore =
    (sample.match(/\b(the|and|for|with|this|are|is|contains|directory|folder)\b/g) ?? []).length;
  return enScore > frScore ? "en" : "fr";
}

/** Transforme un bundle DB en structure d'affichage riche (Myss, flat, legacy). */
export function parseBundleToDisplay(bundle: DbCartographyBundle): ParsedCartographyDisplay {
  const poleLabel =
    (typeof bundle.meta.pole_label === "string" ? bundle.meta.pole_label : "") ||
    bundle.pole.toUpperCase();

  const cartographieMd = joinSectionMarkdown(bundle.sections, "cartographie", true);

  const guardiansMd = joinSectionMarkdown(bundle.sections, "guardians");

  const synthesisMd = joinSectionMarkdown(bundle.sections, "synthesis");

  const { houses, guardiansPart: guardiansFromCartoPart } = findHousesInMarkdownSources(
    cartographieMd,
    synthesisMd,
  );
  const guardiansFromCarto = parseGuardiansFromMarkdown(guardiansFromCartoPart);
  const guardiansFromFile = parseGuardiansFromMarkdown(guardiansMd);
  const guardians = guardiansFromFile.length ? guardiansFromFile : guardiansFromCarto;

  const synthesis = synthesisMd ? parseSynthesisFromMarkdown(synthesisMd) : [];

  const detailedReports = bundle.sections
    .filter((s) => s.sectionKey === "detailed" && s.reportCode)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => parseDetailedReportFromMarkdown(s.markdown, s.reportCode))
    .filter((r): r is DetailedReport => r !== null);

  const metaSource = cartographieMd || synthesisMd || guardiansMd;
  const meta = parseMetaFromMarkdown(metaSource, bundle.meta, poleLabel);

  const hasStructured =
    houses.length > 0 ||
    guardians.length > 0 ||
    synthesis.length > 0 ||
    detailedReports.length > 0;

  return {
    meta,
    houses,
    guardians,
    synthesis,
    detailedReports,
    hasStructured,
  };
}
