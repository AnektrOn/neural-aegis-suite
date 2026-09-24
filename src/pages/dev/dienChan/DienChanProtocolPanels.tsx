import { cn } from "@/lib/utils";
import type { DienChanZoneId } from "../dienChanFaceZones";
import { DienChanPointInsight } from "./DienChanPointInsight";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export type DienChanProtocol = {
  id: string;
  category: string;
  name: string;
  description: string;
  points: number[];
  zones: DienChanZoneId[];
  instruction: string;
};

type ProtocolDetailProps = {
  protocol: DienChanProtocol;
  pointPlaybackSequence: number[];
  spotlightPointId: number | null;
  hoveredPoint: number | null;
  playbackIndex: number;
  onHoverPoint: (id: number | null) => void;
  onSelectPointStep: (stepIndex: number) => void;
};

export function DienChanProtocolDetail({
  protocol,
  pointPlaybackSequence,
  spotlightPointId,
  hoveredPoint,
  playbackIndex,
  onHoverPoint,
  onSelectPointStep,
}: ProtocolDetailProps) {
  const focusPointId = spotlightPointId ?? hoveredPoint;
  const stepCount = pointPlaybackSequence.length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/40 px-4 py-4 lg:px-5">
        <p className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {protocol.category}
        </p>
        <p className="mt-1 whitespace-normal font-cormorant text-xl font-light leading-snug text-foreground">
          {protocol.name}
        </p>
      </div>

      <ScrollArea className="h-full min-h-0 flex-1">
        <div className="space-y-5 px-4 py-4 pb-6 lg:px-5 lg:py-5 lg:pb-8">
          {stepCount > 0 && (
            <section aria-label="Séquence BQC">
              <p className="mb-2 font-display text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Séquence · {stepCount} étape{stepCount > 1 ? "s" : ""}
              </p>
              <ol className="flex flex-col gap-1.5">
                {pointPlaybackSequence.map((pointId, i) => {
                  const isCurrent = i === playbackIndex % Math.max(stepCount, 1);
                  const isHover = hoveredPoint === pointId && !isCurrent;
                  return (
                    <li key={`${pointId}-${i}`}>
                      <button
                        type="button"
                        onClick={() => onSelectPointStep(i)}
                        onMouseEnter={() => onHoverPoint(pointId)}
                        onMouseLeave={() => onHoverPoint(null)}
                        onFocus={() => onHoverPoint(pointId)}
                        onBlur={() => onHoverPoint(null)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                          isCurrent
                            ? "border-[hsl(0_70%_50%/0.55)] bg-[hsl(0_75%_50%/0.12)] shadow-[0_0_16px_-4px_hsl(0_80%_50%/0.35)]"
                            : isHover
                              ? "border-border bg-muted/50"
                              : "border-border/50 bg-card/30 hover:bg-muted/40",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            isCurrent
                              ? "bg-[hsl(0_78%_52%)] text-white"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="font-semibold text-foreground">Point {pointId}</span>
                          {isCurrent && (
                            <span className="ml-2 text-xs text-[hsl(var(--aegis-warm))]">
                              en cours
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          <Tabs defaultValue="point" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/40">
              <TabsTrigger value="point" className="text-xs sm:text-sm">
                Point
              </TabsTrigger>
              <TabsTrigger value="protocol" className="text-xs sm:text-sm">
                Protocole
              </TabsTrigger>
            </TabsList>
            <TabsContent value="point" className="mt-4 space-y-3">
              {focusPointId != null ? (
                <DienChanPointInsight
                  pointId={focusPointId}
                  protocolId={protocol.id}
                  variant="panel"
                  className="border-[hsl(0_70%_50%/0.45)] shadow-[0_0_24px_-6px_hsl(0_80%_50%/0.35)]"
                />
              ) : (
                <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  Sélectionnez une étape ou touchez un point sur le visage 3D pour afficher la
                  fiche.
                </p>
              )}
            </TabsContent>
            <TabsContent value="protocol" className="mt-4 space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Indication
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  {protocol.description}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Gestuelle
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  {protocol.instruction}
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <p className="rounded-md border border-warning/25 bg-warning/5 px-3 py-2.5 text-[11px] leading-relaxed text-warning/90">
            Complémentaire à un avis médical. Point 19 déconseillé en grossesse.
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
