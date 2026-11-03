import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { HeroConstatLocale } from "./pickHeroConstat";

type BioExecutiveHeroQuickActionsProps = {
  locale: HeroConstatLocale;
  onMoodQuickLog: () => void;
  showMemoryQuerySoon?: boolean;
  className?: string;
};

export function BioExecutiveHeroQuickActions({
  locale,
  onMoodQuickLog,
  showMemoryQuerySoon = false,
  className,
}: BioExecutiveHeroQuickActionsProps) {
  const isFr = locale === "fr";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className="p-1.5 sm:p-2.5 rounded-2xl border flex flex-wrap items-center justify-center gap-2 sm:gap-3 border-[color:var(--bio-frame-border)] bg-[color:var(--bio-chip)] shadow-sm"
      >
        <NavLink
          to="/decisions"
          className="aegis-bio-exec-lab__cta-primary min-h-[44px] inline-flex items-center rounded-xl px-3 sm:px-4 text-[11px] sm:text-xs font-medium"
        >
          {isFr ? "+ Décision" : "+ Decision"}
        </NavLink>
        <NavLink
          to="/people"
          className="min-h-[44px] inline-flex items-center rounded-xl border border-[color:var(--bio-frame-border)] bg-[color:var(--bio-frame)]/80 px-3 sm:px-4 text-[11px] sm:text-xs font-medium hover:opacity-90"
        >
          {isFr ? "+ Relation" : "+ Relation"}
        </NavLink>
        <button
          type="button"
          onClick={onMoodQuickLog}
          className="min-h-[44px] inline-flex items-center rounded-xl border border-[color:var(--bio-frame-border)] bg-[color:var(--bio-frame)]/80 px-3 sm:px-4 text-[11px] sm:text-xs font-medium hover:opacity-90"
        >
          {isFr ? "+ Humeur" : "+ Mood"}
        </button>
      </div>
      {showMemoryQuerySoon ? (
        <button
          type="button"
          disabled
          className="w-full min-h-[44px] rounded-xl border border-dashed border-[color:var(--bio-frame-border)] bg-[color:var(--bio-chip)]/60 px-3 text-[11px] sm:text-xs font-medium opacity-60 cursor-not-allowed"
        >
          {isFr ? "Interroger votre mémoire — Bientôt" : "Query your memory — Coming soon"}
        </button>
      ) : null}
    </div>
  );
}
