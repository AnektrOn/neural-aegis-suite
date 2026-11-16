import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  toolsBentoElevated,
  toolsChipActive,
  toolsChipInactive,
  toolsMetricLabel,
  toolsMetricValue,
} from "./toolsDesign";

export function ToolField({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {hint ? (
          <span className="font-mono text-sm tabular-nums text-[color:var(--aegis-bronze-ink)]">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function ToolChip({
  active,
  onClick,
  children,
  fullWidth = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(active ? toolsChipActive : toolsChipInactive, fullWidth && "w-full px-5 py-4 text-left")}
    >
      {children}
    </button>
  );
}

export function ToolChipStack({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-col gap-3">{children}</div>;
}

export function ToolResultGrid({ children }: { children: React.ReactNode }) {
  return <div className={`${toolsBentoElevated} mt-8 grid gap-6 sm:grid-cols-2`}>{children}</div>;
}

export function ToolResultStat({
  label,
  value,
  accent = "ink",
}: {
  label: string;
  value: string;
  accent?: "ink" | "gold" | "copper";
}) {
  const valueClass =
    accent === "gold"
      ? "text-primary"
      : accent === "copper"
        ? "text-secondary"
        : "text-foreground";
  return (
    <div>
      <p className={toolsMetricLabel}>{label}</p>
      <p className={cn(toolsMetricValue, valueClass)}>{value}</p>
    </div>
  );
}

export function ToolDiagnostic({
  children,
  variant = "warning",
}: {
  children: React.ReactNode;
  variant?: "warning" | "info";
}) {
  const border =
    variant === "warning"
      ? "border-secondary/40 bg-secondary/10"
      : "border-primary/30 bg-muted/40";
  return (
    <p className={cn("mt-6 rounded-xl border px-4 py-3 text-sm leading-relaxed text-muted-foreground", border)}>
      {children}
    </p>
  );
}

export function formatEuro(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}