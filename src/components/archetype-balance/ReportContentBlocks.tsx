import { cn } from "@/lib/utils";
import type { TextBlock } from "@/lib/archetype-cartography/types";
import { BalanceRichText } from "./BalanceRichText";

export function ReportContentBlocks({
  blocks,
  className,
}: {
  blocks: TextBlock[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: TextBlock }) {
  switch (block.type) {
    case "p":
      return (
        <BalanceRichText
          text={block.text}
          className="text-sm leading-relaxed text-text-secondary"
        />
      );
    case "quote":
      return (
        <blockquote className="border-l-2 border-[hsl(var(--aegis-warm)/0.5)] bg-white/[0.03] py-2 pl-4 pr-2 italic">
          <BalanceRichText text={block.text} className="text-sm text-text-secondary" />
        </blockquote>
      );
    case "list":
      if (block.ordered) {
        return (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-text-secondary marker:text-text-tertiary">
            {block.items.map((item, j) => (
              <li key={j}>
                <BalanceRichText text={item} className="leading-relaxed" />
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="list-disc space-y-2 pl-5 text-sm text-text-secondary marker:text-text-tertiary">
          {block.items.map((item, j) => (
            <li key={j}>
              <BalanceRichText text={item} className="leading-relaxed" />
            </li>
          ))}
        </ul>
      );
    case "labeled":
      return (
        <div className="rounded-lg border border-border-subtle/50 bg-white/[0.02] px-3 py-2.5">
          <p className="text-[10px] font-display uppercase tracking-[0.18em] text-[hsl(var(--aegis-warm))]">
            {block.label}
          </p>
          <BalanceRichText
            text={block.text}
            className="mt-1.5 text-sm leading-relaxed text-text-secondary"
          />
        </div>
      );
    default:
      return null;
  }
}
