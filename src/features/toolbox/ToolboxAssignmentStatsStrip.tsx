import { ListChecks } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export interface ToolboxAssignmentStats {
  assignment_id: string;
  completed_count: number;
  abandoned_count: number;
  ignored_count: number;
}

export function ToolboxAssignmentStatsStrip({
  stats,
  className,
  emphasize,
}: {
  stats: ToolboxAssignmentStats | undefined;
  className?: string;
  emphasize?: "completed" | "abandoned" | "ignored" | null;
}) {
  const { t } = useLanguage();
  if (!stats) return null;

  const chips = [
    {
      key: "completed" as const,
      count: stats.completed_count,
      label: t("toolbox.statsTimesCompleted", { n: String(stats.completed_count) }),
      className: "text-primary border-primary/30 bg-primary/5",
    },
    {
      key: "abandoned" as const,
      count: stats.abandoned_count,
      label: t("toolbox.statsTimesAbandoned", { n: String(stats.abandoned_count) }),
      className: "text-destructive border-destructive/30 bg-destructive/5",
    },
    {
      key: "ignored" as const,
      count: stats.ignored_count,
      label: t("toolbox.statsTimesIgnored", { n: String(stats.ignored_count) }),
      className: "text-muted-foreground border-border bg-secondary/20",
    },
  ].filter((chip) => chip.count > 0);

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex min-w-0 max-w-full flex-wrap gap-1.5", className)}>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className={cn(
            "max-w-full truncate rounded-full border px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] sm:tracking-[0.16em]",
            chip.className,
            emphasize === chip.key && "ring-1 ring-current",
          )}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}

export function ToolboxHabitLinkButton({
  itemId,
  linked,
  busy,
  onToggle,
  compact = true,
}: {
  itemId: string;
  linked: boolean;
  busy: boolean;
  onToggle: (itemId: string) => void;
  compact?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onToggle(itemId)}
      className={cn(
        "flex min-h-[36px] shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.18em] transition-colors",
        !compact && "w-full sm:w-auto",
        linked
          ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
          : "border-border/40 bg-transparent text-muted-foreground hover:border-primary/30 hover:text-primary",
      )}
    >
      {busy ? (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <ListChecks size={11} />
      )}
      <span className={cn(compact && "hidden sm:inline")}>
        {linked ? t("toolbox.removeFromHabits") : t("toolbox.addToHabits")}
      </span>
    </button>
  );
}
