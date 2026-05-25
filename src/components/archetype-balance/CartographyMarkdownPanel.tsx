import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { sanitizeCartographyMarkdown } from "@/lib/cartography-document-parse";

const PROSE_CLASSES = cn(
  "prose prose-sm dark:prose-invert max-w-none",
  // Headings
  "prose-headings:font-display prose-headings:tracking-wide prose-headings:text-text-primary",
  "prose-h1:text-lg prose-h1:mt-0 prose-h1:mb-4",
  "prose-h2:text-base prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-[hsl(var(--aegis-warm)/0.2)] prose-h2:pb-2",
  "prose-h3:text-sm prose-h3:mt-6 prose-h3:mb-2",
  "prose-h4:text-xs prose-h4:mt-4 prose-h4:mb-1 prose-h4:uppercase prose-h4:tracking-[0.12em]",
  // Body
  "prose-p:text-text-secondary prose-p:leading-relaxed",
  "prose-strong:text-text-primary prose-strong:font-semibold",
  "prose-em:text-text-secondary",
  // Blockquotes
  "prose-blockquote:border-l-2 prose-blockquote:border-[hsl(var(--aegis-warm)/0.5)] prose-blockquote:bg-white/[0.03] prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:pl-4 prose-blockquote:pr-3 prose-blockquote:italic prose-blockquote:text-text-secondary",
  // Lists
  "prose-li:text-text-secondary prose-li:leading-relaxed prose-li:marker:text-[hsl(var(--aegis-warm)/0.6)]",
  "prose-ol:marker:text-[hsl(var(--aegis-warm)/0.6)]",
  // Links & HR
  "prose-a:text-[hsl(var(--aegis-warm))] prose-a:no-underline hover:prose-a:underline",
  "prose-hr:border-border-subtle/30 prose-hr:my-6",
);

const TABLE_CLASSES = cn(
  "[&_table]:w-full [&_table]:text-xs [&_table]:border-collapse",
  "[&_table]:rounded-lg [&_table]:overflow-hidden",
  "[&_thead]:bg-white/[0.06]",
  "[&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-display [&_th]:text-[10px] [&_th]:uppercase [&_th]:tracking-[0.12em] [&_th]:text-text-tertiary [&_th]:border-b [&_th]:border-border-subtle/40",
  "[&_td]:px-3 [&_td]:py-2.5 [&_td]:text-text-secondary [&_td]:border-b [&_td]:border-border-subtle/20 [&_td]:leading-relaxed",
  "[&_tr:last-child_td]:border-b-0",
  "[&_tr:hover_td]:bg-white/[0.02]",
);

export function CartographyMarkdownPanel({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  const body = sanitizeCartographyMarkdown(markdown);

  return (
    <div className={cn(className)}>
      <div className={cn(PROSE_CLASSES, TABLE_CLASSES)}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
      </div>
    </div>
  );
}
