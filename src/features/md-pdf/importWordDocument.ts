import mammoth from "mammoth";
import TurndownService from "turndown";
import { normalizeReportToMarkdown } from "./normalizeReportMarkdown";

export type WordImportResult = {
  markdown: string;
  filename: string;
  source: "docx" | "doc-text" | "plain";
  warnings: string[];
};

const DOC_MIME =
  /application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)/i;

function isZipDocx(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

function isOleDoc(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0
  );
}

export function isWordFile(file: File): boolean {
  return /\.(docx|doc)$/i.test(file.name) || DOC_MIME.test(file.type);
}

export function isStudioImportFile(file: File): boolean {
  return (
    /\.(md|markdown|txt|docx|doc)$/i.test(file.name) ||
    /markdown|text\/plain/.test(file.type) ||
    DOC_MIME.test(file.type)
  );
}

function createTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
  });

  // Minimal GFM tables (Word often emits real <table> markup).
  td.addRule("table", {
    filter: "table",
    replacement(_content, node) {
      const table = node as HTMLTableElement;
      const rows = Array.from(table.querySelectorAll("tr"));
      if (!rows.length) return "";
      const matrix = rows.map((tr) =>
        Array.from(tr.querySelectorAll("th,td")).map((cell) =>
          (cell.textContent ?? "").replace(/\s+/g, " ").trim(),
        ),
      );
      const width = Math.max(...matrix.map((r) => r.length), 1);
      const normalized = matrix.map((r) => {
        const next = [...r];
        while (next.length < width) next.push("");
        return next;
      });
      const header = normalized[0];
      const sep = header.map(() => "---");
      const body = normalized.slice(1);
      const line = (cols: string[]) => `| ${cols.join(" | ")} |`;
      return `\n\n${line(header)}\n${line(sep)}\n${body.map(line).join("\n")}\n\n`;
    },
  });

  return td;
}

async function docxToMarkdown(arrayBuffer: ArrayBuffer): Promise<{ markdown: string; warnings: string[] }> {
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
    },
  );
  const warnings = (result.messages ?? [])
    .filter((m) => m.type === "warning" || m.type === "error")
    .map((m) => m.message)
    .slice(0, 8);

  const html = result.value?.trim() ?? "";
  if (!html) {
    const raw = await mammoth.extractRawText({ arrayBuffer });
    return {
      markdown: normalizeReportToMarkdown(raw.value ?? "", "Document"),
      warnings: warnings.length ? warnings : ["Document Word vide après extraction."],
    };
  }

  const md = createTurndown().turndown(html).trim();
  return {
    markdown: normalizeReportToMarkdown(md, "Document"),
    warnings,
  };
}

/** Best-effort text scrape for legacy binary .doc */
function scrapeLegacyDocText(bytes: Uint8Array): string {
  const chunks: string[] = [];
  let buf = "";
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = bytes[i] | (bytes[i + 1] << 8);
    if (code >= 32 && code < 127) buf += String.fromCharCode(code);
    else if (code === 10 || code === 13 || code === 9) buf += " ";
    else if (buf.length >= 24) {
      chunks.push(buf.trim());
      buf = "";
    } else buf = "";
  }
  if (buf.length >= 24) chunks.push(buf.trim());

  buf = "";
  for (let i = 0; i < bytes.length; i++) {
    const code = bytes[i];
    if (code >= 32 && code < 127) buf += String.fromCharCode(code);
    else if (code === 10 || code === 13 || code === 9) buf += " ";
    else if (buf.length >= 32) {
      chunks.push(buf.trim());
      buf = "";
    } else buf = "";
  }
  if (buf.length >= 32) chunks.push(buf.trim());

  return chunks
    .filter((c) => /[A-Za-z]{4}/.test(c))
    .join("\n")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function importWordOrTextFile(file: File): Promise<WordImportResult> {
  const baseName = file.name.replace(/\.(docx|doc|md|markdown|txt)$/i, "") || "document";
  const lower = file.name.toLowerCase();

  if (/\.(md|markdown|txt)$/i.test(lower) || (/markdown|text\/plain/.test(file.type) && !isWordFile(file))) {
    const text = await file.text();
    return {
      markdown: normalizeReportToMarkdown(text, baseName),
      filename: /\.(md|markdown)$/i.test(lower) ? file.name : `${baseName}.md`,
      source: "plain",
      warnings: [],
    };
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (isZipDocx(bytes) || lower.endsWith(".docx")) {
    try {
      const { markdown, warnings } = await docxToMarkdown(buffer);
      return {
        markdown,
        filename: `${baseName}.md`,
        source: "docx",
        warnings,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Impossible de lire le .docx : ${message}`);
    }
  }

  if (isOleDoc(bytes) || lower.endsWith(".doc")) {
    const scraped = scrapeLegacyDocText(bytes);
    if (scraped.length < 80) {
      throw new Error(
        "Les fichiers .doc (Word 97–2003) ne sont pas supportés nativement. Enregistre en .docx dans Word, ou colle le texte dans l’éditeur.",
      );
    }
    return {
      markdown: normalizeReportToMarkdown(scraped, baseName),
      filename: `${baseName}.md`,
      source: "doc-text",
      warnings: [
        "Extraction approximative du .doc legacy — vérifie le rendu. Préfère .docx pour une fidélité maximale.",
      ],
    };
  }

  throw new Error("Format de fichier non reconnu. Utilise .md, .txt, .docx ou .doc.");
}
