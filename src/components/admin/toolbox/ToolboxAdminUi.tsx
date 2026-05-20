import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const toolboxFieldClass =
  "flex h-11 w-full rounded-lg border border-border/60 bg-bg-elevated/80 px-3 py-2 text-base text-text-primary shadow-sm transition-colors placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base md:text-sm";

export const toolboxLabelClass = "text-sm font-medium text-text-primary";

const panelClass = "ethereal-glass";

export function ToolboxPageStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className={cn(panelClass, "p-5 md:p-6")}>
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-text-primary">{value}</p>
          <p className="mt-1 text-sm leading-snug text-text-secondary">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function ToolboxSection({
  title,
  description,
  badge,
  children,
  className,
}: {
  title: string;
  description?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-text-primary md:text-xl">{title}</h2>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">{description}</p>
          ) : null}
        </div>
        {badge ? (
          <Badge variant="secondary" className="w-fit shrink-0 border-border/60 px-3 py-1 text-sm font-normal">
            {badge}
          </Badge>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ToolboxPanel({
  title,
  description,
  children,
  highlight,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        panelClass,
        "p-5 md:p-6",
        highlight && "border-accent-warning/50 ring-1 ring-accent-warning/30",
      )}
    >
      <div className="space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {description ? <p className="text-sm leading-relaxed text-text-secondary">{description}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function ToolboxResourceCard({
  icon: Icon,
  iconClassName,
  title,
  badges,
  description,
  footer,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  badges: ReactNode;
  description?: string | null;
  footer: ReactNode;
}) {
  return (
    <article className={cn(panelClass, "overflow-hidden")}>
      <div className="flex gap-4 p-5 md:gap-5 md:p-6">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-bg-elevated/60 md:size-16">
          <Icon className={cn("size-6 md:size-7", iconClassName)} strokeWidth={1.5} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <h4 className="text-base font-semibold leading-snug text-text-primary md:text-lg">{title}</h4>
          <div className="flex flex-wrap gap-2">{badges}</div>
          {description ? (
            <p className="text-sm leading-relaxed text-text-secondary line-clamp-3">{description}</p>
          ) : null}
        </div>
      </div>
      <Separator className="bg-border/60" />
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-end md:p-6">
        {footer}
      </div>
    </article>
  );
}

export function ToolboxEmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
}) {
  return (
    <div className={cn(panelClass, "border-dashed px-6 py-14 text-center md:py-16")}>
      <Icon className="mx-auto mb-4 size-10 text-text-tertiary" strokeWidth={1.25} aria-hidden />
      <p className="text-base font-medium text-text-primary">{title}</p>
      {hint ? <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">{hint}</p> : null}
    </div>
  );
}

export function ToolboxLoadingBlock({ message }: { message: string }) {
  return (
    <div
      className={cn(panelClass, "flex flex-col items-center justify-center gap-4 py-16 md:py-20")}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="size-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}
