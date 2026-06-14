import { Link } from "react-router-dom";
import { GitBranch, Users, Wrench, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PersonaTrackingStats } from "../services/personaTrackingStats";

interface PersonaTrackingStripProps {
  stats: PersonaTrackingStats;
}

function TrackingPill({
  to,
  state,
  value,
  label,
  icon,
  highlight,
}: {
  to: string;
  state?: { openToolboxId: string };
  value: number;
  label: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      state={state}
      className={cn(
        "flex flex-1 min-w-[72px] flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-3 min-h-[64px]",
        "transition-colors hover:border-primary/35 hover:bg-card/60",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        highlight
          ? "border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.08)]"
          : "border-border/35 bg-background/40",
      )}
    >
      <span className="text-muted-foreground mb-0.5">{icon}</span>
      <span
        className={cn(
          "font-display text-xl tabular-nums leading-none",
          highlight ? "text-[hsl(var(--warning))]" : "text-foreground",
        )}
      >
        {value}
      </span>
      <span className="text-[8px] uppercase tracking-wider text-muted-foreground text-center leading-tight font-display px-0.5">
        {label}
      </span>
    </Link>
  );
}

export function PersonaTrackingStrip({ stats }: PersonaTrackingStripProps) {
  const { t } = useLanguage();

  return (
    <section className="glass-card rounded-2xl p-3">
      <p className="mb-2.5 px-1 font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {t("persona.glimpse.tracking")}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <TrackingPill
          to="/decisions"
          value={stats.pendingDecisions}
          label={t("persona.glimpse.trackDecisions")}
          icon={<GitBranch size={14} strokeWidth={1.5} aria-hidden />}
          highlight={stats.pendingDecisions > 0}
        />
        <TrackingPill
          to="/people"
          value={stats.peopleCount}
          label={t("persona.glimpse.trackPeople")}
          icon={<Users size={14} strokeWidth={1.5} aria-hidden />}
        />
        <TrackingPill
          to="/toolbox"
          state={stats.toolboxFocusId ? { openToolboxId: stats.toolboxFocusId } : undefined}
          value={stats.toolboxTodo}
          label={t("persona.glimpse.trackToolbox")}
          icon={<Wrench size={14} strokeWidth={1.5} aria-hidden />}
          highlight={stats.toolboxTodo > 0}
        />
        <TrackingPill
          to="/pulse"
          value={stats.pulseCards}
          label={t("persona.glimpse.trackPulse")}
          icon={<Zap size={14} strokeWidth={1.5} aria-hidden />}
        />
      </div>
    </section>
  );
}
