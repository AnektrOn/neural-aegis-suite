/**
 * Houses72PersonaCTA — entry-point card for the Persona page.
 *
 * Shows the user's progress through "Le Casting des 12 Maisons" and provides
 * a single CTA button that links to /assessment/maisons. Label adapts based
 * on whether the user has started, is in progress, or has completed all houses.
 */

import { Link } from "react-router-dom";
import { Map, CheckCircle2, Loader2 } from "lucide-react";
import { useHouses72Status } from "../hooks/useHouses72Status";

interface Props {
  userId: string | undefined;
  /** Use "compact" in the desktop aside column, default in mobile single column. */
  variant?: "default" | "compact";
}

export function Houses72PersonaCTA({ userId, variant = "default" }: Props) {
  const { completedHouses, totalHouses, hasAnyProgress, isFullyComplete, loading } =
    useHouses72Status(userId);

  const label = isFullyComplete
    ? "Revoir le Casting"
    : hasAnyProgress
      ? `Reprendre — Maison ${completedHouses + 1}`
      : "Commencer le Casting";

  const sublabel = isFullyComplete
    ? `${totalHouses}/${totalHouses} maisons complètes`
    : hasAnyProgress
      ? `${completedHouses}/${totalHouses} maisons complètes`
      : "72 questions · 12 sphères de vie";

  const progressPct = totalHouses > 0 ? (completedHouses / totalHouses) * 100 : 0;

  if (variant === "compact") {
    return (
      <Link
        to="/assessment/maisons"
        className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-3 py-2.5 transition-all hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : isFullyComplete ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : (
            <Map className="h-4 w-4 text-primary" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground leading-tight truncate">
            Les 12 Maisons
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            {loading ? "Chargement…" : sublabel}
          </p>
        </div>

        {!loading && hasAnyProgress && !isFullyComplete && (
          <div className="h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link
      to="/assessment/maisons"
      className="block rounded-2xl border border-border/50 bg-card/60 p-4 transition-all hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : isFullyComplete ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Map className="h-5 w-5 text-primary" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Appendice · Phase 2
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground leading-snug">
            Le Casting des 12 Maisons
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {loading ? "Chargement…" : sublabel}
          </p>

          {!loading && hasAnyProgress && !isFullyComplete && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <span className="text-xs font-medium text-primary">
          {loading ? "" : label} →
        </span>
      </div>
    </Link>
  );
}
