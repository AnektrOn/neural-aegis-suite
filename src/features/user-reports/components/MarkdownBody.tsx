import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Rendu Markdown unique pour tout le ClinicalReportReader.
 * Remplace tous les <ReactMarkdown remarkPlugins={[remarkGfm]}> + classes [&_p]:... dispersées.
 * Gère : tableaux (scroll horizontal), blocs de code / ASCII art, h1-h4, blockquote, hr, listes.
 */
const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-8 mb-4 font-cormorant-display text-3xl sm:text-4xl font-normal text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-8 mb-3 font-cormorant-display text-2xl font-normal text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 mb-2 font-display text-sm uppercase tracking-wider text-primary">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-7 mb-2 flex items-center gap-2 font-cormorant-display text-xl text-foreground">
      <span aria-hidden className="h-4 w-0.5 rounded-full bg-primary/70" />
      {children}
    </h4>
  ),
  p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="text-foreground/80">{children}</em>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-5 marker:text-primary/60">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-5 marker:text-primary/70">{children}</ol>,
  li: ({ children }) => <li className="pl-1 [&>ul]:mt-1.5 [&>p]:mb-1">{children}</li>,
  hr: () => <hr className="my-8 border-white/10" />,
  blockquote: ({ children }) => (
    <blockquote className="my-6 rounded-r-xl border-l-2 border-primary/60 bg-primary/5 px-5 py-3 font-cormorant-display text-lg italic leading-relaxed text-foreground/90 [&_p]:mb-0">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-4 hover:text-primary/80"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-black/20">
      <table className="w-full min-w-[640px] border-collapse text-left text-[13px] leading-relaxed">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-white/10 px-3.5 py-2.5 font-display text-[10px] font-medium uppercase tracking-widest text-primary">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-white/5 px-3.5 py-2.5 align-top text-foreground/85">
      {children}
    </td>
  ),
  tr: ({ children }) => <tr className="transition-colors hover:bg-white/[0.03]">{children}</tr>,
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs leading-relaxed text-foreground/85">
      {children}
    </pre>
  ),
  code: ({ className, children }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-primary">
        {children}
      </code>
    ),
};

export interface MarkdownBodyProps {
  children?: string | null;
  size?: "sm" | "base";
  className?: string;
}

export function MarkdownBody({ children, size = "base", className }: MarkdownBodyProps) {
  if (!children) return null;

  return (
    <div
      className={cn(
        "font-body text-foreground/90",
        size === "base" ? "text-[15px] leading-[1.8]" : "text-sm leading-relaxed",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
