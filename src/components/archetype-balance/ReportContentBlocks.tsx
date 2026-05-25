import { cn } from "@/lib/utils";
import type { TextBlock } from "@/lib/archetype-cartography/types";
import { BalanceRichText, RichTextInline } from "./BalanceRichText";
import { MermaidDiagram } from "./MermaidDiagram";

export function ReportContentBlocks({
  blocks,
  className,
}: {
  blocks: TextBlock[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-5", className)}>
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
          className="text-[15px] leading-[1.7] text-text-secondary"
        />
      );
    case "quote":
      return (
        <blockquote className="relative rounded-xl border border-[hsl(var(--aegis-warm)/0.18)] bg-gradient-to-br from-[hsl(var(--aegis-warm-muted)/0.1)] to-transparent py-3.5 pl-5 pr-4">
          <span
            className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-[hsl(var(--aegis-warm)/0.55)]"
            aria-hidden
          />
          <BalanceRichText
            text={block.text}
            className="text-sm italic leading-relaxed text-text-primary/90"
          />
        </blockquote>
      );
    case "list":
      if (block.ordered) {
        return (
          <ol className="space-y-3 pl-0">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--aegis-warm)/0.25)] bg-black/20 font-display text-xs font-semibold text-[hsl(var(--aegis-warm))]"
                  aria-hidden
                >
                  {j + 1}
                </span>
                <RichTextInline text={item} className="flex-1 pt-0.5 leading-relaxed" />
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="space-y-2.5">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
              <span
                className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--aegis-warm)/0.7)]"
                aria-hidden
              />
              <RichTextInline text={item} className="flex-1 leading-relaxed" />
            </li>
          ))}
        </ul>
      );
    case "labeled":
      return (
        <div className="flex flex-col gap-2 rounded-xl border border-border-subtle/35 bg-white/[0.025] px-4 py-3.5 sm:flex-row sm:gap-5">
          <p className="shrink-0 font-display text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--aegis-warm))] sm:w-36 sm:pt-0.5">
            {block.label}
          </p>
          <BalanceRichText
            text={block.text}
            className="text-sm leading-relaxed text-text-secondary sm:flex-1"
          />
        </div>
      );
    case "table":
      return (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border-subtle/40 sm:block">
            <table className="w-full min-w-[480px] border-collapse text-sm lg:min-w-0">
              <thead>
                <tr className="border-b border-border-subtle/50 bg-white/[0.05]">
                  {block.headers.map((h, j) => (
                    <th
                      key={j}
                      className="px-4 py-3 text-left font-display text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="border-b border-border-subtle/20 last:border-0 transition-colors hover:bg-white/[0.02]"
                  >
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-3 align-top text-text-secondary">
                        <RichTextInline text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2 sm:hidden">
            {block.rows.map((row, ri) => (
              <div
                key={ri}
                className="space-y-2 rounded-xl border border-border-subtle/40 bg-white/[0.03] p-3.5"
              >
                {row.map((cell, ci) => (
                  <div key={ci}>
                    {block.headers[ci] && (
                      <p className="text-[10px] font-display uppercase tracking-[0.1em] text-text-tertiary">
                        {block.headers[ci]}
                      </p>
                    )}
                    <RichTextInline text={cell} className="mt-0.5 text-sm text-text-secondary" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      );
    case "mermaid":
      return <MermaidDiagram source={block.source} />;
    default:
      return null;
  }
}
