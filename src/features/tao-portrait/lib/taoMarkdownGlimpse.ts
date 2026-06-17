/** Extract display fields from admin-authored Tao Markdown. */

import type { TaoPortraitFrontmatter } from "./taoMarkdownPrepare";
import { prepareTaoPortraitMarkdown } from "./taoMarkdownPrepare";

export interface TaoMarkdownPreview {
  title: string;
  lead: string;
  excerpt: string;
  frontmatter: TaoPortraitFrontmatter | null;
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.+?)\]\([^)]+\)/g, "$1")
    .trim();
}

function isInternalCodename(title: string): boolean {
  return /^P\d{2}/i.test(title) || /^T\d[A-Za-z]/i.test(title);
}

function isSkippableBodyLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (/^#{1,6}\s/.test(t)) return true;
  if (/^[-*+]\s/.test(t)) return true;
  if (/^\d+\.\s/.test(t)) return true;
  if (t.startsWith("|")) return true;
  if (t === "---") return true;
  return false;
}

export function extractTaoMarkdownPreview(
  markdown: string,
  options?: { maxChars?: number; maxParagraphs?: number; displayName?: string | null },
): TaoMarkdownPreview {
  const maxChars = options?.maxChars ?? 480;
  const maxParagraphs = options?.maxParagraphs ?? 4;
  const { frontmatter, body } = prepareTaoPortraitMarkdown(markdown, {
    displayName: options?.displayName,
  });
  const lines = body.replace(/\r\n/g, "\n").split("\n");

  let title = frontmatter?.titre ?? "";
  const paragraphs: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^#\s+/.test(trimmed)) {
      const h1 = stripInlineMarkdown(trimmed.replace(/^#+\s+/, ""));
      if (h1 && (!title || isInternalCodename(title))) title = h1;
      continue;
    }

    if (isSkippableBodyLine(trimmed)) continue;

    paragraphs.push(stripInlineMarkdown(trimmed));
    if (paragraphs.length >= maxParagraphs) break;
  }

  const lead = paragraphs[0] ?? "";
  let excerpt = paragraphs.join("\n\n");
  if (excerpt.length > maxChars) {
    excerpt = `${excerpt.slice(0, maxChars - 1).trim()}…`;
  }
  if (lead.length > 200) {
    return {
      title,
      lead: `${lead.slice(0, 197).trim()}…`,
      excerpt,
      frontmatter,
    };
  }

  return { title, lead, excerpt, frontmatter };
}

/** @deprecated Use extractTaoMarkdownPreview */
export function extractTaoMarkdownGlimpse(markdown: string): { title: string; lead: string } {
  const { title, lead } = extractTaoMarkdownPreview(markdown, { maxChars: 200, maxParagraphs: 1 });
  return { title, lead };
}
