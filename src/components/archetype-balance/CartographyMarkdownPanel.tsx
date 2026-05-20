import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export function CartographyMarkdownPanel({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-headings:font-display prose-headings:tracking-wide prose-headings:text-text-primary",
        "prose-p:text-text-secondary prose-p:leading-relaxed",
        "prose-strong:text-text-primary prose-blockquote:border-[hsl(var(--aegis-warm)/0.5)]",
        "prose-li:text-text-secondary prose-a:text-[hsl(var(--aegis-warm))]",
        className,
      )}
    >
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
