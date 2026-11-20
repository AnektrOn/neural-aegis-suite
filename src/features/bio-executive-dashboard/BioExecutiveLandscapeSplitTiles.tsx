import { NavLink } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { BioExecutiveHabitRow, BioExecutiveViewModel } from "./types";

type Props = {
  viewModel: BioExecutiveViewModel;
  habits: BioExecutiveHabitRow[];
};

/** Tuiles compactes pour le cadre Hero Builder « Mob. paysage » (pas la grille desktop 7|5). */
export function BioExecutiveLandscapeSplitTiles({ viewModel, habits }: Props) {
  const { t, locale } = useLanguage();
  const isFr = locale === "fr";
  const d = viewModel.pendingDecision;
  const done = habits.filter((h) => h.done).length;
  const stress = viewModel.stressLatest;
  const stressLabel = stress != null && stress > 0 ? `${stress.toFixed(1)} / 10` : "—";

  return (
    <div className="aegis-bio-exec-lab__landscape-split-tiles" aria-label={t("bioExec.keyMetrics")}>
      <article className="aegis-bio-exec-lab__landscape-tile aegis-bio-exec-lab__landscape-tile--score">
        <span className="aegis-bio-exec-lab__landscape-tile-kicker">{t("bioExec.scoreAegis")}</span>
        <span className="aegis-bio-exec-lab__landscape-tile-metric">{viewModel.scoreDisplay}</span>
        {viewModel.scoreDeltaLabel ? (
          <span className="aegis-bio-exec-lab__landscape-tile-meta">{viewModel.scoreDeltaLabel} {t("bioExec.vsYesterday")}</span>
        ) : null}
      </article>

      <article className="aegis-bio-exec-lab__landscape-tile aegis-bio-exec-lab__landscape-tile--stress">
        <span className="aegis-bio-exec-lab__landscape-tile-kicker">{t("bioExec.stressIndex")}</span>
        <span className="aegis-bio-exec-lab__landscape-tile-metric">{stressLabel}</span>
        <span className="aegis-bio-exec-lab__landscape-tile-meta">
          {stress != null && stress <= 3 ? t("bioExec.calm") : stress != null && stress <= 6 ? t("bioExec.moderate") : t("bioExec.high")}
        </span>
      </article>

      <article className="aegis-bio-exec-lab__landscape-tile aegis-bio-exec-lab__landscape-tile--decision">
        <div className="flex items-start justify-between gap-2">
          <span className="aegis-bio-exec-lab__landscape-tile-kicker">{t("bioExec.pendingDecisionTitle")}</span>
          {viewModel.pendingDecisionCount > 0 ? (
            <span className="aegis-bio-exec-lab__landscape-tile-badge">{viewModel.pendingDecisionCount}</span>
          ) : null}
        </div>
        {d ? (
          <>
            <p className="aegis-bio-exec-lab__landscape-tile-title line-clamp-1">{d.name}</p>
            <p className="aegis-bio-exec-lab__landscape-tile-meta line-clamp-1">
              {isFr ? `Depuis ${d.ageDays} j` : `For ${d.ageDays}d`}
              {d.priority >= 2 ? (isFr ? " · prioritaire" : " · priority") : ""}
            </p>
          </>
        ) : (
          <p className="aegis-bio-exec-lab__landscape-tile-meta">{t("bioExec.nothingPending")}</p>
        )}
        <NavLink to="/decisions" className="aegis-bio-exec-lab__landscape-tile-link">
          {t("bioExec.viewAction")} <ArrowUpRight size={11} aria-hidden />
        </NavLink>
      </article>

      <article className="aegis-bio-exec-lab__landscape-tile aegis-bio-exec-lab__landscape-tile--habits">
        <span className="aegis-bio-exec-lab__landscape-tile-kicker">{t("bioExec.habitsTitle")}</span>
        <span className="aegis-bio-exec-lab__landscape-tile-metric">
          {done}/{habits.length}
        </span>
        <span className="aegis-bio-exec-lab__landscape-tile-meta">{viewModel.progressTodayPct}% {t("bioExec.todayShort")}</span>
      </article>

      <article className="aegis-bio-exec-lab__landscape-tile aegis-bio-exec-lab__landscape-tile--sleep">
        <span className="aegis-bio-exec-lab__landscape-tile-kicker">{t("bioExec.sleepKicker")}</span>
        <span className="aegis-bio-exec-lab__landscape-tile-metric">{viewModel.sleepHoursLabel}</span>
        <span className="aegis-bio-exec-lab__landscape-tile-meta">{viewModel.sleepStatusLabel}</span>
      </article>
    </div>
  );
}
