import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { prepareTaoPortraitMarkdown } from "../lib/taoMarkdownPrepare";
import { TaoPortraitMetaStrip } from "./TaoPortraitMetaStrip";

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

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="font-cormorant-display text-2xl sm:text-3xl text-foreground leading-tight tracking-tight mb-6 mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 mb-4 font-display text-lg sm:text-xl font-medium tracking-tight text-foreground scroll-mt-24 border-b border-border/30 pb-2 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 mb-3 font-display text-base sm:text-lg font-medium text-foreground scroll-mt-24">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-sm sm:text-[0.9375rem] text-muted-foreground leading-relaxed font-body last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-medium text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-5 space-y-2 pl-1 list-none">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-5 space-y-2 pl-5 list-decimal marker:text-[var(--tao-accent)] marker:font-medium">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="relative pl-4 text-sm sm:text-[0.9375rem] text-muted-foreground leading-relaxed font-body before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-[var(--tao-accent)]">
      {children}
    </li>
  ),
  hr: () => (
    <div className="my-10 flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-border/50" />
      <span className="h-1 w-1 rounded-full bg-[var(--tao-accent)] opacity-60" aria-hidden />
      <span className="h-px flex-1 bg-border/50" />
    </div>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-[var(--tao-accent)] pl-4 text-sm italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg bg-muted/50 p-4 text-xs font-mono text-foreground">
          {flattenText(children)}
        </code>
      );
    }
    return (
      <code className="rounded bg-muted/60 px-1.5 py-0.5 text-xs font-mono text-foreground">
        {flattenText(children)}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-lg border border-border/30 bg-muted/40 p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-border/40">
      <table className="w-full min-w-[280px] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/40 border-b border-border/40">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2.5 text-left text-[10px] font-display uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2.5 text-muted-foreground border-t border-border/25 leading-relaxed">
      {children}
    </td>
  ),
  tr: ({ children }) => <tr className="hover:bg-muted/20 transition-colors">{children}</tr>,
  a: ({ href, children }) => {
    const external = href?.startsWith("http");
    return (
      <a
        href={href}
        className="font-medium text-[var(--tao-accent)] underline underline-offset-4 decoration-[var(--tao-accent)]/30 hover:decoration-[var(--tao-accent)]"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
        {external ? <ExternalLink size={12} className="inline ml-1 opacity-70" aria-hidden /> : null}
      </a>
    );
  },
};

export function TaoMarkdownBody({
  markdown,
  className,
  accentColor,
}: {
  markdown: string;
  className?: string;
  accentColor?: string;
}) {
  const { frontmatter, body } = prepareTaoPortraitMarkdown(markdown);

  if (!body.trim() && !frontmatter) {
    return null;
  }

  return (
    <div
      className={cn("tao-markdown-body", className)}
      style={accentColor ? ({ "--tao-accent": accentColor } as React.CSSProperties) : undefined}
    >
      {frontmatter ? (
        <TaoPortraitMetaStrip frontmatter={frontmatter} accentColor={accentColor} />
      ) : null}
      {body.trim() ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {body}
        </ReactMarkdown>
      ) : null}
    </div>
  );
}
