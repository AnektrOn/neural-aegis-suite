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
        "aegis-dock-tile flex flex-1 min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 min-h-[68px]",
        "transition-all hover:border-[#c9a24b]/40 hover:-translate-y-0.5",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        highlight
          ? "border-amber-400/40 bg-amber-400/10"
          : "hover:border-[#c9a24b]/30",
      )}
    >
      <span className={cn("mb-0.5", highlight ? "text-amber-400" : "text-[#c9a24b]")}>{icon}</span>
      <span
        className={cn(
          "font-cormorant text-2xl font-light tabular-nums leading-none",
          highlight ? "text-amber-400" : "text-foreground",
        )}
      >
        {value}
      </span>
      <span className="font-cinzel text-[8.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground text-center leading-tight px-0.5">
        {label}
      </span>
    </Link>
  );
}

export function PersonaTrackingStrip({ stats }: PersonaTrackingStripProps) {
  const { t } = useLanguage();

  return (
    <section className="aegis-dock-tile rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
      <p className="mb-2.5 px-1 font-cinzel text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9e7828] dark:text-[#c9a24b]">
        {t("persona.glimpse.tracking")}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
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
