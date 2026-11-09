import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const decisionFieldClass =
  "flex h-11 w-full rounded-xl border border-white/10 bg-black/30 dark:bg-black/40 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 transition-colors focus:outline-none focus:border-[#c9a24b]/50 shadow-sm";

export const decisionLabelClass = "font-cinzel text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground";

const panelClass = "aegis-dock-tile rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]";

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
