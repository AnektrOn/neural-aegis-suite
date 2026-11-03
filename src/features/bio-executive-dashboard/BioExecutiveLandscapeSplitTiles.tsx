import { NavLink } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { BioExecutiveHabitRow, BioExecutiveViewModel } from "./types";

type Props = {
  viewModel: BioExecutiveViewModel;
  habits: BioExecutiveHabitRow[];
};

/** Tuiles compactes pour le cadre Hero Builder « Mob. paysage » (pas la grille desktop 7|5). */
export function BioExecutiveLandscapeSplitTiles({ viewModel, habits }: Props) {
  const d = viewModel.pendingDecision;
  const done = habits.filter((h) => h.done).length;
  const stress = viewModel.stressLatest;
  const stressLabel = stress != null && stress > 0 ? `${stress.toFixed(1)} / 10` : "—";

  return (
    <div className="aegis-bio-exec-lab__landscape-split-tiles" aria-label="Métriques clés">
      <article className="aegis-bio-exec-lab__landscape-tile aegis-bio-exec-lab__landscape-tile--score">
        <span className="aegis-bio-exec-lab__landscape-tile-kicker">Score AEGIS</span>
        <span className="aegis-bio-exec-lab__landscape-tile-metric">{viewModel.scoreDisplay}</span>
        {viewModel.scoreDeltaLabel ? (
          <span className="aegis-bio-exec-lab__landscape-tile-meta">{viewModel.scoreDeltaLabel} vs hier</span>
        ) : null}
      </article>

      <article className="aegis-bio-exec-lab__landscape-tile aegis-bio-exec-lab__landscape-tile--stress">
        <span className="aegis-bio-exec-lab__landscape-tile-kicker">Indice stress</span>
        <span className="aegis-bio-exec-lab__landscape-tile-metric">{stressLabel}</span>
        <span className="aegis-bio-exec-lab__landscape-tile-meta">
          {stress != null && stress <= 3 ? "Calme" : stress != null && stress <= 6 ? "Modéré" : "Élevé"}
        </span>
      </article>

      <article className="aegis-bio-exec-lab__landscape-tile aegis-bio-exec-lab__landscape-tile--decision">
        <div className="flex items-start justify-between gap-2">
          <span className="aegis-bio-exec-lab__landscape-tile-kicker">Décision</span>
          {viewModel.pendingDecisionCount > 0 ? (
            <span className="aegis-bio-exec-lab__landscape-tile-badge">{viewModel.pendingDecisionCount}</span>
          ) : null}
        </div>
        {d ? (
          <>
            <p className="aegis-bio-exec-lab__landscape-tile-title line-clamp-1">{d.name}</p>
            <p className="aegis-bio-exec-lab__landscape-tile-meta line-clamp-1">
              Depuis {d.ageDays} j{d.priority >= 2 ? " · prioritaire" : ""}
            </p>
          </>
        ) : (
          <p className="aegis-bio-exec-lab__landscape-tile-meta">Rien en attente</p>
        )}
        <NavLink to="/decisions" className="aegis-bio-exec-lab__landscape-tile-link">
          Voir <ArrowUpRight size={11} aria-hidden />
        </NavLink>
      </article>

      <article className="aegis-bio-exec-lab__landscape-tile aegis-bio-exec-lab__landscape-tile--habits">
        <span className="aegis-bio-exec-lab__landscape-tile-kicker">Habitudes</span>
        <span className="aegis-bio-exec-lab__landscape-tile-metric">
          {done}/{habits.length}
        </span>
        <span className="aegis-bio-exec-lab__landscape-tile-meta">{viewModel.progressTodayPct}% auj.</span>
      </article>

      <article className="aegis-bio-exec-lab__landscape-tile aegis-bio-exec-lab__landscape-tile--sleep">
        <span className="aegis-bio-exec-lab__landscape-tile-kicker">Sommeil</span>
        <span className="aegis-bio-exec-lab__landscape-tile-metric">{viewModel.sleepHoursLabel}</span>
        <span className="aegis-bio-exec-lab__landscape-tile-meta">{viewModel.sleepStatusLabel}</span>
      </article>
    </div>
  );
}
