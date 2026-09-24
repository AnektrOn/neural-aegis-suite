import { AlertTriangle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildBqcPointInsight,
  formatStimulationSide,
} from "../dienChanBqcCatalog";

function formatZoneLabel(zone: string) {
  return zone.replace(/_/g, " ");
}

type DienChanPointInsightProps = {
  pointId: number;
  protocolId?: string;
  variant?: "panel" | "compact";
  className?: string;
};

export function DienChanPointInsight({
  pointId,
  protocolId,
  variant = "panel",
  className,
}: DienChanPointInsightProps) {
  const insight = buildBqcPointInsight(pointId, protocolId);
  if (!insight) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Point {pointId} — fiche détaillée non disponible dans le catalogue.
      </p>
    );
  }

  const { entry, technique, reflexZones } = insight;
  const compact = variant === "compact";

  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-card/50",
        compact ? "p-3" : "p-4",
        "break-words [overflow-wrap:anywhere]",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-display text-lg font-semibold text-[hsl(var(--aegis-warm))]">
          Point {pointId}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Grille {entry.bookGrid} · p. {entry.page}
        </span>
      </div>

      <p
        className={cn(
          "mt-2 whitespace-normal leading-relaxed text-foreground/90",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {entry.primaryEffects}
      </p>

      {!compact && (
        <>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Repère anatomique
              </dt>
              <dd className="whitespace-normal leading-relaxed text-muted-foreground">
                {entry.anatomicalLogic}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Système / organe
              </dt>
              <dd className="text-muted-foreground">{entry.systemOrgan}</dd>
            </div>
            {entry.side && (
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Latéralité
                </dt>
                <dd className="text-muted-foreground">{formatStimulationSide(entry.side)}</dd>
              </div>
            )}
          </dl>

          {technique && (
            <p className="mt-3 whitespace-normal rounded-lg border border-border/50 bg-background/50 p-3 text-sm leading-relaxed text-foreground">
              <span className="font-medium">Gestuelle (ce protocole) : </span>
              {technique}
            </p>
          )}

          {reflexZones.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 flex items-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <MapPin className="mr-1 h-3 w-3" aria-hidden />
                Repères texte (pas de surlignage 3D)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {reflexZones.map((z) => (
                  <span
                    key={z}
                    className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-xs capitalize text-muted-foreground"
                  >
                    {formatZoneLabel(z)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {entry.contraindicatedPregnancy && (
        <p
          className={cn(
            "mt-3 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 text-warning",
            compact ? "p-2 text-[11px]" : "p-2.5 text-xs",
          )}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            Contre-indiqué chez la femme enceinte (risque de contractions utérines).
          </span>
        </p>
      )}
    </div>
  );
}
