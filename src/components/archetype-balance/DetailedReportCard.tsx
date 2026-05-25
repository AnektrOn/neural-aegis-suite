import { useState } from "react";
import { FileText, ChevronDown } from "lucide-react";
import { NeuralCard } from "@/components/ui/neural-card";
import { cn } from "@/lib/utils";
import type { DetailedReport } from "@/lib/archetype-cartography/types";
import { ReportSectionPanel } from "./ReportSectionPanel";

export function DetailedReportCard({
  report,
  defaultOpen = true,
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
          className="flex w-full min-h-[52px] items-center gap-4 border-b border-border-subtle/40 bg-gradient-to-br from-white/[0.04] to-transparent px-4 py-4 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6"
          aria-expanded={open}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--neural-accent)/0.3)] bg-[hsl(var(--sidebar-accent))]">
            <FileText size={18} strokeWidth={1.5} className="text-[hsl(var(--neural-accent))]" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <span className="font-display text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--neural-accent))]">
              {report.code}
            </span>
            <h3 className="mt-0.5 font-display text-base leading-snug text-text-primary">
              {report.title}
            </h3>
            {report.subtitle && (
              <p className="mt-1 text-xs text-text-tertiary">{report.subtitle}</p>
            )}
          </div>
          <ChevronDown
            size={18}
            strokeWidth={1.5}
            className={cn(
              "shrink-0 text-text-tertiary transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {open && (
          <div className="space-y-4 px-4 py-5 sm:px-6">
            {report.sections.map((section, i) => (
              <ReportSectionPanel
                key={section.id}
                section={section}
                index={i + 1}
                defaultOpen={i === 0}
                accentClass="border-[hsl(var(--neural-accent))]"
              />
            ))}
            {report.footer && (
              <p className="border-t border-border-subtle/30 pt-4 text-center text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                {report.footer}
              </p>
            )}
          </div>
        )}
      </NeuralCard>
    </article>
  );
}
