import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getBqcPointCatalogEntry } from "../dienChanBqcCatalog";
import { DienChanPointInsight } from "./DienChanPointInsight";

type DienChanExplorePanelProps = {
  visiblePointIds: number[];
  selectedPointId: number | null;
  hoveredPointId: number | null;
  onSelectPoint: (id: number) => void;
  onHoverPoint: (id: number | null) => void;
};

export function DienChanExplorePanel({
  visiblePointIds,
  selectedPointId,
  hoveredPointId,
  onSelectPoint,
  onHoverPoint,
}: DienChanExplorePanelProps) {
  const focusId = selectedPointId;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/40 px-4 py-4 lg:px-5">
        <p className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Mode exploration
        </p>
        <p className="mt-1 font-cormorant text-xl font-light text-foreground">
          Carte complète BQC
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Aucun protocole actif — parcourez et filtrez tous les points placés sur le visage 3D.
        </p>
      </div>

      <ScrollArea className="h-full min-h-0 flex-1">
        <div className="space-y-5 px-4 py-4 pb-6 lg:px-5 lg:py-5 lg:pb-8">
          <section aria-label="Points visibles">
            <p className="mb-2 font-display text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Points affichés
            </p>
            <div className="flex flex-wrap gap-1.5">
              {visiblePointIds.map((id) => {
                const active = selectedPointId === id;
                const hover = hoveredPointId === id;
                const entry = getBqcPointCatalogEntry(id);
                return (
                  <button
                    key={id}
                    type="button"
                    title={entry?.primaryEffects ?? `Point ${id}`}
                    onClick={() => onSelectPoint(id)}
                    onMouseEnter={() => onHoverPoint(id)}
                    onMouseLeave={() => onHoverPoint(null)}
                    onFocus={() => onHoverPoint(id)}
                    onBlur={() => onHoverPoint(null)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      active
                        ? "border-[hsl(0_75%_55%)] bg-[hsl(0_75%_50%/0.18)] text-[hsl(0_85%_58%)] shadow-[0_0_12px_-2px_hsl(0_80%_50%/0.5)]"
                        : hover
                          ? "border-[hsl(var(--aegis-warm))] bg-[hsl(var(--aegis-warm)/0.15)] text-[hsl(var(--aegis-warm))]"
                          : "border-border/60 bg-card/40 text-foreground hover:bg-muted/50",
                    )}
                  >
                    {id}
                  </button>
                );
              })}
            </div>
          </section>

          {focusId != null ? (
            <DienChanPointInsight
              pointId={focusId}
              variant="panel"
              className="border-[hsl(0_70%_50%/0.45)] shadow-[0_0_24px_-6px_hsl(0_80%_50%/0.35)]"
            />
          ) : (
            <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              Touchez un point sur le visage ou dans la liste pour ouvrir la fiche.
            </p>
          )}

          <p className="rounded-md border border-warning/25 bg-warning/5 px-3 py-2.5 text-[11px] leading-relaxed text-warning/90">
            Complémentaire à un avis médical. Point 19 déconseillé en grossesse.
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
