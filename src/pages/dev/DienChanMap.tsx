import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  PanelRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  DienChanWireframeFace,
  type DienChanWireframeFaceHandle,
} from "./DienChanWireframeFace";
import {
  buildPointPlaybackSequence,
  POINT_STEP_MS,
} from "./dienChanPointPlayback";
import { pointsCoordinates } from "./dienChanBqcCoordinates";
import { DienChanDiagramPreview } from "./DienChanDiagramPreview";
import { DienChanStageToolbar } from "./dienChan/DienChanStageToolbar";
import { DienChanProtocolDetail, type DienChanProtocol } from "./dienChan/DienChanProtocolPanels";
import {
  DienChanProtocolSelect,
  DIEN_CHAN_EXPLORE_VALUE,
} from "./dienChan/DienChanProtocolSelect";
import { DienChanPointMappingBar } from "./dienChan/DienChanPointMappingBar";
import { DienChanExplorePanel } from "./dienChan/DienChanExplorePanel";
import { summarizePointForStage } from "./dienChanBqcCatalog";
import {
  DEFAULT_MAPPING_FILTER,
  filterMappedPoints,
  getAllMappedPointIds,
  listOrgansForPoints,
  type MappingFilterState,
} from "./dienChanPointMapping";
import type { DienChanZoneId } from "./dienChanFaceZones";

const DIAGRAM_PREF_KEY = "dien-chan-show-diagram:v1";

const protocols: DienChanProtocol[] = [
  {
    id: "relax",
    category: "Protocoles de Base",
    name: "Relaxation du Système Nerveux",
    description:
      'Protocole essentiel à effectuer avant de traiter une zone spécifique. Vise à éliminer les "barrages" pour rétablir la circulation énergétique.',
    points: [124, 34, 26, 0],
    zones: [],
    instruction:
      "Stimulez chaque point le même nombre de fois (10, 20 ou 50 passages). Ne tracez pas de lignes continues, mais travaillez la zone de chaque point de manière bilatérale.",
  },
  {
    id: "tonify",
    category: "Protocoles de Base",
    name: "Tonification du Système Nerveux",
    description:
      "Vise à redistribuer délibérément l'énergie, en l'alignant correctement avec chaque organe et fonction.",
    points: [127, 19, 103, 126, 0],
    zones: [],
    instruction: "Peut être tapoté, travaillé verticalement ou stimulé avec un mouvement rotatoire.",
  },
  {
    id: "base_points",
    category: "Protocoles de Base",
    name: "Points de Base Obligatoires",
    description:
      "Correspondent à des fonctions spécifiques et essentielles pour un flux énergétique correct (nerveux, sanguin, lymphatique, respiratoire et méridiens).",
    points: [61, 39, 37, 50, 38, 17],
    zones: [],
    instruction:
      "Effectuez ce protocole après la Relaxation et la Tonification. Le point 39 et 37 sont à gauche, le 50 à droite.",
  },
  {
    id: "headache",
    category: "Massages Simplifiés",
    name: "Maux de tête (Général)",
    description:
      "En phase aiguë : amélioration de la douleur. En phase préventive : agit sur la prédisposition à accumuler le stress et les toxines.",
    points: [103, 106, 124, 34, 26, 0],
    zones: ["forehead_center", "forehead_hairline"],
    instruction:
      "Massez du centre des sourcils au centre du front, et du centre des sourcils à la racine des cheveux.",
  },
  {
    id: "nervousness",
    category: "Massages Simplifiés",
    name: "Nervosité & Troubles du sommeil",
    description:
      "Agit sur la difficulté à s'endormir, les réveils fréquents, l'agitation, les états d'anxiété et le besoin de fumer.",
    points: [124, 34, 26, 0],
    zones: ["forehead", "eyebrows", "ears_front"],
    instruction:
      "Ligne horizontale centrale du front, toute la longueur des sourcils, et la ligne verticale devant les oreilles.",
  },
  {
    id: "back_pain",
    category: "Douleurs Articulaires",
    name: "Mal de dos",
    description:
      "Problèmes mécaniques et fonctionnels, douleurs de posture, effets d'une opération, hernie discale, ostéoporose.",
    points: [1, 43, 143],
    zones: ["nose_center", "forehead_center", "forehead_hairline", "ears_front"],
    instruction:
      "Massez la ligne centrale verticale du nez, la ligne centrale verticale du front, la ligne horizontale des cheveux, et la ligne verticale devant les oreilles.",
  },
  {
    id: "sciatica",
    category: "Douleurs Articulaires",
    name: "Sciatique",
    description:
      "Douleur irradiant de la zone lombaire, des fesses, à l'arrière de la jambe le long du nerf.",
    points: [5, 17, 38, 74],
    zones: ["forehead_hairline", "nasolabial_folds", "jaw_line"],
    instruction:
      "Racine des cheveux sur le front (2cm de large de chaque côté), des narines le long des sillons labiaux, et le long du bord de la mâchoire inférieure.",
  },
  {
    id: "cold",
    category: "Systèmes du Corps",
    name: "Rhume",
    description:
      "Interrompt le processus dégénératif du rhume. À effectuer dès le premier éternuement.",
    points: [61, 3, 73, 60],
    zones: ["nose_full", "ears_front"],
    instruction:
      "Massez la zone latérale du nez (de la base des narines à la naissance des cheveux), et la zone verticale devant les oreilles.",
  },
  {
    id: "sore_throat",
    category: "Systèmes du Corps",
    name: "Mal de gorge",
    description:
      "Amélioration presque immédiate. À effectuer dès les premières sensations de brûlure.",
    points: [12, 14, 20],
    zones: ["ears_front", "jaw_line"],
    instruction:
      "Zone verticale devant les oreilles, ligne horizontale sous les oreilles, et zone devant la partie inférieure des oreilles (glandes salivaires).",
  },
  {
    id: "digestion",
    category: "Systèmes du Corps",
    name: "Digestion / Constipation",
    description:
      "Massage pour favoriser le péristaltisme (mouvement des déchets à travers le système digestif).",
    points: [50, 41, 38, 113, 39, 37, 127, 365],
    zones: ["mouth_area", "chin_hollow"],
    instruction:
      "Périmètre de la bouche, en suivant le trajet du côlon : de la droite vers le haut, transversalement sous le nez, puis descendant à gauche.",
  },
];

function readDiagramPref(): boolean {
  try {
    const stored = localStorage.getItem(DIAGRAM_PREF_KEY);
    if (stored != null) return stored === "true";
  } catch {
    /* private mode */
  }
  if (typeof window === "undefined") return true;
  return window.matchMedia("(min-width: 1024px)").matches;
}

const ALL_MAP_POINT_IDS = getAllMappedPointIds();
const ZONE_OPTIONS = [
  "forehead",
  "forehead_center",
  "forehead_hairline",
  "eyebrows",
  "nose_center",
  "nose_full",
  "ears_front",
  "mouth_area",
  "jaw_line",
  "chin_hollow",
  "nasolabial_folds",
  "cheeks_under_eyes",
] as const satisfies readonly DienChanZoneId[];

export default function DienChanMap() {
  const faceRef = useRef<DienChanWireframeFaceHandle>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<DienChanProtocol | null>(null);
  const [mappingFilter, setMappingFilter] = useState<MappingFilterState>(DEFAULT_MAPPING_FILTER);
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [pointPlaybackIndex, setPointPlaybackIndex] = useState(0);
  const [pointPlaying, setPointPlaying] = useState(false);
  const [pointStepFocus, setPointStepFocus] = useState(false);
  const [showDiagram, setShowDiagram] = useState(readDiagramPref);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const [guideSheetOpen, setGuideSheetOpen] = useState(false);

  const organOptions = useMemo(() => listOrgansForPoints(ALL_MAP_POINT_IDS), []);

  const basePointIds = useMemo(
    () => (selectedProtocol ? selectedProtocol.points : ALL_MAP_POINT_IDS),
    [selectedProtocol],
  );

  const liaisonAnchorId =
    mappingFilter.mode === "liaison"
      ? (selectedPointId ?? hoveredPoint ?? mappingFilter.liaisonAnchorId)
      : mappingFilter.liaisonAnchorId;

  const effectiveFilter = useMemo(
    () =>
      mappingFilter.mode === "liaison"
        ? { ...mappingFilter, liaisonAnchorId }
        : mappingFilter,
    [mappingFilter, liaisonAnchorId],
  );

  const visiblePointIds = useMemo(
    () => filterMappedPoints(basePointIds, effectiveFilter),
    [basePointIds, effectiveFilter],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const pointPlaybackSequence = useMemo(
    () =>
      selectedProtocol ? buildPointPlaybackSequence(selectedProtocol.points) : [],
    [selectedProtocol],
  );

  const spotlightPointId: number | null = useMemo(() => {
    if (selectedProtocol && pointPlaybackSequence.length > 0) {
      if (pointPlaying || pointStepFocus) {
        return pointPlaybackSequence[pointPlaybackIndex % pointPlaybackSequence.length];
      }
      return null;
    }
    return selectedPointId;
  }, [
    selectedProtocol,
    pointPlaybackSequence,
    pointPlaying,
    pointStepFocus,
    pointPlaybackIndex,
    selectedPointId,
  ]);

  useEffect(() => {
    setPointPlaybackIndex(0);
    setPointPlaying(false);
    setPointStepFocus(false);
    setSelectedPointId(null);
  }, [selectedProtocol?.id ?? DIEN_CHAN_EXPLORE_VALUE]);

  useEffect(() => {
    if (!pointPlaying || pointPlaybackSequence.length === 0) return;
    const id = window.setInterval(() => {
      setPointPlaybackIndex((i) => (i + 1) % pointPlaybackSequence.length);
    }, POINT_STEP_MS);
    return () => window.clearInterval(id);
  }, [pointPlaying, pointPlaybackSequence.length, selectedProtocol?.id]);

  const selectProtocol = (protocol: DienChanProtocol | null) => {
    setSelectedProtocol(protocol);
  };

  const selectPointStep = useCallback((stepIndex: number) => {
    setPointPlaybackIndex(stepIndex);
    setPointPlaying(false);
    setPointStepFocus(true);
  }, []);

  const handlePointSelectFromFace = useCallback(
    (pointId: number) => {
      if (!visiblePointIds.includes(pointId)) return;

      if (selectedProtocol) {
        const stepIndex = pointPlaybackSequence.indexOf(pointId);
        if (stepIndex < 0) return;
        selectPointStep(stepIndex);
      } else {
        setSelectedPointId(pointId);
        if (mappingFilter.mode === "liaison") {
          setMappingFilter((f) => ({ ...f, liaisonAnchorId: pointId }));
        }
      }

      setHoveredPoint(pointId);
      const summary = summarizePointForStage(pointId, selectedProtocol?.id);
      setLiveAnnouncement(
        summary ? `Point ${pointId} sélectionné. ${summary}` : `Point ${pointId} sélectionné`,
      );
    },
    [
      visiblePointIds,
      selectedProtocol,
      pointPlaybackSequence,
      selectPointStep,
      mappingFilter.mode,
    ],
  );

  const toggleDiagram = () => {
    setShowDiagram((v) => {
      const next = !v;
      try {
        localStorage.setItem(DIAGRAM_PREF_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const pointStepCount = pointPlaybackSequence.length;
  const canPlayPoints = selectedProtocol != null && pointStepCount > 0;

  const stagePointSummary =
    spotlightPointId != null
      ? summarizePointForStage(spotlightPointId, selectedProtocol?.id)
      : null;

  const protocolSelectValue = selectedProtocol?.id ?? DIEN_CHAN_EXPLORE_VALUE;

  const sidePanelKey = selectedProtocol?.id ?? "explore";

  const panelMotion = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
      };

  const hoverToastMotion = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.92, y: -4 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.92, y: -4 },
        transition: { duration: 0.18 },
      };

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,hsl(var(--primary)/0.14),transparent_55%),radial-gradient(ellipse_at_80%_90%,hsl(var(--aegis-warm)/0.08),transparent_45%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(hsl(var(--foreground)/0.5)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.5)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="sr-only" role="status" aria-live="polite">
        {liveAnnouncement}
      </div>

      <header className="relative z-30 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
          <Button variant="ghost" size="sm" asChild className="focus-visible:ring-primary/40">
            <Link to="/">
              <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
              Retour
            </Link>
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Dev · carte interactive
              </p>
              <h1 className="truncate font-cormorant text-xl font-light tracking-tight sm:text-2xl">
                Dien Chan
              </h1>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              DEV ONLY
            </Badge>
          </div>
          <ThemeToggle />
        </div>
        <div className="border-t border-border/30 bg-background/50 px-4 py-3 lg:px-6">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3 lg:gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex min-w-0 flex-col gap-1 sm:w-72 shrink-0">
                <span className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Protocole (optionnel)
                </span>
                <DienChanProtocolSelect
                  protocols={protocols}
                  value={protocolSelectValue}
                  onChange={selectProtocol}
                />
              </div>
              <DienChanPointMappingBar
                filter={effectiveFilter}
                onChange={setMappingFilter}
                zoneOptions={[...ZONE_OPTIONS]}
                organOptions={organOptions}
                visibleCount={visiblePointIds.length}
                totalCount={basePointIds.length}
              />
            </div>
          </div>
        </div>
      </header>

      <div
        className="relative z-10 mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_min(380px,34vw)]"
      >
        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="relative min-h-0 min-w-0 flex-1">
          <div className="absolute inset-0 bg-black">
            <DienChanWireframeFace
              ref={faceRef}
              spotlightPointId={spotlightPointId}
              activePoints={visiblePointIds}
              hoveredPoint={hoveredPoint}
              pointsCoordinates={pointsCoordinates}
              onPointSelect={handlePointSelectFromFace}
              reducedMotion={reducedMotion}
            />
            {showDiagram && (
              <DienChanDiagramPreview
                activePoints={visiblePointIds}
                pointsCoordinates={pointsCoordinates}
                spotlightPointId={spotlightPointId}
                hoveredPoint={hoveredPoint}
              />
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-4">
            <p className="max-w-[min(100%,14rem)] rounded-full border border-white/10 bg-black/70 px-3 py-1 font-display text-[10px] uppercase tracking-[0.18em] text-white/80 backdrop-blur-md">
              {selectedProtocol ? selectedProtocol.name : "Carte BQC · exploration"}
            </p>
            <div className="flex flex-col items-end gap-2">
              <DienChanStageToolbar
                className="pointer-events-auto"
                showDiagram={showDiagram}
                onToggleDiagram={toggleDiagram}
                onResetView={() => faceRef.current?.resetView()}
              />
              <AnimatePresence mode="wait">
                {hoveredPoint != null && (
                  <motion.div
                    key={hoveredPoint}
                    {...hoverToastMotion}
                    className="rounded-md border border-[hsl(var(--aegis-warm)/0.4)] bg-black/70 px-2.5 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--aegis-warm))] shadow-lg backdrop-blur-md"
                  >
                    Point {hoveredPoint}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {canPlayPoints && (
            <div
              className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 pt-10 pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate font-display text-[10px] uppercase tracking-[0.14em] text-white/80">
                  Séquence points BQC
                  {spotlightPointId != null ? (
                    <span className="ml-2 font-semibold text-[hsl(var(--aegis-warm))] normal-case tracking-normal">
                      · Point {spotlightPointId}
                    </span>
                  ) : (
                    <span className="ml-2 text-white/50">· lecture en pause</span>
                  )}
                </p>
                <span className="shrink-0 font-mono text-[10px] text-white/50">
                  {pointStepCount > 0
                    ? `${(pointPlaybackIndex % pointStepCount) + 1}/${pointStepCount}`
                    : "—"}
                </span>
              </div>
              {stagePointSummary && (
                <p className="max-h-[9rem] overflow-y-auto whitespace-normal break-words text-xs leading-relaxed text-white/90">
                  {stagePointSummary}
                </p>
              )}
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {pointPlaybackSequence.map((pointId, i) => {
                    const active =
                      (pointPlaying || pointStepFocus) &&
                      i === pointPlaybackIndex % pointStepCount;
                    return (
                      <button
                        key={`${pointId}-${i}`}
                        type="button"
                        title={
                          summarizePointForStage(pointId, selectedProtocol?.id) ??
                          `Point ${pointId}`
                        }
                        onClick={() => selectPointStep(i)}
                        className={cn(
                          "h-1.5 min-h-[11px] flex-1 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                          active
                            ? "bg-[hsl(var(--aegis-warm))] shadow-[0_0_8px_hsl(var(--aegis-warm)/0.7)]"
                            : i < (pointPlaybackIndex % pointStepCount) && pointPlaying
                              ? "bg-white/35"
                              : "bg-white/15 hover:bg-white/25",
                        )}
                      />
                    );
                  })}
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-black/70 p-0.5 backdrop-blur-md">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 min-h-[44px] min-w-[44px] text-white/85 hover:bg-white/10 hover:text-white focus-visible:ring-primary/40 lg:h-8 lg:w-8 lg:min-h-0 lg:min-w-0"
                    disabled={!canPlayPoints}
                    onClick={() => {
                      setPointPlaybackIndex((i) =>
                        pointStepCount ? (i - 1 + pointStepCount) % pointStepCount : 0,
                      );
                      setPointPlaying(false);
                      setPointStepFocus(true);
                    }}
                    aria-label="Point précédent"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 min-h-[44px] min-w-[44px] text-[hsl(var(--aegis-warm))] hover:bg-white/10 focus-visible:ring-primary/40 lg:h-8 lg:w-8 lg:min-h-0 lg:min-w-0"
                    disabled={!canPlayPoints}
                    onClick={() => {
                      setPointPlaying((p) => {
                        const next = !p;
                        if (next) setPointStepFocus(true);
                        return next;
                      });
                    }}
                    aria-label={pointPlaying ? "Pause séquence" : "Lancer la séquence"}
                  >
                    {pointPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 min-h-[44px] min-w-[44px] text-white/85 hover:bg-white/10 hover:text-white focus-visible:ring-primary/40 lg:h-8 lg:w-8 lg:min-h-0 lg:min-w-0"
                    disabled={!canPlayPoints}
                    onClick={() => {
                      setPointPlaybackIndex((i) =>
                        pointStepCount ? (i + 1) % pointStepCount : 0,
                      );
                      setPointPlaying(false);
                      setPointStepFocus(true);
                    }}
                    aria-label="Point suivant"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          </div>

          <div className="relative z-30 shrink-0 border-t border-border/40 bg-background/90 p-3 backdrop-blur-md lg:hidden">
            <Sheet open={guideSheetOpen} onOpenChange={setGuideSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full focus-visible:ring-primary/40"
                >
                  <PanelRight className="mr-2 h-4 w-4" aria-hidden />
                  {selectedProtocol ? "Guide protocole" : "Carte & fiches points"}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="flex h-[88dvh] flex-col overscroll-contain p-0"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>
                    {selectedProtocol?.name ?? "Exploration BQC"}
                  </SheetTitle>
                </SheetHeader>
                {selectedProtocol ? (
                  <DienChanProtocolDetail
                    protocol={selectedProtocol}
                    pointPlaybackSequence={pointPlaybackSequence}
                    spotlightPointId={spotlightPointId}
                    hoveredPoint={hoveredPoint}
                    playbackIndex={pointPlaybackIndex}
                    onHoverPoint={setHoveredPoint}
                    onSelectPointStep={selectPointStep}
                  />
                ) : (
                  <DienChanExplorePanel
                    visiblePointIds={visiblePointIds}
                    selectedPointId={selectedPointId}
                    hoveredPointId={hoveredPoint}
                    onSelectPoint={(id) => {
                      setSelectedPointId(id);
                      if (mappingFilter.mode === "liaison") {
                        setMappingFilter((f) => ({ ...f, liaisonAnchorId: id }));
                      }
                    }}
                    onHoverPoint={setHoveredPoint}
                  />
                )}
              </SheetContent>
            </Sheet>
          </div>
        </section>

        <aside
          className="hidden lg:flex lg:min-h-0 lg:h-full lg:flex-col lg:overflow-hidden lg:border-l lg:border-border/40 lg:bg-card/30 lg:backdrop-blur-md"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={sidePanelKey}
              {...panelMotion}
              className="flex h-full min-h-0 w-full flex-col"
            >
              {selectedProtocol ? (
                <DienChanProtocolDetail
                  protocol={selectedProtocol}
                  pointPlaybackSequence={pointPlaybackSequence}
                  spotlightPointId={spotlightPointId}
                  hoveredPoint={hoveredPoint}
                  playbackIndex={pointPlaybackIndex}
                  onHoverPoint={setHoveredPoint}
                  onSelectPointStep={selectPointStep}
                />
              ) : (
                <DienChanExplorePanel
                  visiblePointIds={visiblePointIds}
                  selectedPointId={selectedPointId}
                  hoveredPointId={hoveredPoint}
                  onSelectPoint={(id) => {
                    setSelectedPointId(id);
                    if (mappingFilter.mode === "liaison") {
                      setMappingFilter((f) => ({ ...f, liaisonAnchorId: id }));
                    }
                  }}
                  onHoverPoint={setHoveredPoint}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}
