import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { NeuralCard } from "@/components/ui/neural-card";
import { cn } from "@/lib/utils";
import type { ReportSection } from "@/lib/archetype-cartography/types";
import { ReportContentBlocks } from "./ReportContentBlocks";

interface ReportSectionAccordionProps {
  section: ReportSection;
  defaultOpen?: boolean;
  depth?: number;
}

export function ReportSectionAccordion({
  section,
  defaultOpen = false,
  depth = 0,
}: ReportSectionAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const hasBody = section.blocks.length > 0;
  const hasChildren = (section.subsections?.length ?? 0) > 0;

  return (
    <article id={section.id} className="scroll-mt-[calc(var(--safe-top)+9rem)]">
      <NeuralCard
        variant={depth === 0 ? "premium" : "default"}
        glow={depth === 0 ? "warm" : "none"}
        className={cn("overflow-hidden p-0", depth > 0 && "bg-white/[0.02]")}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full min-h-[44px] items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={open}
        >
          <div className="min-w-0">
            <h3
              className={cn(
                "font-display uppercase tracking-[0.08em] text-text-primary",
                depth === 0 ? "text-sm sm:text-base" : "text-xs sm:text-sm",
              )}
            >
              {section.title}
            </h3>
            {section.subtitle && (
              <p className="mt-1 text-xs italic text-text-tertiary">{section.subtitle}</p>
            )}
          </div>
          {(hasBody || hasChildren) && (
            <ChevronDown
              size={18}
              strokeWidth={1.5}
              className={cn(
                "mt-0.5 shrink-0 text-text-tertiary transition-transform duration-200",
                open && "rotate-180",
              )}
              aria-hidden
            />
          )}
        </button>

        {open && (hasBody || hasChildren) && (
          <div className="space-y-3 border-t border-border-subtle/60 px-4 pb-4 pt-3">
            {hasBody && <ReportContentBlocks blocks={section.blocks} />}
            {hasChildren && (
              <div className="space-y-2 pl-0 sm:pl-2">
                {section.subsections!.map((sub) => (
                  <ReportSectionAccordion
                    key={sub.id}
                    section={sub}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </NeuralCard>
    </article>
  );
}
