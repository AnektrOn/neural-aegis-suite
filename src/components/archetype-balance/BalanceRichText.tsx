import type { ReactNode } from "react";

/** Inline markdown: **bold**, *italic* */
export function parseInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold text-text-primary">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <em key={key++} className="italic text-text-secondary">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    nodes.push(<span key={key++}>{text.slice(last)}</span>);
  }

  return nodes.length ? nodes : [text];
}

export function BalanceRichText({
  text,
  className,
  as: Tag = "p",
}: {
  text: string;
  className?: string;
  as?: "p" | "span" | "div";
}) {
  return <Tag className={className}>{parseInlineMarkdown(text)}</Tag>;
}

export function RichTextInline({ text, className }: { text: string; className?: string }) {
  return <BalanceRichText text={text} as="span" className={className} />;
}

/** Strip emoji used as decorative prefixes in headings (keep in prose if needed). */
export function cleanSectionTitle(title: string): string {
  return title
    .replace(/^[⚖️🌑🌕]\s*/u, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sectionTitleParts(title: string): {
  num: string | null;
  label: string;
  pole: "shadow" | "light" | "balance" | null;
} {
  const cleaned = cleanSectionTitle(title);
  const roman = cleaned.match(/^([IVXLC]+)\.\s*(.+)$/i);
  if (roman) {
    return {
      num: roman[1].toUpperCase(),
      label: roman[2].trim(),
      pole: detectPole(roman[2]),
    };
  }
  const arabic = cleaned.match(/^(\d+)\.\s*(.+)$/);
  if (arabic) {
    return {
      num: arabic[1],
      label: arabic[2].trim(),
      pole: detectPole(arabic[2]),
    };
  }
  return { num: null, label: cleaned, pole: detectPole(cleaned) };
}

export function detectPole(text: string): "shadow" | "light" | "balance" | null {
  const u = text.toUpperCase();
  if (/SHADOW|OMBRE|🌑/.test(u)) return "shadow";
  if (/LIGHT|LUMI|🌕/.test(u)) return "light";
  if (/BALANCE|⚖️/.test(u)) return "balance";
  return null;
}

export function poleAccentClasses(pole: "shadow" | "light" | "balance" | null): {
  border: string;
  badge: string;
  glow: string;
} {
  switch (pole) {
    case "shadow":
      return {
        border: "border-destructive/35",
        badge: "border-destructive/40 text-destructive bg-destructive/10",
        glow: "from-destructive/10 to-transparent",
      };
    case "light":
      return {
        border: "border-success/35",
        badge: "border-success/40 text-success bg-success/10",
        glow: "from-success/10 to-transparent",
      };
    default:
      return {
        border: "border-[hsl(var(--aegis-warm)/0.35)]",
        badge: "border-[hsl(var(--aegis-warm)/0.4)] text-[hsl(var(--aegis-warm))] bg-[hsl(var(--aegis-warm-muted)/0.15)]",
        glow: "from-[hsl(var(--aegis-warm-muted)/0.12)] to-transparent",
      };
  }
}
