/** Markdown → print-ready HTML for AEGIS Vault / Balance documents. */

export interface MdPdfMeta {
  title: string;
  displayTitle: string;
  subtitle: string;
  author: string;
  user: string;
  glyphe: string;
  orientation: string;
  stade: string;
  domaine: string;
  principe: string;
  tier: string;
  density: string;
  tags: string[];
  created: string;
  updated: string;
  body: string;
}

export type MdPdfContentLang = "fr" | "en" | "both";

const YAML_KV = /^([A-Za-z0-9_-]+):\s*(.*)$/;
const DOSSIER_LINE = /^\*\*(.+?)\*\*\s+(.+)$/;
const LOCALE_HEADING = /^(🇫🇷|🇬🇧)\s+(.*)$/;
const BILINGUAL_SPLIT = /\s+\/\s+/;

export function slugifyFilename(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "document"
  );
}

export function parseYamlScalar(raw: string): string | string[] {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return parsed.map((v) => String(v));
    } catch {
      /* keep string */
    }
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function stripYamlFrontmatter(markdown: string): {
  fields: Record<string, string>;
  arrays: Record<string, string[]>;
  body: string;
} {
  const trimmed = markdown.replace(/^\uFEFF/, "").trim();
  if (!trimmed.startsWith("---")) return { fields: {}, arrays: {}, body: trimmed };
  const end = trimmed.indexOf("\n---", 3);
  if (end < 0) return { fields: {}, arrays: {}, body: trimmed };
  const raw = trimmed.slice(3, end);
  const fields: Record<string, string> = {};
  const arrays: Record<string, string[]> = {};
  for (const line of raw.split("\n")) {
    if (/^\s/.test(line)) continue;
    const m = YAML_KV.exec(line.replace(/\s+$/, ""));
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = parseYamlScalar(m[2]);
    if (Array.isArray(value)) arrays[key] = value;
    else fields[key] = value;
  }
  return { fields, arrays, body: trimmed.slice(end + 4).trim() };
}

function stripLeadingOrnament(s: string): string {
  return s.replace(/^[^A-Za-zÀ-ÿ0-9]+/, "").trim();
}

export function firstHeadingTitle(markdown: string): string | null {
  const m = markdown.match(/^\s*#\s+(.+)$/m);
  return m ? stripInlineMarkers(m[1]).trim() : null;
}

function field(fields: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const value = fields[key];
    if (value) return value;
  }
  return "";
}

export function resolveMdPdfMeta(markdown: string, fallbackTitle: string): MdPdfMeta {
  const { fields, arrays, body } = stripYamlFrontmatter(markdown);
  const heading = firstHeadingTitle(body);
  const titre = field(fields, "titre", "title", "title_fr", "name");
  const displayTitle = heading ? stripLeadingOrnament(stripInlineMarkers(heading)) : titre || fallbackTitle;
  const user = field(fields, "user", "utilisateur");
  const orientation = field(fields, "orientation");
  const domaine = field(fields, "domaine");
  const subtitle = field(fields, "subtitle", "excerpt", "excerpt_fr");

  return {
    title: titre || displayTitle || fallbackTitle,
    displayTitle: displayTitle || titre || fallbackTitle,
    subtitle,
    author: field(fields, "auteur", "author", "by"),
    user,
    glyphe: field(fields, "glyphe", "glyph"),
    orientation,
    stade: field(fields, "stade"),
    domaine,
    principe: field(fields, "principe-dominant", "principe"),
    tier: field(fields, "tier"),
    density: field(fields, "densite-morphique", "densite"),
    tags: arrays.tags ?? [],
    created: field(fields, "created"),
    updated: field(fields, "updated"),
    body,
  };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripInlineMarkers(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2")
    .replace(/~~([^~]+)~~/g, "$1");
}

function applyInline(raw: string): string {
  const placeholders: string[] = [];
  const stash = (html: string) => {
    placeholders.push(html);
    return `\u0000${placeholders.length - 1}\u0000`;
  };

  let s = raw.replace(/`([^`]+)`/g, (_, code: string) =>
    stash(`<code>${escapeHtml(code)}</code>`),
  );
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt, src) =>
    stash(`<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`),
  );
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, label, href) =>
    stash(`<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`),
  );
  s = escapeHtml(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => placeholders[Number(i)] ?? "");
  return s;
}

export function pickBilingualText(text: string, lang: MdPdfContentLang): string {
  if (lang === "both") return text;
  const prefix = text.match(/^(\d+\.\s+)/);
  const rest = prefix ? text.slice(prefix[0].length) : text;
  const parts = rest.split(BILINGUAL_SPLIT);
  if (parts.length < 2) return text;
  const chosen = lang === "en" ? parts.slice(1).join(" / ").trim() : parts[0].trim();
  return `${prefix?.[0] ?? ""}${chosen}`;
}

function stripLocaleMarker(title: string): string {
  return title
    .replace(/^(🇫🇷|🇬🇧)\s+/, "")
    .replace(/\s*\((?:FR|EN)\)\s*$/i, "")
    .trim();
}

/** Keep FR, EN, or both blocks from Vault bilingual markdown. */
export function filterMarkdownByLang(markdown: string, lang: MdPdfContentLang): string {
  if (lang === "both") return markdown;
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let skipping = false;

  for (const raw of lines) {
    const trimmed = raw.trim();
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);

    if (heading) {
      const level = heading[1].length;
      const rest = heading[2].trim();
      const flag = LOCALE_HEADING.exec(rest);
      if (flag) {
        const blockLang: "fr" | "en" = flag[1] === "🇬🇧" ? "en" : "fr";
        skipping = blockLang !== lang;
        if (skipping) continue;
        out.push(`${heading[1]} ${stripLocaleMarker(rest)}`);
        continue;
      }
      if (level <= 2) skipping = false;
      if (skipping) continue;
      out.push(`${heading[1]} ${pickBilingualText(rest, lang)}`);
      continue;
    }

    if (isHr(trimmed) && skipping) {
      skipping = false;
      out.push(raw);
      continue;
    }

    if (skipping) continue;

    const dossier = DOSSIER_LINE.exec(trimmed);
    if (dossier) {
      const label = pickBilingualText(dossier[1].replace(/\s*:\s*$/, ""), lang);
      out.push(`**${label}:** ${dossier[2]}`);
      continue;
    }

    out.push(raw);
  }

  return out.join("\n");
}

function isHr(line: string): boolean {
  return /^(?:-{3,}|_{3,}|\*{3,})$/.test(line.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

function renderTable(rows: string[]): string {
  if (rows.length < 2) return "";
  const head = splitTableRow(rows[0]);
  const body = rows.slice(2).map(splitTableRow);
  const th = head.map((c) => `<th>${applyInline(c)}</th>`).join("");
  const tr = body
    .map((cols) => `<tr>${cols.map((c) => `<td>${applyInline(c)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

export function markdownToPrintHtml(
  markdown: string,
  options?: { skipFirstH1?: boolean },
): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;
  let inList: "ul" | "ol" | null = null;
  let inBlockquote = false;
  let inPara = false;
  let inLocale = false;
  let skippedFirstH1 = false;

  const closePara = () => {
    if (inPara) {
      html.push("</p>");
      inPara = false;
    }
  };
  const closeList = () => {
    if (inList) {
      html.push(`</${inList}>`);
      inList = null;
    }
  };
  const closeQuote = () => {
    if (inBlockquote) {
      html.push("</blockquote>");
      inBlockquote = false;
    }
  };
  const closeLocale = () => {
    if (inLocale) {
      html.push("</section>");
      inLocale = false;
    }
  };
  const closeFlow = () => {
    closePara();
    closeList();
    closeQuote();
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      closeFlow();
      const lang = trimmed.slice(3).trim();
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i]);
        i += 1;
      }
      html.push(
        `<pre${lang ? ` data-lang="${escapeHtml(lang)}"` : ""}><code>${escapeHtml(buf.join("\n"))}</code></pre>`,
      );
      i += 1;
      continue;
    }

    if (!trimmed) {
      closeFlow();
      i += 1;
      continue;
    }

    if (isHr(trimmed)) {
      closeFlow();
      closeLocale();
      html.push("<hr />");
      i += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = heading[1].length;
      if (level === 1 && options?.skipFirstH1 && !skippedFirstH1) {
        skippedFirstH1 = true;
        i += 1;
        continue;
      }
      closeFlow();
      const locale = LOCALE_HEADING.exec(heading[2].trim());
      if (level <= 2) closeLocale();
      if (locale) {
        closeLocale();
        const code = locale[1] === "🇬🇧" ? "en" : "fr";
        html.push(`<section class="locale-block locale-${code}">`);
        inLocale = true;
        html.push(`<h${level} class="locale-h">${applyInline(stripLocaleMarker(heading[2]))}</h${level}>`);
      } else if (level === 2) {
        const numbered = /^(\d+)\.\s+(.*)$/.exec(heading[2].trim());
        if (numbered) {
          html.push(
            `<h2 class="section-title"><span class="h-num">${escapeHtml(numbered[1])}</span><span class="h-text">${applyInline(numbered[2])}</span></h2>`,
          );
        } else {
          html.push(`<h2 class="section-title"><span class="h-text">${applyInline(heading[2])}</span></h2>`);
        }
      } else {
        if (level <= 3) closeLocale();
        html.push(`<h${level}>${applyInline(heading[2])}</h${level}>`);
      }
      i += 1;
      continue;
    }

    if (trimmed.startsWith("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      closeFlow();
      const rows: string[] = [line, lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(lines[i]);
        i += 1;
      }
      html.push(renderTable(rows));
      continue;
    }

    if (DOSSIER_LINE.test(trimmed)) {
      closeFlow();
      html.push('<dl class="dossier">');
      while (i < lines.length) {
        const next = lines[i].trim();
        const row = DOSSIER_LINE.exec(next);
        if (!row) break;
        html.push(
          `<div class="dossier-row"><dt>${applyInline(row[1].replace(/\s*:\s*$/, ""))}</dt><dd>${applyInline(row[2])}</dd></div>`,
        );
        i += 1;
      }
      html.push("</dl>");
      continue;
    }

    if (trimmed.startsWith(">")) {
      closePara();
      closeList();
      if (!inBlockquote) {
        html.push("<blockquote>");
        inBlockquote = true;
      }
      const quote = trimmed.replace(/^>\s?/, "");
      html.push(`<p>${applyInline(quote)}</p>`);
      i += 1;
      continue;
    }

    const ul = /^[-*+]\s+(.*)$/.exec(trimmed);
    const task = /^[-*+]\s+\[([ xX])\]\s+(.*)$/.exec(trimmed);
    const ol = /^(\d+)\.\s+(.*)$/.exec(trimmed);
    if (task || ul || ol) {
      closePara();
      closeQuote();
      const kind: "ul" | "ol" = ol && !task ? "ol" : "ul";
      if (inList && inList !== kind) closeList();
      if (!inList) {
        html.push(kind === "ol" ? '<ol class="points">' : "<ul>");
        inList = kind;
      }
      if (task) {
        const checked = task[1].toLowerCase() === "x";
        html.push(
          `<li class="task${checked ? " done" : ""}">${applyInline(task[2])}</li>`,
        );
      } else if (ol) {
        const numbered = /^\*\*(.+?)\*\*\s*(.*)$/.exec(ol[2]);
        if (numbered) {
          html.push(
            `<li class="point"><p class="point-title">${applyInline(`**${numbered[1]}**`)}</p><p class="point-body">${applyInline(numbered[2])}</p></li>`,
          );
        } else {
          html.push(`<li class="point"><p class="point-body">${applyInline(ol[2])}</p></li>`);
        }
      } else if (ul) {
        html.push(`<li>${applyInline(ul[1])}</li>`);
      }
      i += 1;
      continue;
    }

    closeList();
    closeQuote();
    if (!inPara) {
      html.push("<p>");
      inPara = true;
    } else {
      html.push(" ");
    }
    html.push(applyInline(trimmed));
    i += 1;
  }

  closeFlow();
  closeLocale();
  return html.join("\n");
}
