import { ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BioExecutiveViewModel } from "./types";

type TileProps = {
  viewModel: BioExecutiveViewModel;
  levelChipLabel: string | null;
  levelTrendPoints: string;
  scoreChartPoints: string;
  calmMode: boolean;
  className?: string;
  slideProps?: { "data-bento-slide"?: number };
};

export function BioExecutiveLevelTile({
  viewModel,
  levelChipLabel,
  levelTrendPoints,
  calmMode,
  className,
  slideProps,
}: TileProps) {
  return (
    <div
      {...slideProps}
      className={cn(
        "aegis-bio-exec-lab__bento aegis-bio-exec-lab__bento-level aegis-bio-exec-lab__bento-level--pillar rounded-[24px] sm:rounded-[26px] p-4 sm:p-6 relative overflow-hidden flex flex-col justify-between min-h-[210px] shadow-sm transition-all duration-500",
        "lg:min-h-0 lg:h-full lg:rounded-[28px]",
        className,
      )}
    >
      <div className="flex items-center justify-between text-xs aegis-bio-exec-lab__bento-muted z-10">
        <span className="font-medium tracking-wide">Niveau & Constance</span>
        <span className="text-[11px] opacity-80">7 derniers jours →</span>
      </div>

      <div className="flex sm:flex-col items-center sm:items-stretch justify-between my-auto sm:my-0 py-1 sm:py-0 z-10 gap-2 lg:flex-1">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between sm:mt-2 lg:flex-col lg:gap-2">
          <div>
            <div className="text-4xl sm:text-6xl lg:text-5xl xl:text-6xl font-light tracking-tight">
              Niv. {viewModel.levelNumber}
            </div>
            <div className="text-xs aegis-bio-exec-lab__bento-muted mt-0.5 sm:mt-1">{viewModel.levelSubtitle}</div>
            {viewModel.scoreDeltaLabel ? (
              <p className="hidden lg:block text-sm font-medium mt-2 opacity-90">{viewModel.scoreDeltaLabel}</p>
            ) : null}
          </div>
          <div className="mt-2 sm:mt-0 sm:text-right lg:text-left">
            {levelChipLabel ? (
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs aegis-bio-exec-lab__bento-chip backdrop-blur-md px-2.5 py-1 rounded-full">
                <Sparkles size={11} /> {levelChipLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="relative sm:my-auto sm:py-4 lg:py-6 flex items-center justify-center shrink-0 flex-1">
          <svg viewBox="0 0 200 220" className="w-28 h-28 sm:w-44 sm:h-48 lg:w-full lg:max-w-[220px] lg:h-auto overflow-visible opacity-95" aria-hidden>
            {Array.from({ length: 10 }).map((_, idx) => (
              <ellipse
                key={idx}
                cx="100"
                cy={110}
                rx={48}
                ry={14 + idx * 3.5}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.35}
                strokeWidth="0.9"
              />
            ))}
            <circle cx="100" cy="110" r="9" fill="var(--bio-warm)" fillOpacity={0.45} />
            <circle cx="100" cy="110" r="3.5" fill="var(--bio-warm)" />
          </svg>
        </div>
      </div>

      <div className="z-10 pt-2 border-t aegis-bio-exec-lab__bento-divider flex items-center justify-between text-[11px] aegis-bio-exec-lab__bento-muted">
        <span>Stagnation</span>
        <span className="font-semibold">Élan Optimal</span>
        <span>Surcharge</span>
      </div>
    </div>
  );
}

export function BioExecutiveScoreTile({ viewModel, scoreChartPoints, className, slideProps }: TileProps) {
  return (
    <div
      {...slideProps}
      className={cn(
        "aegis-bio-exec-lab__bento aegis-bio-exec-lab__bento-score aegis-bio-exec-lab__bento-score--vivid rounded-[24px] sm:rounded-[26px] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between min-h-[210px] sm:min-h-[200px] shadow-sm transition-all duration-500 lg:rounded-[24px] lg:min-h-[180px]",
        className,
      )}
    >
      <div className="flex items-center justify-between text-xs aegis-bio-exec-lab__bento-subtle z-10">
        <span className="font-medium">Score & Vélocité</span>
        <ArrowUpRight size={14} className="opacity-80" />
      </div>

      <div className="flex items-baseline justify-between my-1 z-10">
        <div className="text-4xl sm:text-5xl font-light tracking-tight">{viewModel.scoreDisplay}</div>
        {viewModel.scoreDeltaLabel ? (
          <span className="text-xs font-medium bg-primary-muted text-foreground px-2.5 py-0.5 rounded-full lg:bg-white/20 lg:text-inherit">
            {viewModel.scoreDeltaLabel}
          </span>
        ) : null}
      </div>

      <div className="relative h-20 w-full mt-2 lg:h-16">
        <svg viewBox="0 0 260 70" className="w-full h-full overflow-visible opacity-95" preserveAspectRatio="none" aria-hidden>
          {scoreChartPoints ? (
            <>
              <polyline points={scoreChartPoints} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth="1" />
              <polyline points={scoreChartPoints} fill="none" stroke="currentColor" strokeWidth="2" className="bio-chart-emphasis" />
            </>
          ) : null}
        </svg>
      </div>
    </div>
  );
}

export function BioExecutiveDecisionTile({ viewModel, className, slideProps }: TileProps) {
  const loadNum = Number.parseFloat(viewModel.decisionLoadDisplay) || 0;
  const selectedIdx = Math.min(8, Math.max(0, Math.round(loadNum)));

  return (
    <div
      {...slideProps}
      className={cn(
        "aegis-bio-exec-lab__bento aegis-bio-exec-lab__bento-decision aegis-bio-exec-lab__bento-decision--vivid rounded-[24px] sm:rounded-[26px] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between min-h-[210px] shadow-sm transition-all duration-500 lg:rounded-[24px] lg:min-h-[180px]",
        className,
      )}
    >
      <div className="flex items-center justify-between text-xs aegis-bio-exec-lab__bento-subtle z-10">
        <span className="font-medium">Indice de Charge Décisionnelle</span>
        <ArrowUpRight size={14} className="opacity-80" />
      </div>

      <div className="flex items-baseline justify-between mt-1 z-10">
        <div className="text-4xl font-light tracking-tight">{viewModel.decisionLoadDisplay}</div>
        <span className="text-[11px] aegis-bio-exec-lab__bento-subtle max-w-[48%] text-right leading-snug">
          {viewModel.decisionLoadSubtitle}
        </span>
      </div>

      <div className="relative h-20 sm:h-24 lg:h-20 w-full flex items-end justify-center pt-2">
        <svg viewBox="0 0 240 90" className="w-full h-full overflow-visible opacity-90" aria-hidden>
          {[35, 50, 65, 80, 95].map((radius, idx) => (
            <path
              key={idx}
              d={`M ${120 - radius} 82 A ${radius} ${radius} 0 0 1 ${120 + radius} 82`}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.28}
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 9 }).map((_, idx) => {
            const x = 32 + idx * 22;
            const isSelected = idx === selectedIdx;
            return (
              <circle
                key={idx}
                cx={x}
                cy="82"
                r={isSelected ? "4.5" : "2"}
                fill={isSelected ? "var(--bio-warm)" : "hsl(var(--muted-foreground) / 0.55)"}
              />
            );
          })}
        </svg>
      </div>

      <div className="z-10 flex items-center justify-between text-[11px] aegis-bio-exec-lab__bento-subtle pt-1">
        <span className="font-semibold">Optimal</span>
        <div className="space-x-3 opacity-75">
          <span>Léger</span>
          <span>Modéré</span>
          <span>Élevé</span>
        </div>
      </div>
    </div>
  );
}
