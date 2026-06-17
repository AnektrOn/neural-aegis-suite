import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeepDiveSection({
  step,
  icon: Icon,
  kicker,
  title,
  description,
  badge,
  className,
  children,
}: {
  step?: string;
  icon?: LucideIcon;
  kicker: string;
  title?: string;
  description?: string;
  badge?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("deep-dive-section space-y-4", className)} aria-labelledby={title ? `deep-dive-${step ?? kicker}` : undefined}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          {step ? (
            <span
              className="shrink-0 mt-0.5 font-display text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--aegis-warm)/0.85)] tabular-nums"
              aria-hidden
            >
              {step}
            </span>
          ) : null}
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display">
              {Icon ? <Icon size={14} strokeWidth={1.5} aria-hidden /> : null}
              {kicker}
            </div>
            {title ? (
              <h2
                id={`deep-dive-${step ?? kicker}`}
                className="font-display text-xl sm:text-2xl tracking-[0.1em] uppercase text-text-primary leading-tight"
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">{description}</p>
            ) : null}
          </div>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      {children}
    </section>
  );
}
