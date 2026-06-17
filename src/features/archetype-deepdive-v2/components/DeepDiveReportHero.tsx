import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AnyArchetypeKey } from "../domain/types";

const RANK_STYLES: Record<"dominant" | "secondaire" | "tertiaire", string> = {
  dominant: "border-[hsl(var(--aegis-warm)/0.45)] bg-[hsl(var(--aegis-warm-muted)/0.35)] text-[hsl(var(--aegis-warm))]",
  secondaire: "border-white/15 bg-white/[0.04] text-text-primary",
  tertiaire: "border-white/10 bg-white/[0.02] text-text-secondary",
};

interface TriadChip {
  archetype: AnyArchetypeKey;
  label: string;
  rank: "dominant" | "secondaire" | "tertiaire";
}

export function DeepDiveReportHero({
  kicker,
  title,
  subtitle,
  triad = [],
  actions,
  className,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  triad?: TriadChip[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "deep-dive-hero relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-8",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 deep-dive-hero-mesh" aria-hidden />
      <div className="relative z-[1] space-y-5">
        <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display">
          <FileText size={14} strokeWidth={1.5} aria-hidden />
          {kicker}
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2 min-w-0 flex-1">
            <h1 className="font-display text-3xl sm:text-4xl tracking-[0.12em] uppercase text-text-primary leading-tight text-balance">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-xl">{subtitle}</p>
          </div>

          {triad.length > 0 ? (
            <ul className="flex flex-wrap gap-2 lg:justify-end shrink-0" aria-label="Dominant triad">
              {triad.map((t) => (
                <li key={t.archetype}>
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.14em] border",
                      RANK_STYLES[t.rank],
                    )}
                  >
                    {t.label}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
      </div>
    </header>
  );
}
