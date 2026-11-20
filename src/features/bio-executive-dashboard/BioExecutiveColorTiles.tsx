import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  CoherenceViz,
  HabitsViz,
  ScoreViz,
  SessionsViz,
  SleepViz,
  StressWaveViz,
} from "./bioExecutiveVisualizations";
import type { BioExecutiveHabitRow, BioExecutiveViewModel, BioNodeId } from "./types";
import { BioExecutivePreviewTileDots, type PreviewSlideChrome } from "./BioExecutivePreviewTileDots";
import { mergeCarouselSlideArticleProps } from "./bioExecutiveCarouselSlide";

type ColorTileProps = {
  viewModel: BioExecutiveViewModel;
  habits: BioExecutiveHabitRow[];
  calmMode: boolean;
  className?: string;
  slideProps?: { "data-bento-slide"?: number };
  previewSlideChrome?: PreviewSlideChrome;
  selectedBioNode?: BioNodeId;
};

function ChartMeta({ period, delta }: { period: string; delta?: string | null }) {
  return (
    <div className="aegis-bio-exec-lab__chart-meta">
      <span className="aegis-bio-exec-lab__chart-meta-period">{period}</span>
      {delta ? <span>{delta}</span> : null}
    </div>
  );
}

function tileClass(
  tone: string,
  extra?: string,
  vivid?: boolean,
) {
  return cn(
    "aegis-bio-exec-lab__color-tile relative flex flex-col justify-between overflow-hidden rounded-[24px] p-4",
    tone,
    vivid && "aegis-bio-exec-lab__color-tile--vivid",
    extra,
  );
}

export function BioExecutiveCoherenceTile({
  viewModel,
  calmMode,
  className,
  slideProps,
}: Omit<ColorTileProps, "habits">) {
  const { t, locale } = useLanguage();
  const isFr = locale === "fr";
  const delta = viewModel.levelDeltaLabel;
  const chartLabel = isFr
    ? `Niveau ${viewModel.levelNumber}, ${viewModel.levelSubtitle}`
    : `Level ${viewModel.levelNumber}, ${viewModel.levelSubtitle}`;

  return (
    <article
      {...mergeCarouselSlideArticleProps(slideProps)}
      className={tileClass(
        "aegis-bio-exec-lab__color-tile--niveau sm:p-5 min-h-[210px] lg:min-h-[280px] lg:row-span-2",
        className,
      )}
    >
      <div className="z-10 flex items-start justify-between aegis-bio-exec-lab__type-body opacity-90">
        <span className="font-medium tracking-wide">{t("bioExec.levelCoherence")}</span>
        <span className="aegis-bio-exec-lab__type-label-caps aegis-bio-exec-lab__tile-kicker">{t("bioExec.optimal")}</span>
      </div>
      <div className="z-10 mt-2">
        <div className="aegis-bio-exec-lab__type-metric">
          {isFr ? "Niv." : "Lv."} {viewModel.levelNumber}
        </div>
        <p className="mt-1 aegis-bio-exec-lab__type-body opacity-80">{viewModel.levelSubtitle}</p>
      </div>
      <div
        className="relative z-10 flex flex-1 items-center justify-center py-2"
        role="img"
        aria-label={chartLabel}
      >
        <CoherenceViz level={viewModel.levelNumber} sparkline={viewModel.scoreTrendSparkline} calmMode={calmMode} />
      </div>
      <ChartMeta period={isFr ? "7 j" : "7d"} delta={delta} />
      <div className="z-10 flex flex-wrap justify-between gap-x-2 gap-y-1 border-t border-current/20 pt-2 aegis-bio-exec-lab__type-label opacity-75">
        <span>{t("bioExec.stagnation")}</span>
        <span className="font-semibold opacity-100">{t("bioExec.momentum")}</span>
        <span>{t("bioExec.overload")}</span>
      </div>
    </article>
  );
}

export function BioExecutiveScoreColorTile({
  viewModel,
  calmMode,
  className,
  slideProps,
  previewSlideChrome,
}: Omit<ColorTileProps, "habits">) {
  const { locale } = useLanguage();
  const isFr = locale === "fr";
  const delta = viewModel.scoreDeltaLabel
    ? `${viewModel.scoreDeltaLabel.replace("▲ ", "+").replace("▼ ", "−")} ${isFr ? "vs hier" : "vs yesterday"}`
    : null;
  const chartLabel = `Score AEGIS ${viewModel.scoreDisplay}${delta ? `, ${delta}` : ""}`;

  return (
    <article
      {...mergeCarouselSlideArticleProps(slideProps)}
      className={tileClass(
        "aegis-bio-exec-lab__color-tile--amber min-h-[180px] aegis-bio-exec-lab__color-tile--vivid",
        className,
        true,
      )}
    >
      <div className="z-10 flex items-center justify-between aegis-bio-exec-lab__type-body opacity-90">
        <span className="font-medium">Score AEGIS</span>
        <span className="rounded-full border border-current/25 px-2 py-0.5 aegis-bio-exec-lab__type-label-caps opacity-90">
          {isFr ? "Niv." : "Lv."} {viewModel.levelNumber}
        </span>
      </div>
      <div className="z-10 flex items-baseline justify-between gap-2">
        <span className="aegis-bio-exec-lab__type-metric">{viewModel.scoreDisplay}</span>
      </div>
      <ChartMeta period={isFr ? "7 j" : "7d"} delta={delta} />
      <div className="relative z-10 h-20 w-full" role="img" aria-label={chartLabel}>
        <ScoreViz sparkline={viewModel.scoreTrendSparkline} calmMode={calmMode} />
      </div>
      {previewSlideChrome ? <BioExecutivePreviewTileDots {...previewSlideChrome} /> : null}
    </article>
  );
}

export function BioExecutiveStressColorTile({
  viewModel,
  calmMode,
  className,
  slideProps,
  previewSlideChrome,
}: Omit<ColorTileProps, "habits">) {
  const { t, locale } = useLanguage();
  const isFr = locale === "fr";
  const stress = viewModel.stressLatest ?? 0;
  const avg = viewModel.stressAvg7d ?? stress;
  const status = stress <= 3 ? t("bioExec.calm") : stress <= 6 ? t("bioExec.moderate") : t("bioExec.high");
  const stateVar = stress <= 3 ? "var(--state-good)" : stress <= 6 ? "var(--state-warn)" : "var(--state-bad)";
  const delta =
    viewModel.stressLatest != null && viewModel.stressAvg7d != null
      ? `${viewModel.stressLatest - viewModel.stressAvg7d >= 0 ? "+" : ""}${(viewModel.stressLatest - viewModel.stressAvg7d).toFixed(1)} ${isFr ? "vs moy. 7 j" : "vs 7d avg"}`
      : null;
  const chartLabel = isFr
    ? `Stress ${stress > 0 ? stress.toFixed(1) : "—"} sur 10, ${status.toLowerCase()}`
    : `Stress ${stress > 0 ? stress.toFixed(1) : "—"} out of 10, ${status.toLowerCase()}`;

  return (
    <article
      {...mergeCarouselSlideArticleProps(slideProps)}
      className={tileClass("aegis-bio-exec-lab__color-tile--coral min-h-[180px]", className)}
      style={{ ["--tile-accent" as string]: stateVar }}
    >
      <div className="z-10 flex items-center justify-between aegis-bio-exec-lab__type-body opacity-90">
        <span className="font-medium">{isFr ? "Indice stress" : "Stress index"}</span>
        <span className="aegis-bio-exec-lab__type-label font-medium" style={{ color: stateVar }}>
          {status}
        </span>
      </div>
      <div className="z-10 flex items-baseline gap-1">
        <span className="aegis-bio-exec-lab__type-metric">{stress > 0 ? stress.toFixed(1) : "—"}</span>
        <span className="aegis-bio-exec-lab__type-body opacity-75">/10</span>
      </div>
      <ChartMeta period={isFr ? "7 j" : "7d"} delta={delta} />
      <div className="relative z-10 h-20 w-full" role="img" aria-label={chartLabel}>
        <StressWaveViz stress={stress} avgStress={avg} calmMode={calmMode} />
      </div>
      {previewSlideChrome ? <BioExecutivePreviewTileDots {...previewSlideChrome} /> : null}
    </article>
  );
}

export function BioExecutiveSessionsColorTile({
  viewModel,
  className,
  slideProps,
}: Omit<ColorTileProps, "habits" | "calmMode">) {
  const { locale } = useLanguage();
  const isFr = locale === "fr";
  const chartLabel = isFr
    ? `${viewModel.sessionsCount} sessions, régularité ${viewModel.regularityPct} %`
    : `${viewModel.sessionsCount} sessions, regularity ${viewModel.regularityPct}%`;

  return (
    <article
      {...mergeCarouselSlideArticleProps(slideProps)}
      className={tileClass("aegis-bio-exec-lab__color-tile--warm min-h-[148px]", className)}
    >
      <div className="z-10 aegis-bio-exec-lab__type-body opacity-90">
        <span className="aegis-bio-exec-lab__type-metric">{viewModel.sessionsCount}</span>
        <span className="ml-1 aegis-bio-exec-lab__type-label">sessions</span>
      </div>
      <ChartMeta period={isFr ? "7 j" : "7d"} delta={isFr ? `Régularité ${viewModel.regularityPct}%` : `Regularity ${viewModel.regularityPct}%`} />
      <div className="relative z-10 my-1 flex flex-1 items-center justify-center" role="img" aria-label={chartLabel}>
        <SessionsViz count={viewModel.sessionsCount} regularityPct={viewModel.regularityPct} />
      </div>
    </article>
  );
}

export function BioExecutiveHabitsColorTile({
  viewModel,
  habits,
  className,
  slideProps,
  previewSlideChrome,
}: ColorTileProps) {
  const { t, locale } = useLanguage();
  const isFr = locale === "fr";
  const done = habits.filter((h) => h.done).length;
  const chartLabel = isFr
    ? `Habitudes ${done} sur ${habits.length}, jour ${viewModel.progressTodayPct} %`
    : `Habits ${done} of ${habits.length}, day ${viewModel.progressTodayPct}%`;

  return (
    <article
      {...mergeCarouselSlideArticleProps(slideProps)}
      className={tileClass("aegis-bio-exec-lab__color-tile--habits min-h-[148px]", className)}
    >
      <div className="z-10 flex items-center justify-between aegis-bio-exec-lab__type-body opacity-90">
        <span className="font-medium">{t("bioExec.habitsTitle")}</span>
        <span className="rounded-full bg-[color-mix(in_srgb,currentColor_12%,transparent)] px-2 py-0.5 font-mono aegis-bio-exec-lab__type-label">
          {done}/{habits.length}
        </span>
      </div>
      <ChartMeta period={isFr ? "Jour" : "Day"} delta={`${viewModel.progressTodayPct}% · ${isFr ? "Régul." : "Regul."} ${viewModel.regularityPct}%`} />
      <div className="relative z-10 flex flex-1 items-center justify-center py-1" role="img" aria-label={chartLabel}>
        <HabitsViz habits={habits} progressPct={viewModel.progressTodayPct} />
      </div>
      {previewSlideChrome ? <BioExecutivePreviewTileDots {...previewSlideChrome} /> : null}
    </article>
  );
}

export function BioExecutiveSleepColorTile({
  viewModel,
  className,
  slideProps,
  previewSlideChrome,
}: Omit<ColorTileProps, "habits" | "calmMode">) {
  const { t, locale } = useLanguage();
  const isFr = locale === "fr";
  const hours = viewModel.sleepHours ?? 0;
  const goal = viewModel.sleepGoalHours;
  const avg = viewModel.sleepAvg7d ?? hours;
  const delta =
    viewModel.sleepHours != null && viewModel.sleepAvg7d != null
      ? `${viewModel.sleepHours - viewModel.sleepAvg7d >= 0 ? "+" : ""}${(viewModel.sleepHours - viewModel.sleepAvg7d).toFixed(1)} h ${isFr ? "vs moy. 7 j" : "vs 7d avg"}`
      : viewModel.sleepStatusLabel;
  const chartLabel = `${isFr ? "Sommeil" : "Sleep"} ${viewModel.sleepHoursLabel}, ${viewModel.sleepStatusLabel}`;

  return (
    <article
      {...mergeCarouselSlideArticleProps(slideProps)}
      className={tileClass("aegis-bio-exec-lab__color-tile--blue min-h-[148px]", className)}
    >
      <div className="z-10 aegis-bio-exec-lab__type-label-caps opacity-85">{t("bioExec.sleepAndRecovery")}</div>
      <ChartMeta period={isFr ? "7 j" : "7d"} delta={delta} />
      <div className="relative z-10 mt-1 flex items-center gap-3" role="img" aria-label={chartLabel}>
        <div className="shrink-0">
          <div className="aegis-bio-exec-lab__type-metric">{viewModel.sleepHoursLabel}</div>
          <div className="aegis-bio-exec-lab__type-body opacity-75">{viewModel.sleepTargetLabel}</div>
        </div>
        <div className="ml-auto h-16 w-[7.5rem] shrink-0">
          {hours > 0 ? <SleepViz hours={hours} goal={goal} avg7d={avg} /> : null}
        </div>
      </div>
      {previewSlideChrome ? <BioExecutivePreviewTileDots {...previewSlideChrome} /> : null}
    </article>
  );
}
