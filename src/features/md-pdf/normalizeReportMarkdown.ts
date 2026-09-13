/**
 * Normalize pasted / Word-extracted clinical reports into Markdown
 * the existing md-pdf print pipeline can render.
 */

const META_KEYS = [
  "Session Date",
  "Subject",
  "Status",
  "Orientation",
  "Author",
  "Auteur",
  "Client",
  "User",
  "Tier",
  "Date",
] as const;

const META_LINE = new RegExp(
  `^(${META_KEYS.map((k) => k.replace(/ /g, "\\s+")).join("|")})\\s*:\\s*(.+)$`,
  "i",
);

const NUMBERED_SECTION = /^(\d+)\.\s+(.+)$/;

function isLikelyHeading(line: string): boolean {
  if (line.length < 3 || line.length > 120) return false;
  if (/[.!?]$/.test(line) && line.length > 80) return false;
  if (META_LINE.test(line)) return false;
  if (/^[-*•]\s+/.test(line)) return false;
  if (/^\|/.test(line)) return false;
  if (line.includes("| Feature") || /\|\s*-{3,}/.test(line)) return false;
  // Title Case or ends with colon short label
  if (/^[A-Z][\w'’\-]*(?:[\s:][A-Z(][\w'’\-)]*)*$/.test(line) && line.length < 90) return true;
  if (/^[A-Z][^.!?]{2,70}:$/.test(line)) return true;
  // "Operational Definitions: Prana vs. Chi" style subsection titles
  if (
    /^[A-Z][^.]{2,90}$/.test(line) &&
    line.split(/\s+/).length <= 12 &&
    !/^(The|A|An|To|In|For|With|By|From)\s/i.test(line)
  ) {
    return true;
  }
  return false;
}

/** Repair Word paste that collapses GFM tables onto one line. */
export function repairCollapsedTables(text: string): string {
  return text
    .split("\n")
    .flatMap((line) => {
      // Split prose glued to a table: `...mediums:| Feature |`
      const glued = line.replace(/([^|\n]):\s*\|/g, "$1:\n|").replace(/([^|\n])\| Feature/gi, "$1\n| Feature");
      return glued.split("\n");
    })
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed.includes("|")) return line;
      // e.g. `| A | B || ------ | ------ || c | d |`
      if (!/\|\s*\|/.test(trimmed) && !/\|[-: ]+\|/.test(trimmed)) return line;
      const parts = trimmed
        .split(/\|\s*\|/)
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk) => (chunk.startsWith("|") ? chunk : `| ${chunk}`))
        .map((chunk) => (chunk.endsWith("|") ? chunk : `${chunk} |`));
      if (parts.length < 2) return line;
      return parts.join("\n");
    })
    .join("\n");
}

function splitInlineMeta(line: string): string[] {
  // "Session Date:  X  Subject:  Y  Status:  Z"
  const hits: Array<{ key: string; index: number; length: number }> = [];
  for (const key of META_KEYS) {
    const re = new RegExp(`\\b${key.replace(/ /g, "\\s+")}\\s*:`, "ig");
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      hits.push({ key: m[0].replace(/\s*:$/, ""), index: m.index, length: m[0].length });
    }
  }
  hits.sort((a, b) => a.index - b.index || b.length - a.length);

  // Drop overlapping shorter matches (e.g. "Date" inside "Session Date")
  const filtered: typeof hits = [];
  for (const hit of hits) {
    const overlaps = filtered.some(
      (prev) => hit.index < prev.index + prev.length && hit.index + hit.length > prev.index,
    );
    if (!overlaps) filtered.push(hit);
  }
  if (filtered.length < 2) return [line];

  const out: string[] = [];
  for (let i = 0; i < filtered.length; i++) {
    const start = filtered[i].index;
    const end = i + 1 < filtered.length ? filtered[i + 1].index : line.length;
    const slice = line.slice(start, end).trim();
    if (slice) out.push(slice.replace(/\s{2,}/g, " "));
  }
  return out.length ? out : [line];
}

/**
 * Convert a plain technical / clinical report into Markdown.
 * Safe on already-markdown input (leaves # headings alone).
 */
export function normalizeReportToMarkdown(raw: string, fallbackTitle = "Document"): string {
  const text = repairCollapsedTables(raw.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim());
  if (!text) return "";

  // Already looks like Vault/markdown — keep as-is aside from table repair.
  if (/^---\s*\n/.test(text) || /^#{1,3}\s+\S/m.test(text)) {
    return text;
  }

  const lines = text.split("\n");
  const out: string[] = [];
  let title = "";
  let i = 0;

  // Title: first non-empty line, or "Report: …"
  while (i < lines.length && !lines[i].trim()) i += 1;
  if (i < lines.length) {
    const first = lines[i].trim();
    title = first.replace(/^(Technical\s+)?Masterclass\s+Report:\s*/i, "").trim() || first;
    if (/report\s*:/i.test(first) || first.length < 140) {
      out.push(`# ${first}`);
      i += 1;
    } else {
      out.push(`# ${fallbackTitle}`);
    }
  } else {
    out.push(`# ${fallbackTitle}`);
  }

  const meta: string[] = [];
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      i += 1;
      break;
    }
    const expanded = splitInlineMeta(trimmed);
    let consumed = false;
    for (const part of expanded) {
      const m = META_LINE.exec(part);
      if (m) {
        meta.push(`**${m[1]}:** ${m[2].trim()}`);
        consumed = true;
      }
    }
    if (!consumed) break;
    i += 1;
  }

  if (meta.length) {
    out.push("");
    out.push(...meta);
    out.push("");
  }

  let prevBlank = true;
  for (; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (!prevBlank) out.push("");
      prevBlank = true;
      continue;
    }

    const numbered = NUMBERED_SECTION.exec(trimmed);
    if (numbered && trimmed.length < 140) {
      out.push("");
      out.push(`## ${numbered[1]}. ${numbered[2].replace(/:$/, "")}`);
      out.push("");
      prevBlank = true;
      continue;
    }

    const prevOut = (out[out.length - 1] ?? "").trim();
    const afterTable = /^\|/.test(prevOut);
    if ((prevBlank || afterTable) && isLikelyHeading(trimmed) && !/^\|/.test(trimmed)) {
      const label = trimmed.replace(/:$/, "");
      out.push("");
      out.push(`### ${label}`);
      out.push("");
      prevBlank = true;
      continue;
    }

    // Bold lead-in "Label: rest" when short label — but short rest = subsection title
    const lead = /^([A-Z][^:]{1,48}):\s+(.+)$/.exec(trimmed);
    if (lead && !trimmed.startsWith("|") && lead[2].length > 12) {
      if (lead[2].length <= 60 && !/[.!?]$/.test(lead[2]) && lead[2].split(/\s+/).length <= 10) {
        out.push("");
        out.push(`### ${lead[1]}: ${lead[2]}`);
        out.push("");
        prevBlank = true;
        continue;
      }
      out.push(`**${lead[1]}:** ${lead[2]}`);
      prevBlank = false;
      continue;
    }

    out.push(rawLine);
    prevBlank = false;
  }

  const body = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  // Synthetic frontmatter for cover when no YAML present
  const slugTitle = title || fallbackTitle;
  return `---
titre: ${JSON.stringify(slugTitle)}
orientation: "REPORT"
domaine: "documentation"
auteur: "Aegis Document Studio"
created: "${new Date().toISOString().slice(0, 10)}"
---

${body}
`;
}
