import type {
  DocumentFrontmatter,
  ParsedMarkdownDocument,
  ReportSection,
  TextBlock,
} from "@/lib/archetype-cartography/types";
import { normalizeMermaidSource, splitTextWithEmbeddedMermaid } from "@/lib/cartography-mermaid";

const FRONTMATTER_KV = /^([a-zA-Z0-9_-]+):\s*(.+)$/;
const SUBSECTION_H3_RE = /^###\s+(.+)$/gm;
const SUBSECTION_ANNEAU_RE = /^(ANNEAU\s+\d+[^.\n]*)/gim;
const SUBSECTION_CAPS_RE = /^([A-ZÀÁÂÄÈÉÊËÌÍÎÏÑÒÓÔÖÙÚÛÜ][A-Z0-9\s\-—:(),·]{8,})$/gm;
const ROMAN_SECTION_RE = /^[IVXLC]+\.\s+/i;
const NUMBERED_SUBSECTION_RE = /^\d+\.\s+(?!\*\*)[A-ZÀÁÂÄÈÉÊËÌÍÎÏÑ⚖️🌑🌕]/;

const BOILERPLATE_LINE_RE =
  /^(protocole nomos|propriété de|fin de l'analyse|scellé par aegis|document scellé)/i;

function documentHasRomanSections(body: string): boolean {
  return /^[IVXLC]+\.\s+/im.test(body);
}

function isTopLevelSectionLine(line: string, romanDocument: boolean): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^#{1,2}\s+/.test(t)) return true;
  if (ROMAN_SECTION_RE.test(t)) return true;
  if (romanDocument) return false;

  const m = t.match(/^(\d+)\.\s+(.+)$/);
  if (!m) return false;
  const title = m[2].trim();
  if (title.startsWith("**")) return false;
  if (!/^[A-ZÀÁÂÄÈÉÊËÌÍÎÏÑÒÓÔÖÙÚÛÜ⚖️🌑🌕]/.test(title)) return false;
  const upper = (title.match(/[A-ZÀÁÂÄÈÉÊËÌÍÎÏÑÒÓÔÖÙÚÛÜ]/g)?.length ?? 0) / title.length;
  return title.length >= 20 && upper > 0.3;
}

function findTopLevelSections(
  body: string,
): Array<{ title: string; index: number; len: number }> {
  const romanDocument = documentHasRomanSections(body);
  const hits: Array<{ title: string; index: number; len: number }> = [];
  let offset = 0;

  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (isTopLevelSectionLine(trimmed, romanDocument)) {
      const title = trimmed.replace(/^#{1,2}\s+/, "").trim();
      hits.push({ title, index: offset, len: line.length });
    }
    offset += line.length + 1;
  }
  return hits;
}

function isBoilerplateContentLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (BOILERPLATE_LINE_RE.test(t)) return true;
  if (/^\*Fin de l'Analyse/i.test(t)) return true;
  return false;
}

function stripTrailingBoilerplate(body: string): string {
  const lines = body.split("\n");
  while (lines.length && isBoilerplateContentLine(lines[lines.length - 1] ?? "")) {
    lines.pop();
  }
  return lines.join("\n").trim();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "section";
}

export function stripDocumentFrontmatter(markdown: string): {
  frontmatter: DocumentFrontmatter | null;
  body: string;
} {
  const trimmed = markdown.trim();

  if (trimmed.startsWith("---")) {
    const end = trimmed.indexOf("---", 3);
    if (end > 0) {
      const raw = trimmed.slice(3, end).trim();
      const lines: Record<string, string> = {};
      for (const line of raw.split("\n")) {
        const m = line.match(FRONTMATTER_KV);
        if (m) lines[m[1]] = m[2].trim();
      }
      return {
        frontmatter: Object.keys(lines).length ? { lines } : null,
        body: trimmed.slice(end + 3).trim(),
      };
    }
  }

  const lines = trimmed.split("\n");
  const kvLines: string[] = [];
  let i = 0;
  while (i < lines.length && i < 24) {
    const line = lines[i].trim();
    if (!line) break;
    if (FRONTMATTER_KV.test(line)) {
      kvLines.push(line);
      i++;
    } else break;
  }

  if (kvLines.length >= 1) {
    const record: Record<string, string> = {};
    for (const line of kvLines) {
      const m = line.match(FRONTMATTER_KV);
      if (m) record[m[1]] = m[2].trim();
    }
    return {
      frontmatter: { lines: record },
      body: lines.slice(i).join("\n").trim(),
    };
  }

  return { frontmatter: null, body: trimmed };
}

function isTableRow(line: string): boolean {
  return /^\|.+\|$/.test(line.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function parsePlainMarkdownBlocks(text: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const lines = text.split("\n");
  let i = 0;

  const flushParagraph = (buf: string[]) => {
    const joined = buf.join(" ").trim();
    buf.length = 0;
    if (!joined) return;
    for (const part of splitTextWithEmbeddedMermaid(joined)) {
      if (part.kind === "mermaid") {
        blocks.push({ type: "mermaid", source: part.content });
      } else {
        blocks.push({ type: "p", text: part.content });
      }
    }
  };

  let paraBuf: string[] = [];
  let listBuf: string[] | null = null;
  let listOrdered = false;

  const flushList = () => {
    if (listBuf?.length) {
      blocks.push({ type: "list", items: [...listBuf], ordered: listOrdered });
    }
    listBuf = null;
    listOrdered = false;
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    i++;

    if (!line || line === "---") {
      flushParagraph(paraBuf);
      flushList();
      paraBuf.length = 0;
      continue;
    }

    if (line.startsWith("#")) continue;

    const fenceOpen = line.match(/^```(\w*)\s*(.*)$/);
    if (fenceOpen) {
      flushParagraph(paraBuf);
      flushList();
      const lang = fenceOpen[1].toLowerCase();
      const firstLine = fenceOpen[2] ?? "";
      const buf: string[] = firstLine ? [firstLine] : [];
      while (i < lines.length) {
        const fenceLine = lines[i];
        if (fenceLine.trim() === "```") {
          i++;
          break;
        }
        buf.push(fenceLine);
        i++;
      }
      const body = buf.join("\n").trim();
      if (lang === "mermaid" || (!lang && /^(graph|flowchart)\s/i.test(body))) {
        blocks.push({ type: "mermaid", source: normalizeMermaidSource(body) });
      } else if (body) {
        blocks.push({ type: "p", text: body });
      }
      continue;
    }

    if (isTableRow(line)) {
      flushParagraph(paraBuf);
      flushList();
      const tableLines: string[] = [line];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const dataLines = tableLines.filter((l) => !isTableSeparator(l));
      if (dataLines.length >= 1) {
        const headers = parseTableRow(dataLines[0]);
        const rows = dataLines.slice(1).map(parseTableRow);
        blocks.push({ type: "table", headers, rows });
      }
      continue;
    }

    if (line.startsWith(">")) {
      flushParagraph(paraBuf);
      flushList();
      blocks.push({ type: "quote", text: line.replace(/^>\s?/, "").trim() });
      continue;
    }

    if (/^\*[^*\n]+\*$/.test(line)) {
      flushParagraph(paraBuf);
      flushList();
      blocks.push({ type: "quote", text: line.slice(1, -1).trim() });
      continue;
    }

    if (isBoilerplateContentLine(line)) {
      flushParagraph(paraBuf);
      flushList();
      continue;
    }

    const labeled =
      line.match(/^\*\*([^*]+)\*\*\s*:?\s*(.+)$/) ??
      line.match(/^([A-Z0-9][A-Za-z0-9\s\-()]+)\s*:\s*(.+)$/);
    if (labeled && labeled[1].length < 56 && labeled[2].trim()) {
      flushParagraph(paraBuf);
      flushList();
      blocks.push({ type: "labeled", label: labeled[1].trim(), text: labeled[2].trim() });
      continue;
    }

    const ul = line.match(/^[-*]\s+(.+)$/) ?? raw.match(/^\s{2,}[-*]\s+(.+)$/);
    const ol = line.match(/^\d+\.\s+(.+)$/);
    if (ul || ol) {
      flushParagraph(paraBuf);
      const item = (ul?.[1] ?? ol?.[1])!.trim();
      if (!listBuf) {
        listBuf = [];
        listOrdered = Boolean(ol);
      } else if (listOrdered !== Boolean(ol)) {
        flushList();
        listBuf = [];
        listOrdered = Boolean(ol);
      }
      listBuf.push(item);
      continue;
    }

    flushList();
    paraBuf.push(line);
  }

  flushParagraph(paraBuf);
  flushList();
  return blocks;
}

export function parseMarkdownBlocks(text: string): TextBlock[] {
  return parsePlainMarkdownBlocks(text);
}

const META_FIELD_KEYS = new Set([
  "id",
  "type",
  "pole",
  "user",
  "period",
  "author",
  "stage",
  "tier",
  "version",
  "source",
  "report",
  "code",
  "created",
  "updated",
]);

const NOTEBOOKLM_LINE_RE =
  /notebook\s*lm|prompt[-\s]?video[-\s]?overview|ingestion par notebook|archivage et ingestion/i;

function isNotebookLmLine(text: string): boolean {
  return NOTEBOOKLM_LINE_RE.test(text.trim());
}

function isBoilerplateFooterLine(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (isNotebookLmLine(t)) return true;
  return /^document\s+scellé\s+pour\s+archivage/i.test(t);
}

/** Retire frontmatter technique et lignes NotebookLM — appliqué à l'import et à l'affichage. */
export function sanitizeCartographyMarkdown(markdown: string): string {
  const { body } = stripDocumentFrontmatter(markdown);
  return body
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (FRONTMATTER_KV.test(t)) return false;
      if (isNotebookLmLine(t)) return false;
      if (isBoilerplateFooterLine(t)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isMetadataParagraph(text: string): boolean {
  const t = text.trim();
  if (!t) return false;

  const lines = t.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 1 && lines.every((l) => FRONTMATTER_KV.test(l))) return true;

  const keyHits = [...META_FIELD_KEYS].filter(
    (k) => new RegExp(`\\b${k}\\s*[:=]`, "i").test(t) || t.toLowerCase().startsWith(k),
  );
  if (keyHits.length >= 2) return true;
  if (/INTEGRAL_CARTOGRAPHY[·\s]*T\d/i.test(t)) return true;

  return false;
}

function filterMetadataBlocks(blocks: TextBlock[]): TextBlock[] {
  return blocks.filter((block) => {
    if (block.type === "labeled") {
      const key = block.label.toLowerCase().replace(/\s/g, "");
      return !META_FIELD_KEYS.has(key);
    }
    if (block.type === "p") {
      if (isMetadataParagraph(block.text)) return false;
      if (isNotebookLmLine(block.text)) return false;
      if (isBoilerplateFooterLine(block.text)) return false;
    }
    return true;
  });
}

function sanitizeSection(section: ReportSection): ReportSection {
  return {
    ...section,
    blocks: filterMetadataBlocks(section.blocks),
    subsections: section.subsections?.map(sanitizeSection),
  };
}

function findSubsectionSplits(body: string): Array<{ title: string; index: number; len: number }> {
  const hits: Array<{ title: string; index: number; len: number }> = [];

  for (const re of [SUBSECTION_H3_RE, SUBSECTION_ANNEAU_RE, SUBSECTION_CAPS_RE]) {
    re.lastIndex = 0;
    for (const m of body.matchAll(re)) {
      if (m.index === undefined) continue;
      const title = m[1].trim();
      if (title.length < 4) continue;
      hits.push({ title, index: m.index, len: m[0].length });
    }
  }

  let offset = 0;
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (NUMBERED_SUBSECTION_RE.test(trimmed)) {
      hits.push({ title: trimmed, index: offset, len: line.length });
    }
    offset += line.length + 1;
  }

  hits.sort((a, b) => a.index - b.index);

  const deduped: typeof hits = [];
  for (const h of hits) {
    const last = deduped[deduped.length - 1];
    if (last && h.index < last.index + last.len + 8) continue;
    deduped.push(h);
  }
  return deduped;
}

function parseSectionBody(body: string): { blocks: TextBlock[]; subsections: ReportSection[] } {
  const splits = findSubsectionSplits(body);
  if (!splits.length) {
    return { blocks: parseMarkdownBlocks(body), subsections: [] };
  }

  const subsections: ReportSection[] = [];
  for (let i = 0; i < splits.length; i++) {
    const s = splits[i];
    const start = s.index + s.len;
    const end = i + 1 < splits.length ? splits[i + 1].index : body.length;
    const chunk = body.slice(start, end).trim();
    subsections.push({
      id: slugify(s.title),
      title: s.title,
      blocks: parseMarkdownBlocks(chunk),
    });
  }

  const preamble = body.slice(0, splits[0].index).trim();
  return {
    blocks: preamble ? parseMarkdownBlocks(preamble) : [],
    subsections,
  };
}

/** Parse n'importe quel markdown Myss / T3 / HIGH_RES en sections accordéon. */
export function parseUniversalMarkdownDocument(markdown: string): ParsedMarkdownDocument {
  const cleaned = sanitizeCartographyMarkdown(markdown);
  const { body } = stripDocumentFrontmatter(cleaned);

  const h1Match = body.match(/^#\s+(.+)$/m);
  const title = h1Match?.[1]?.trim() ?? null;

  let workBody = body;
  if (h1Match?.index !== undefined) {
    workBody = body.slice(h1Match.index + h1Match[0].length).trim();
  }

  const titleRepeat = workBody.match(/^[^\n#]{10,}\n={3,}\s*$/m);
  if (titleRepeat?.index === 0) {
    workBody = workBody.slice(titleRepeat[0].length).trim();
  }

  const plainTitleLine = !h1Match && workBody.match(/^([⚖️🌑🌕]?\s*[^\n]{12,})\n\n/m);
  const docTitle = title ?? plainTitleLine?.[1]?.trim() ?? null;

  if (plainTitleLine?.index === 0) {
    workBody = workBody.slice(plainTitleLine[0].length).trim();
  }

  workBody = stripTrailingBoilerplate(workBody);

  const sectionMatches = findTopLevelSections(workBody);
  const intro: TextBlock[] = [];
  const sections: ReportSection[] = [];

  if (!sectionMatches.length) {
    const { blocks, subsections } = parseSectionBody(workBody);
    if (blocks.length) intro.push(...filterMetadataBlocks(blocks));
    if (subsections.length) sections.push(...subsections.map(sanitizeSection));
    else if (blocks.length === 0 && workBody.trim()) {
      intro.push(...filterMetadataBlocks(parseMarkdownBlocks(workBody)));
    }
  } else {
    const firstIdx = sectionMatches[0].index ?? 0;
    const introText = workBody.slice(0, firstIdx).trim();
    if (introText) intro.push(...filterMetadataBlocks(parseMarkdownBlocks(introText)));

    for (let i = 0; i < sectionMatches.length; i++) {
      const s = sectionMatches[i];
      const sectionTitle = s.title.trim();
      let start = s.index + s.len;
      if (workBody[start] === "\n") start += 1;
      let end = workBody.length;
      if (i + 1 < sectionMatches.length) {
        end = sectionMatches[i + 1].index;
      }
      const chunk = workBody.slice(start, end).trim();
      const { blocks, subsections } = parseSectionBody(chunk);

      sections.push(sanitizeSection({
        id: slugify(sectionTitle),
        title: sectionTitle,
        blocks,
        subsections: subsections.length ? subsections : undefined,
      }));
    }
  }

  const footerMatch = workBody.match(/^(Document[^\n]+|FIN DU RAPPORT[^\n]+)$/im);
  let footer = footerMatch?.[1]?.trim() ?? null;
  if (footer && (isNotebookLmLine(footer) || isBoilerplateFooterLine(footer))) {
    footer = null;
  }

  return {
    title: docTitle,
    subtitle: null,
    frontmatter: null,
    intro,
    sections,
    footer,
  };
}

export function parseDetailedFromUniversal(
  markdown: string,
  reportCode: string,
): { code: string; title: string; subtitle: string; sections: ReportSection[]; footer?: string } {
  const doc = parseUniversalMarkdownDocument(markdown);
  const codeMatch = reportCode.match(/p0?(\d)/i) ?? markdown.match(/\bP0?(\d)\b/i);
  const code = codeMatch ? `P0${codeMatch[1]}` : reportCode.toUpperCase();

  return {
    code,
    title: doc.title ?? code,
    subtitle: doc.subtitle ?? "",
    sections: doc.sections.length
      ? doc.sections
      : doc.intro.length
        ? [{ id: "intro", title: "Contenu", blocks: doc.intro }]
        : [],
    footer: doc.footer ?? undefined,
  };
}
