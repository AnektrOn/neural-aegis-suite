import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

function flattenText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (typeof node === "object" && "props" in node) {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>;
    return flattenText(el.props.children);
  }
  return "";
}

const HASHTAG_LINE_RE = /^(#[\p{L}\p{N}_-]+(?:\s+#[\p{L}\p{N}_-]+)*)\s*$/u;

function isHashtagLine(text: string): boolean {
  return HASHTAG_LINE_RE.test(text.trim());
}

function parseHashtags(text: string): string[] {
  return text.trim().split(/\s+/).filter((t) => t.startsWith("#"));
}

function isHighlightParagraph(node: { children?: { type?: string }[] } | undefined): boolean {
  const kids = node?.children;
  if (!kids || kids.length !== 1) return false;
  return kids[0]?.type === "strong";
}

function isLinkOnlyParagraph(node: { children?: { type?: string }[] } | undefined): boolean {
  const kids = node?.children;
  if (!kids || kids.length !== 1) return false;
  return kids[0]?.type === "link";
}

const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mt-16 mb-5 font-display text-2xl sm:text-[1.65rem] font-medium tracking-tight text-foreground scroll-mt-24">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <div className="mt-14 mb-5 scroll-mt-24">
      <div className="flex items-start gap-4">
        <span
          className="mt-2.5 h-px w-8 shrink-0 bg-gradient-to-r from-[hsl(var(--aegis-warm))] to-transparent"
          aria-hidden
        />
        <h3 className="font-display text-lg sm:text-xl font-medium tracking-tight text-foreground leading-snug">
          {children}
        </h3>
      </div>
    </div>
  ),
  p: ({ children, node }) => {
    const text = flattenText(children).trim();

    if (isHashtagLine(text)) {
      const tags = parseHashtags(text);
      return (
        <footer
          className="mt-16 pt-8 border-t border-border-subtle/70"
          aria-label="Tags"
        >
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag}>
                <span className="inline-flex items-center rounded-full border border-[hsl(var(--aegis-warm)/0.28)] bg-[hsl(var(--aegis-warm-muted)/0.35)] px-3 py-1 text-[11px] font-display uppercase tracking-[0.14em] text-[hsl(var(--aegis-warm))]">
                  {tag.replace(/^#/, "")}
                </span>
              </li>
            ))}
          </ul>
        </footer>
      );
    }

    if (isHighlightParagraph(node)) {
      return (
        <p className="my-10 rounded-2xl border border-[hsl(var(--aegis-warm)/0.22)] bg-gradient-to-br from-[hsl(var(--aegis-warm-muted)/0.45)] to-transparent px-6 py-8 text-center text-xl sm:text-2xl font-medium leading-snug text-foreground shadow-[0_0_40px_hsl(var(--aegis-warm)/0.06)]">
          {children}
        </p>
      );
    }

    if (isLinkOnlyParagraph(node)) {
      return (
        <div className="my-12 flex justify-center">
          <span className="newsletter-inline-cta">{children}</span>
        </div>
      );
    }

    return (
      <p className="mb-6 text-[1.0625rem] sm:text-lg leading-[1.85] text-text-secondary [&:first-of-type]:text-[1.125rem] [&:first-of-type]:sm:text-[1.2rem] [&:first-of-type]:leading-[1.8] [&:first-of-type]:text-foreground/90">
        {children}
      </p>
    );
  },
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-foreground/90">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="relative my-10 rounded-2xl border border-border-subtle/60 bg-bg-surface/50 px-6 py-6 sm:px-8 sm:py-7">
      <span
        className="pointer-events-none absolute left-5 top-4 font-serif text-5xl leading-none text-[hsl(var(--aegis-warm)/0.25)] select-none"
        aria-hidden
      >
        "
      </span>
      <div className="relative pl-6 text-base sm:text-lg leading-relaxed text-text-secondary [&_strong]:text-foreground">
        {children}
      </div>
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="my-8 space-y-3 pl-0 list-none">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-8 space-y-3 pl-0 list-none counter-reset-[newsletter-list]">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="newsletter-list-item relative pl-9 text-[1.0625rem] leading-[1.75] text-text-secondary">
      {children}
    </li>
  ),
  hr: () => (
    <div className="my-14 flex items-center gap-4" role="separator">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border-subtle to-transparent" />
      <span
        className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--aegis-warm)/0.6)]"
        aria-hidden
      />
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border-subtle to-transparent" />
    </div>
  ),
  a: ({ href, children }) => {
    const external = href?.startsWith("http");
    return (
      <a
        href={href}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium text-[hsl(var(--aegis-warm))] underline decoration-[hsl(var(--aegis-warm)/0.35)] underline-offset-4 transition-colors duration-200 hover:decoration-[hsl(var(--aegis-warm))]",
          "newsletter-body-link",
        )}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
        {external && <ExternalLink size={14} className="opacity-70" aria-hidden />}
      </a>
    );
  },
};

export function NewsletterMarkdownBody({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div className={cn("newsletter-markdown-body", className)}>
      <ReactMarkdown components={markdownComponents}>{markdown}</ReactMarkdown>
    </div>
  );
}
