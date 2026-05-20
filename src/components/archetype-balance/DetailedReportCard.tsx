import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { NeuralCard } from "@/components/ui/neural-card";
import { cn } from "@/lib/utils";
import type { DetailedReport } from "@/lib/archetype-cartography/types";
import { ReportSectionAccordion } from "./ReportSectionAccordion";

export function DetailedReportCard({
  report,
  defaultOpen = false,
}: {
  report: DetailedReport;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article id={`rapport-${report.id}`} className="scroll-mt-[calc(var(--safe-top)+9rem)]">
      <NeuralCard variant="premium" glow="purple" className="overflow-hidden p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full min-h-[44px] items-start gap-3 p-4 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={open}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[hsl(var(--neural-accent)/0.3)] bg-[hsl(var(--sidebar-accent))]">
            <FileText
              size={16}
              strokeWidth={1.5}
              className="text-[hsl(var(--neural-accent))]"
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-display uppercase tracking-[0.22em] text-[hsl(var(--neural-accent))]">
              {report.code}
            </p>
            <h3 className="mt-1 font-display text-sm uppercase tracking-[0.08em] text-text-primary sm:text-base">
              {report.title}
            </h3>
            <p className="mt-1 text-xs text-text-tertiary">{report.subtitle}</p>
          </div>
          <ChevronDown
            size={18}
            strokeWidth={1.5}
            className={cn(
              "mt-1 shrink-0 text-text-tertiary transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {open && (
          <div className="space-y-3 border-t border-border-subtle/60 px-4 pb-4 pt-3">
            {report.sections.map((section, i) => (
              <ReportSectionAccordion
                key={section.id}
                section={section}
                defaultOpen={i === 0}
                depth={1}
              />
            ))}
            {report.footer && (
              <p className="pt-2 text-center text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
                {report.footer}
              </p>
            )}
          </div>
        )}
      </NeuralCard>
    </article>
  );
}
