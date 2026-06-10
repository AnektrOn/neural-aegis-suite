import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const decisionFieldClass =
  "flex h-11 w-full rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-base text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background md:text-sm";

export const decisionLabelClass = "text-sm font-medium text-foreground";

const panelClass = "glass-card border-0";

export function DecisionPageStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className={cn(panelClass, "p-4 md:p-6")}>
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary md:size-12">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground md:text-3xl">{value}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground md:text-sm">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function DecisionSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4 md:space-y-5", className)}>
      {title ? (
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">{title}</h2>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function DecisionCard({
  children,
  footer,
  className,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn(panelClass, "overflow-hidden", className)}>
      <div className="p-5 md:p-6">{children}</div>
      {footer ? (
        <>
          <Separator className="bg-border/50" />
          <div className="p-4 md:px-6 md:py-4">{footer}</div>
        </>
      ) : null}
    </article>
  );
}

export function DecisionMetaBadge({
  children,
  variant = "outline",
  className,
}: {
  children: ReactNode;
  variant?: "outline" | "secondary";
  className?: string;
}) {
  return (
    <Badge
      variant={variant}
      className={cn("px-2.5 py-0.5 text-xs font-normal", className)}
    >
      {children}
    </Badge>
  );
}

export function DecisionEmptyState({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className={cn(panelClass, "px-6 py-14 text-center md:py-16")}>
      <Icon className="mx-auto mb-4 size-10 text-muted-foreground/35" strokeWidth={1.25} aria-hidden />
      <p className="text-base font-medium text-foreground">{title}</p>
    </div>
  );
}
