import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Brain,
  Check,
  ChevronRight,
  Heart,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { MobileAppDockBar } from "@/components/MobileAppDockBar";
import { moodSeriesToPolyline, scoreTrendToPolyline } from "./bioSparkline";
import { BioExecutiveSignalBanner } from "./BioExecutiveActionTiles";
import { BIO_EXECUTIVE_CAROUSEL_SLOTS } from "./bioExecutiveTiles";
import { BioExecutiveDesktopTilesGrid, renderBioExecutiveDesktopTile } from "./BioExecutiveDesktopTileGrid";
import { BioExecutiveLandscapeSplitTiles } from "./BioExecutiveLandscapeSplitTiles";
import {
  BioExecutiveDecisionTile,
  BioExecutiveLevelTile,
  BioExecutiveScoreTile,
} from "./BioExecutiveMetricTiles";
import "./bioExecutiveDashboard.css";
import { BioExecutiveHeroFigure } from "./BioExecutiveHeroFigure";
const BioExecutiveHeroLab = lazy(() =>
  import("./BioExecutiveHeroLab").then((m) => ({ default: m.BioExecutiveHeroLab })),
);
import { BioExecutiveHeroQuickActions } from "./BioExecutiveHeroQuickActions";
import { BioExecutiveHeroTitles } from "./BioExecutiveHeroTitles";
import type { ExocortexHeroUi } from "./bioExecutiveHeroPresentation";
import { useHeroLabDrag, type DragTarget } from "./bioExecutiveHeroLabDrag";
import { useHeroLabConfig } from "./useHeroLabConfig";
import {
  heroLabPreviewFrameClassNames,
  isHeroLabCompactPreviewFrame,
  isHeroLabSplitPreviewFrame,
  loadHeroLabEditorOpen,
  resolveHeroLabPreviewFrameKey,
} from "./bioExecutiveHeroLabConfig";
import { useBioExecutiveCarouselPointer } from "./useBioExecutiveCarouselPointer";
import type { BioExecutiveHabitRow, BioExecutiveViewModel, BioNodeId } from "./types";
import type { HeroBreakpointKey } from "./bioExecutiveHeroLabConfig";
import {
  BIO_EXECUTIVE_SHELL_PRESETS,
  shellBreakpointClassName,
  shellPresetToStyle,
} from "./bioExecutiveShellPresets";
import {
  detectMobileDeviceGabaritKey,
  getMobileDeviceGabarit,
  heroMobileDeviceGabaritClassName,
  mobileDeviceGabaritPreviewStyle,
  resolveMobileShellPreset,
} from "./bioExecutiveMobileDeviceGabarits";

const CALM_STORAGE_KEY = "aegis_bio_exec_calm_v1";

export type BioExecutiveMobileDashboardProps = {
  headerDate: string;
  viewModel: BioExecutiveViewModel;
  habits: BioExecutiveHabitRow[];
  onToggleHabit: (id: string) => void;
  onQuickLogOpen: () => void;
  quickLogTitle: string;
  quickLogSubtitle: string;
  aiTransparencyBody: string;
  /** Full-width monitor layout (prod desktop /dashboard). */
  desktopLayout?: boolean;
  embedInFrame?: boolean;
  /** Dev lab: hero layout editor (/dev/aegis-dashboard). */
  heroLab?: boolean;
  /** @deprecated use heroLab */
  silhouetteLab?: boolean;
  /** Desktop exocortex v2 (panneau gauche) */
  exocortexUi?: ExocortexHeroUi | null;
  /** Prod `/dashboard` : plein viewport (pas de carte 1480) ; sans header lab legacy */
  immersiveAppShell?: boolean;
  /** Progressive disclosure: metrics carousel from 40%, habits bento from 60% (mobile). */
  maturityCompletionScore?: number;
};

export function BioExecutiveMobileDashboard({
  headerDate,
  viewModel,
  habits,
  onToggleHabit,
  onQuickLogOpen,
  quickLogTitle,
  quickLogSubtitle,
  aiTransparencyBody,
  desktopLayout = false,
  embedInFrame = false,
  heroLab = false,
  silhouetteLab = false,
  exocortexUi = null,
  immersiveAppShell = false,
  maturityCompletionScore = 100,
}: BioExecutiveMobileDashboardProps) {
  const { locale, t } = useLanguage();
  const heroLocale = locale === "fr" ? "fr" : "en";
  const heroLabEnabled = heroLab || silhouetteLab;
  const [calmMode, setCalmMode] = useState(() => {
    try {
      return sessionStorage.getItem(CALM_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [selectedBioNode, setSelectedBioNode] = useState<BioNodeId>("heart");
  const [showAiTransparency, setShowAiTransparency] = useState(false);
  const [zeroUiConfirmed, setZeroUiConfirmed] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("14:00");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const [previewDockVisible, setPreviewDockVisible] = useState(true);
  const heroCanvasRef = useRef<HTMLDivElement>(null);
  const heroColumnRef = useRef<HTMLDivElement>(null);
  const heroStageRef = useRef<HTMLDivElement>(null);
  const heroFigureRef = useRef<HTMLDivElement>(null);
  const [labTarget, setLabTarget] = useState<DragTarget>("silhouette");
  const [heroBuilderOpen, setHeroBuilderOpen] = useState(loadHeroLabEditorOpen);
  const {
    config,
    persist,
    editBreakpoint,
    setEditBreakpoint,
    previewBreakpoint,
    viewportDisplay,
    setViewportDisplay,
    mobileDeviceGabarit,
    setMobileDeviceGabarit,
  } = useHeroLabConfig(heroLabEnabled);
  const [viewportWidthPx, setViewportWidthPx] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 390,
  );
  useEffect(() => {
    const sync = () => setViewportWidthPx(window.innerWidth);
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);
  const heroPreviewFrameKey =
    heroLabEnabled && heroBuilderOpen ? resolveHeroLabPreviewFrameKey(viewportDisplay, editBreakpoint) : null;
  const heroPreviewDeviceFrameKey =
    heroPreviewFrameKey != null && heroPreviewFrameKey !== "desktop" ? heroPreviewFrameKey : null;
  const heroPreviewCompactChrome =
    heroPreviewDeviceFrameKey != null && isHeroLabCompactPreviewFrame(heroPreviewDeviceFrameKey);
  /** Portrait-style stack + carousel in frame (not mobile paysage split). */
  const heroPreviewStackedChrome = heroPreviewCompactChrome;
  const heroPreviewSplitChrome =
    heroPreviewFrameKey != null && isHeroLabSplitPreviewFrame(heroPreviewFrameKey);
  const heroLabConfigKey =
    heroLabEnabled && heroBuilderOpen
      ? heroPreviewDeviceFrameKey != null
        ? (heroPreviewDeviceFrameKey as HeroBreakpointKey)
        : editBreakpoint
      : heroLabEnabled
        ? editBreakpoint
        : previewBreakpoint;
  const handleEditBreakpoint = useCallback(
    (key: HeroBreakpointKey) => {
      setEditBreakpoint(key);
      /* Cadre WYSIWYG = onglet breakpoint (évite Desktop/Mobile bloqué en session). */
      setViewportDisplay("auto");
    },
    [setEditBreakpoint, setViewportDisplay],
  );
  const heroSlice = config[heroLabConfigKey];
  const layoutUsesMobileGabarit =
    heroLabConfigKey === "mobilePortrait" || heroLabConfigKey === "mobileLandscape";
  const activeMobileDeviceGabarit = heroLabEnabled
    ? mobileDeviceGabarit
    : detectMobileDeviceGabaritKey(viewportWidthPx);
  const shellPreset = resolveMobileShellPreset(
    heroLabConfigKey,
    BIO_EXECUTIVE_SHELL_PRESETS[heroLabConfigKey],
    heroLabEnabled ? getMobileDeviceGabarit(activeMobileDeviceGabarit).widthPx : viewportWidthPx,
  );
  const labDevicePreviewStyle =
    heroLabEnabled &&
    heroBuilderOpen &&
    layoutUsesMobileGabarit &&
    heroPreviewFrameKey != null &&
    (heroPreviewFrameKey === "mobilePortrait" || heroPreviewFrameKey === "mobileLandscape")
      ? mobileDeviceGabaritPreviewStyle(
          mobileDeviceGabarit,
          heroPreviewFrameKey === "mobileLandscape" ? "landscape" : "portrait",
        )
      : undefined;
  const shellStyle = { ...shellPresetToStyle(shellPreset), ...labDevicePreviewStyle };
  const heroOverlayVisualActive =
    heroSlice.overlay.enabled || (heroLabEnabled && labTarget === "overlay");
  const heroOverlayBackdropActive =
    heroOverlayVisualActive &&
    (heroSlice.overlay.blurMaxPx > 0 ||
      heroSlice.overlay.blurMode === "gradual" ||
      heroSlice.overlay.opacityMaxPct > 0 ||
      heroSlice.overlay.opacityMinPct > 0);
  const carouselSlideCount = desktopLayout ? BIO_EXECUTIVE_CAROUSEL_SLOTS.length : 3;
  const previewCarouselTileClass =
    "aegis-bio-exec-lab__preview-carousel-slide min-w-0 snap-center shrink-0 h-full min-h-0";
  const onHeroSliceChange = useCallback(
    (next: typeof heroSlice) => {
      persist({ ...config, [heroLabConfigKey]: next });
    },
    [config, heroLabConfigKey, persist],
  );
  const { onPointerDown } = useHeroLabDrag({
    enabled: heroLabEnabled,
    canvasRef: heroCanvasRef,
    columnRef: heroColumnRef,
    figureRef: heroFigureRef,
    slice: heroSlice,
    onSliceChange: onHeroSliceChange,
    activeTarget: labTarget,
  });

  useEffect(() => {
    if (!heroLabEnabled || !heroBuilderOpen || heroPreviewStackedChrome) return;
    const node = heroCanvasRef.current;
    if (!node) return;
    const id = window.requestAnimationFrame(() => {
      node.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [heroLabEnabled, heroBuilderOpen, heroPreviewStackedChrome, labTarget, editBreakpoint, viewportDisplay]);

  const toggleCalm = useCallback(() => {
    setCalmMode((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(CALM_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useBioExecutiveCarouselPointer(carouselRef, heroPreviewStackedChrome);

  useEffect(() => {
    if (!heroPreviewStackedChrome) return;
    const frame = previewFrameRef.current;
    const carousel = carouselRef.current;
    if (!frame || !carousel) return;

    const onWheel = (event: WheelEvent) => {
      if (!carousel.contains(event.target as Node)) return;
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) return;
      carousel.scrollLeft += delta;
      event.preventDefault();
    };

    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, [heroPreviewStackedChrome]);

  useEffect(() => {
    const root = carouselRef.current;
    if (!root) return;

    const syncIndexFromScroll = () => {
      const cards = root.querySelectorAll<HTMLElement>("[data-bento-slide]");
      if (cards.length === 0) return;
      const center = root.scrollLeft + root.clientWidth / 2;
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      cards.forEach((el, i) => {
        const mid = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setCarouselIndex(best);
    };

    root.addEventListener("scroll", syncIndexFromScroll, { passive: true });
    syncIndexFromScroll();
    return () => root.removeEventListener("scroll", syncIndexFromScroll);
  }, [desktopLayout, heroPreviewStackedChrome, carouselSlideCount]);

  useEffect(() => {
    if (!heroPreviewStackedChrome) {
      setPreviewDockVisible(true);
      return;
    }
    const root = previewFrameRef.current;
    if (!root) return;

    let lastScrollTop = 0;
    const onScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      const scrollTop = target.scrollTop;
      if (scrollTop > lastScrollTop + 3 && scrollTop > 20) {
        setPreviewDockVisible(false);
      } else if (scrollTop < lastScrollTop - 3) {
        setPreviewDockVisible(true);
      }
      lastScrollTop = scrollTop;
    };

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (event.deltaY > 8) setPreviewDockVisible(false);
      else if (event.deltaY < -8) setPreviewDockVisible(true);
    };

    root.addEventListener("wheel", onWheel, { passive: true });
    const scrollables = root.querySelectorAll<HTMLElement>(
      ".aegis-bio-exec-lab__lab-mobile-carousel--preview, .aegis-bio-exec-lab__content-column--preview-compact",
    );
    scrollables.forEach((node) => node.addEventListener("scroll", onScroll, { passive: true }));

    return () => {
      root.removeEventListener("wheel", onWheel);
      scrollables.forEach((node) => node.removeEventListener("scroll", onScroll));
    };
  }, [heroPreviewStackedChrome]);

  const completedHabitsCount = habits.filter((h) => h.done).length;
  const progressPercentage =
    habits.length > 0 ? Math.round((completedHabitsCount / habits.length) * 100) : viewModel.progressTodayPct;
  const selectedNode = viewModel.bioNodes[selectedBioNode];
  const activeExocortexNode = exocortexUi?.nodes[selectedBioNode];
  const heroDetailDesc = activeExocortexNode?.desc ?? selectedNode.desc;

  const moodSeriesForChart =
    viewModel.moodSeries.some((v) => v > 0) ? viewModel.moodSeries : [];
  const scoreChartPoints =
    viewModel.scoreTrendSparkline.length >= 2
      ? scoreTrendToPolyline(viewModel.scoreTrendSparkline, 260, 70)
      : moodSeriesForChart.length > 0
        ? moodSeriesToPolyline(moodSeriesForChart, 260, 70)
        : "";
  const levelTrendPoints =
    viewModel.scoreTrendSparkline.length >= 2
      ? scoreTrendToPolyline(viewModel.scoreTrendSparkline, 200, 80, 12)
      : moodSeriesForChart.length > 0
        ? moodSeriesToPolyline(moodSeriesForChart, 200, 80, 12)
        : "";

  const levelChipLabel =
    viewModel.levelDeltaLabel ??
    (progressPercentage > 0 ? `+${progressPercentage}% auj.` : null);

  const showMetricsCarousel = desktopLayout || maturityCompletionScore >= 40;
  const showHabitsBentoGrid = desktopLayout || maturityCompletionScore >= 60;

  const bioGlowVar =
    selectedBioNode === "brain"
      ? "var(--bio-glow-brain)"
      : selectedBioNode === "heart"
        ? "var(--bio-glow-heart)"
        : "var(--bio-glow-solar)";

  return (
    <div
      className={cn(
        "aegis-bio-exec-lab font-quattrocento selection:bg-primary/20 flex flex-col",
        embedInFrame && "min-h-screen p-2 sm:p-4 lg:px-6 lg:pt-0 lg:pb-6 justify-between",
        !embedInFrame && "w-full",
        calmMode && "aegis-bio-exec-lab--calm",
        desktopLayout && "aegis-bio-exec-lab--desktop aegis-bio-exec-lab--neka",
        immersiveAppShell && "aegis-bio-exec-lab--immersive-viewport",
        immersiveAppShell && !embedInFrame && "lg:min-h-[100dvh]",
        heroLabEnabled && heroBuilderOpen && "aegis-bio-exec-lab--hero-builder-open",
        shellBreakpointClassName(heroLabConfigKey),
        immersiveAppShell &&
          shellPreset.prodMobileHeroChrome &&
          !heroLabEnabled &&
          "aegis-bio-exec-lab--prod-mobile-chrome",
        layoutUsesMobileGabarit && heroMobileDeviceGabaritClassName(activeMobileDeviceGabarit),
        ...(heroPreviewFrameKey ? heroLabPreviewFrameClassNames(heroPreviewFrameKey) : []),
      )}
      style={shellStyle}
    >
      <div
        ref={previewFrameRef}
        className={cn(
          "aegis-bio-exec-lab__frame relative w-full overflow-hidden border transition-colors duration-500",
          embedInFrame ? "max-w-[1440px] mx-auto rounded-[28px] sm:rounded-[36px] aegis-bio-exec-lab__embed-shadow" : "rounded-none border-0 shadow-none",
          heroPreviewSplitChrome && "aegis-bio-exec-lab__frame--preview-split max-w-none mx-0",
          desktopLayout && !embedInFrame && !immersiveAppShell && "lg:max-w-[1480px] lg:mx-auto lg:my-4 lg:rounded-[32px] lg:border lg:border-[color:var(--bio-frame-border)] lg:shadow-[0_28px_90px_hsl(var(--foreground)/0.07)]",
          immersiveAppShell && !embedInFrame && "w-full max-w-none rounded-none border-0 shadow-none lg:h-[100dvh] lg:min-h-[100dvh] lg:mx-0 lg:my-0",
        )}
      >
        {!immersiveAppShell || heroLabEnabled ? (
        <header
          className={cn(
            "aegis-bio-exec-lab__header flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-8 py-2.5 sm:py-3.5 z-40",
            /* Immersive / lab desktop: overlay — never steals hero column height */
            immersiveAppShell
              ? "absolute inset-x-0 top-0 border-0 bg-transparent pointer-events-none [&_button]:pointer-events-auto [&_a]:pointer-events-auto [&_[data-hero-builder-slot]]:pointer-events-auto"
              : "border-b backdrop-blur-xl sticky top-0 bg-[color-mix(in_srgb,var(--bio-frame)_82%,transparent)]",
          )}
        >
          {!immersiveAppShell ? (
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border border-[color:var(--bio-frame-border)] bg-[color:var(--bio-chip)]">
                <Sparkles size={14} className="aegis-bio-exec-lab__accent-text" />
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="font-semibold tracking-tight text-sm sm:text-base">Aegis</span>
                <span className="aegis-bio-exec-lab__header-kicker aegis-bio-exec-lab__type-label-caps hidden md:inline opacity-70">
                  Bio-Executive · {headerDate}
                </span>
              </div>
            </div>
          ) : (
            <div className="shrink-0" aria-hidden />
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {!immersiveAppShell ? (
              <>
                <button
                  type="button"
                  onClick={onQuickLogOpen}
                  className="aegis-bio-exec-lab__cta-primary hidden lg:inline-flex min-h-[40px] items-center rounded-xl px-4 text-xs font-medium"
                >
                  {quickLogTitle}
                </button>
                <button
                  type="button"
                  onClick={toggleCalm}
                  title="Mode Calme : Réduit la saturation et les animations"
                  className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs border transition-all ${
                    calmMode
                      ? "aegis-bio-exec-lab__calm-active"
                      : "border-[color:var(--bio-frame-border)] bg-[color:var(--bio-chip)] text-[color:var(--bio-ink)] hover:opacity-90"
                  }`}
                >
                  <Brain size={14} />
                  <span className="hidden md:inline">{calmMode ? "Focus Calme" : "Standard"}</span>
                </button>
              </>
            ) : null}
            <span data-hero-builder-slot className="contents" />
          </div>
        </header>
        ) : null}

        <div
          className={cn(
            "aegis-bio-exec-lab__main-grid grid lg:gap-0 lg:p-0",
            heroPreviewSplitChrome
              ? "grid-cols-12 min-h-0 h-full flex-1 max-h-full"
              : immersiveAppShell && desktopLayout
                ? "grid-cols-1 lg:grid-cols-12 lg:min-h-[100dvh]"
                : "grid-cols-1 lg:grid-cols-12 lg:min-h-[calc(100vh-5.5rem)]",
          )}
        >
          <div
            ref={heroColumnRef}
            className={cn(
              "aegis-bio-exec-lab__column aegis-bio-exec-lab__desktop-hero flex flex-col justify-between relative overflow-hidden lg:overflow-visible border-b lg:border-b-0 lg:border-r",
              !heroOverlayBackdropActive && "isolate",
              heroOverlayBackdropActive && "aegis-bio-exec-lab__desktop-hero--overlay-backdrop",
              desktopLayout ? (heroPreviewSplitChrome ? "col-span-5" : "lg:col-span-7") : "lg:col-span-5",
              heroPreviewSplitChrome && "min-h-0 h-full lg:overflow-hidden lg:mb-0",
            )}
          >
            <div
              ref={heroCanvasRef}
              className={cn(
                "aegis-bio-exec-lab__hero-canvas relative flex flex-col flex-1 min-h-0 overflow-visible",
                immersiveAppShell && desktopLayout && "lg:absolute lg:inset-0",
                immersiveAppShell && !desktopLayout && "max-lg:flex-1 max-lg:min-h-0",
              )}
            >
              <BioExecutiveHeroTitles
                slice={heroSlice}
                heroLab={heroLabEnabled}
                labTarget={labTarget}
                onLabTargetSelect={setLabTarget}
                onPointerDown={onPointerDown}
                viewModel={viewModel}
                nodeTitle={selectedNode.title}
                exocortexStatusLine={desktopLayout ? exocortexUi?.statusLine : null}
                exocortexConstatTitle={desktopLayout ? exocortexUi?.constatTitle : null}
                showAiTransparency={showAiTransparency}
                onToggleAiTransparency={() => setShowAiTransparency(!showAiTransparency)}
                prodMobileChrome={
                  immersiveAppShell && shellPreset.prodMobileHeroChrome && !heroLabEnabled
                }
              />

              {showAiTransparency && (
                <div
                  className="relative z-30 my-3 p-3.5 rounded-2xl border text-xs backdrop-blur-md transition-all bg-[color:var(--bio-frame)]/90 border-primary/25 text-[color:var(--bio-ink)] shadow-lg"
                >
                  <div className="flex items-center justify-between mb-1 font-medium aegis-bio-exec-lab__accent-text">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={14} /> Diagnostic IA Transparent
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAiTransparency(false)}
                      className="text-[10px] underline"
                    >
                      Fermer
                    </button>
                  </div>
                  <p className="opacity-80 leading-relaxed text-[11px]">{aiTransparencyBody}</p>
                </div>
              )}

              <div
                ref={heroStageRef}
                className={cn(
                  "aegis-bio-exec-lab__hero-stage relative flex flex-1 min-h-0 items-center justify-center overflow-visible",
                  immersiveAppShell && desktopLayout
                    ? "my-0 min-h-[min(62dvh,640px)] h-full lg:min-h-0"
                    : immersiveAppShell && !desktopLayout
                      ? "my-0 max-lg:min-h-0"
                      : "my-1 sm:my-6 min-h-[290px] sm:min-h-[380px]",
                  heroPreviewStackedChrome && "aegis-bio-exec-lab__hero-stage--preview-compact",
                  heroPreviewSplitChrome && "aegis-bio-exec-lab__hero-stage--preview-split min-h-0 sm:min-h-0",
                )}
              >
                <BioExecutiveHeroFigure
                  figureRef={heroFigureRef}
                  slice={heroSlice}
                  heroLab={heroLabEnabled}
                  labTarget={labTarget}
                  onLabTargetSelect={setLabTarget}
                  onPointerDown={onPointerDown}
                  calmMode={calmMode}
                  bioGlowVar={bioGlowVar}
                  viewModel={viewModel}
                  selectedBioNode={selectedBioNode}
                  setSelectedBioNode={setSelectedBioNode}
                  selectedNode={selectedNode}
                  exocortexUi={desktopLayout ? exocortexUi : null}
                  prodMobileChrome={
                    immersiveAppShell && shellPreset.prodMobileHeroChrome && !heroLabEnabled
                  }
                />
              </div>
            </div>

            {/* Lab desktop: no bottom chrome band — hero must be full viewport for silhouette tuning */}
            {!(heroLabEnabled && desktopLayout && immersiveAppShell) ? (
            <div
              className={cn(
                "aegis-bio-exec-lab__hero-footer-chrome z-20 space-y-2.5 pt-2 sm:pt-3 lg:border-t-0 border-t border-[color:var(--bio-frame-border)] lg:mb-2",
                immersiveAppShell
                  ? "relative max-lg:mt-auto max-lg:border-t-0 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mb-0 lg:border-t-0"
                  : "relative",
              )}
            >
              {desktopLayout && exocortexUi ? (
                <BioExecutiveHeroQuickActions
                  locale={heroLocale}
                  onMoodQuickLog={onQuickLogOpen}
                  showMemoryQuerySoon={exocortexUi.showMemoryQuerySoon}
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {immersiveAppShell && !heroLabEnabled ? (
                    <div className="px-1 text-center" aria-live="polite">
                      <p className="m-0 font-light text-[2rem] leading-none tabular-nums tracking-tight">
                        {selectedNode.metric}
                        <span className="ml-0.5 text-base opacity-45">{selectedNode.unit}</span>
                      </p>
                    </div>
                  ) : null}
                  {/* Clean Mobile Bio-Node Switcher */}
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card/90 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/40">
                    {(
                      [
                        ["brain", "Cognition", Brain],
                        ["heart", "Cohérence", Heart],
                        ["solar", "Énergie", Zap],
                      ] as const
                    ).map(([id, label, Icon]) => {
                      const active = selectedBioNode === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedBioNode(id)}
                          className={cn(
                            "aegis-bio-exec-lab__shell-footer-bionode flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-center font-cinzel font-medium uppercase tracking-[0.12em] transition-all",
                            active
                              ? "border border-[color:var(--aegis-gold)]/40 bg-[color:var(--aegis-gold)]/15 font-semibold text-[color:var(--aegis-gold)] shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <Icon
                            size={14}
                            className={active ? "text-[color:var(--aegis-gold)]" : "text-muted-foreground"}
                          />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Cadence Status & Quick Action */}
                  <div className="flex items-center justify-between gap-3 px-1">
                    <p className="aegis-bio-exec-lab__shell-footer-detail line-clamp-2 flex-1 font-sans leading-relaxed text-muted-foreground">
                      {heroDetailDesc}
                    </p>
                    <button
                      type="button"
                      onClick={onQuickLogOpen}
                      className="aegis-bio-exec-lab__shell-footer-quicklog flex shrink-0 items-center gap-1 rounded-lg border border-[color:var(--aegis-gold)]/35 bg-[color:var(--aegis-gold)]/10 px-2.5 py-1.5 font-cinzel font-semibold uppercase tracking-wider text-[color:var(--aegis-gold)] transition-all hover:bg-[color:var(--aegis-gold)]/20"
                    >
                      <Sparkles size={11} />
                      <span>{t("dashboard.mobileLogNow") || "Quick-Log"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            ) : null}
          </div>

          {!desktopLayout ? (
            <div className="hidden lg:flex lg:col-span-3 min-h-[520px]">
              <BioExecutiveLevelTile
                viewModel={viewModel}
                levelChipLabel={levelChipLabel}
                levelTrendPoints={levelTrendPoints}
                scoreChartPoints={scoreChartPoints}
                calmMode={calmMode}
                className="w-full"
              />
            </div>
          ) : null}

          <div
            className={cn(
              "aegis-bio-exec-lab__content-column max-lg:w-full flex flex-col min-h-0",
              heroPreviewSplitChrome
                ? "p-0 gap-0 col-span-7 aegis-bio-exec-lab__content-column--preview-split"
                : cn(
                    "p-3 sm:p-5 lg:p-6 lg:pb-[calc(var(--mobile-dock-padding)+1rem)] gap-3 lg:gap-4",
                    desktopLayout ? "lg:col-span-5" : "lg:col-span-4",
                  ),
              heroPreviewStackedChrome && "aegis-bio-exec-lab__content-column--preview-compact",
            )}
          >
            {heroPreviewSplitChrome ? (
              <div className="aegis-bio-exec-lab__lab-desktop-tiles aegis-bio-exec-lab__landscape-split-panel flex flex-1 min-h-0 min-w-0 overflow-hidden px-1.5 py-1">
                <BioExecutiveLandscapeSplitTiles viewModel={viewModel} habits={habits} />
              </div>
            ) : (
            <>
            <div
              className={cn(
                "aegis-bio-exec-lab__metrics-deck flex flex-col min-h-0",
                heroPreviewStackedChrome
                  ? "aegis-bio-exec-lab__metrics-deck--preview flex-1 gap-1 min-h-0"
                  : "gap-3",
              )}
            >
            {desktopLayout && !heroPreviewStackedChrome && !heroPreviewSplitChrome ? (
              <BioExecutiveSignalBanner viewModel={viewModel} className="px-1 lg:px-0" />
            ) : null}

            {showMetricsCarousel && !heroPreviewCompactChrome ? (
              <div className="aegis-bio-exec-lab__lab-mobile-carousel-label aegis-bio-exec-lab__shell-carousel-label flex lg:hidden items-center justify-between px-1 pt-0.5 uppercase tracking-widest opacity-50 font-semibold">
                <span>Métriques clés (glisser →)</span>
                <span>
                  {carouselIndex + 1} / {carouselSlideCount}
                </span>
              </div>
            ) : null}

            {showMetricsCarousel && (!desktopLayout || heroPreviewStackedChrome) ? (
            <div
              className={cn(
                "aegis-bio-exec-lab__metrics-carousel-shell relative min-h-0 min-w-0",
                heroPreviewStackedChrome &&
                  "aegis-bio-exec-lab__metrics-carousel-shell--preview flex min-h-0 flex-1 flex-col",
              )}
            >
              <div
                ref={carouselRef}
                className={cn(
                  "aegis-bio-exec-lab__lab-mobile-carousel flex flex-row flex-nowrap gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 min-w-0 touch-pan-x cursor-grab active:cursor-grabbing",
                  !heroPreviewStackedChrome && "lg:hidden",
                  heroPreviewStackedChrome &&
                    "aegis-bio-exec-lab__lab-mobile-carousel--preview mx-0 min-h-0 flex-1 self-stretch px-1.5 pb-0",
                )}
              >
              {desktopLayout ? (
                <>
                  {BIO_EXECUTIVE_CAROUSEL_SLOTS.map((slot, index) =>
                    renderBioExecutiveDesktopTile(slot.id, {
                      viewModel,
                      habits,
                      calmMode,
                      slideProps: { "data-bento-slide": index },
                      className: heroPreviewStackedChrome
                        ? previewCarouselTileClass
                        : "aegis-bio-exec-lab__shell-carousel-slide snap-center",
                    }),
                  )}
                </>
              ) : (
                <>
                  <BioExecutiveLevelTile
                    viewModel={viewModel}
                    levelChipLabel={levelChipLabel}
                    levelTrendPoints={levelTrendPoints}
                    scoreChartPoints={scoreChartPoints}
                    calmMode={calmMode}
                    slideProps={{ "data-bento-slide": 0 }}
                    className={
                      heroPreviewStackedChrome
                        ? previewCarouselTileClass
                        : "aegis-bio-exec-lab__shell-carousel-slide snap-center"
                    }
                  />
                  <BioExecutiveScoreTile
                    viewModel={viewModel}
                    levelChipLabel={levelChipLabel}
                    levelTrendPoints={levelTrendPoints}
                    scoreChartPoints={scoreChartPoints}
                    calmMode={calmMode}
                    slideProps={{ "data-bento-slide": 1 }}
                    className={
                      heroPreviewStackedChrome
                        ? previewCarouselTileClass
                        : "aegis-bio-exec-lab__shell-carousel-slide snap-center"
                    }
                  />
                  <BioExecutiveDecisionTile
                    viewModel={viewModel}
                    levelChipLabel={levelChipLabel}
                    levelTrendPoints={levelTrendPoints}
                    scoreChartPoints={scoreChartPoints}
                    calmMode={calmMode}
                    slideProps={{ "data-bento-slide": 2 }}
                    className={
                      heroPreviewStackedChrome
                        ? previewCarouselTileClass
                        : "aegis-bio-exec-lab__shell-carousel-slide snap-center"
                    }
                  />
                </>
              )}
              </div>
            </div>
            ) : null}
            </div>

            {desktopLayout && !heroPreviewStackedChrome ? (
              <div className="aegis-bio-exec-lab__lab-desktop-tiles flex flex-col gap-4">
                <BioExecutiveDesktopTilesGrid
                  viewModel={viewModel}
                  habits={habits}
                  calmMode={calmMode}
                  selectedBioNode={selectedBioNode}
                />
              </div>
            ) : !heroPreviewStackedChrome && !desktopLayout ? (
              <div className="hidden lg:flex lg:flex-col lg:gap-4">
                <BioExecutiveScoreTile
                  viewModel={viewModel}
                  levelChipLabel={levelChipLabel}
                  levelTrendPoints={levelTrendPoints}
                  scoreChartPoints={scoreChartPoints}
                  calmMode={calmMode}
                />
                <BioExecutiveDecisionTile
                  viewModel={viewModel}
                  levelChipLabel={levelChipLabel}
                  levelTrendPoints={levelTrendPoints}
                  scoreChartPoints={scoreChartPoints}
                  calmMode={calmMode}
                />
              </div>
            ) : null}

            {showHabitsBentoGrid && !desktopLayout ? (
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-2.5 lg:gap-4">
              <div className="aegis-bio-exec-lab__bento aegis-bio-exec-lab__bento-habits aegis-bio-exec-lab__shell-bento-card col-span-1 rounded-[22px] sm:rounded-[24px] p-3.5 sm:p-4 relative overflow-hidden flex flex-col justify-between shadow-sm transition-all duration-500">
                <div className="flex items-center justify-between text-xs aegis-bio-exec-lab__bento-subtle">
                  <span className="font-medium">Habitudes</span>
                  <span className="aegis-bio-exec-lab__shell-bento-chip font-mono bg-primary-muted px-1.5 sm:px-2 py-0.5 rounded-full">
                    {completedHabitsCount}/{habits.length}
                  </span>
                </div>

                <div className="my-1.5 sm:my-2 space-y-1 sm:space-y-1.5 z-10">
                  {habits.slice(0, 4).map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => onToggleHabit(h.id)}
                      className="aegis-bio-exec-lab__shell-bento-chip w-full flex items-center justify-between text-left py-1 px-1.5 sm:px-2 rounded-lg aegis-bio-exec-lab__bento-chip hover:opacity-90 backdrop-blur-sm transition-all"
                    >
                      <span className={`truncate pr-1 ${h.done ? "line-through opacity-65" : "font-medium"}`}>
                        {h.name}
                      </span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                          h.done ? "aegis-bio-exec-lab__bento-check-done" : "aegis-bio-exec-lab__bento-check-idle"
                        }`}
                      >
                        {h.done && <Check size={9} strokeWidth={3} />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="aegis-bio-exec-lab__shell-bento-chip aegis-bio-exec-lab__bento-muted flex items-center justify-between pt-1 border-t aegis-bio-exec-lab__bento-divider">
                  <span>Jour</span>
                  <span className="font-semibold">{progressPercentage}%</span>
                </div>
              </div>

              <div className="aegis-bio-exec-lab__bento aegis-bio-exec-lab__bento-sessions aegis-bio-exec-lab__shell-bento-card col-span-1 rounded-[22px] sm:rounded-[24px] p-3.5 sm:p-4 relative overflow-hidden flex flex-col justify-between shadow-sm transition-all duration-500">
                <div className="flex items-center justify-between text-xs aegis-bio-exec-lab__bento-subtle z-10">
                  <div>
                    <span className="text-xl sm:text-2xl font-light block leading-none">{viewModel.sessionsCount}</span>
                    <span className="aegis-bio-exec-lab__shell-bento-chip opacity-80">Sessions</span>
                  </div>
                  <ArrowUpRight size={14} className="opacity-80" />
                </div>

                <div className="relative h-20 sm:h-24 w-full flex items-center justify-center my-auto">
                  <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible" aria-hidden>
                    {Array.from({ length: 8 }).map((_, idx) => {
                      const y = 82 - idx * 9;
                      const halfWidth = 10 + idx * 8.5;
                      return (
                        <path
                          key={idx}
                          d={`M ${80 - halfWidth} ${y} Q 80 ${y - 8}, ${80 + halfWidth} ${y}`}
                          fill="none"
                          stroke="var(--bio-positive)"
                          strokeOpacity={0.55}
                          strokeWidth="1.2"
                        />
                      );
                    })}
                    <circle cx="80" cy="86" r="3.5" fill="var(--bio-warm)" />
                  </svg>
                </div>

                <div className="aegis-bio-exec-lab__shell-bento-chip aegis-bio-exec-lab__bento-subtle flex items-center justify-between z-10">
                  <span>Régularité</span>
                  <span className="font-medium">{viewModel.regularityPct}%</span>
                </div>
              </div>

              <div className="aegis-bio-exec-lab__pulse aegis-bio-exec-lab__pulse--insights aegis-bio-exec-lab__shell-bento-card aegis-bio-exec-lab__shell-bento-card--pulse col-span-2 rounded-[22px] sm:rounded-[24px] p-3.5 sm:p-4 relative overflow-hidden flex flex-col justify-between border shadow-sm transition-all duration-500">
                <div className="flex items-center justify-between text-xs">
                  <span className="aegis-bio-exec-lab__shell-bento-title uppercase tracking-widest font-semibold aegis-bio-exec-lab__accent-text">
                    Décision en attente
                  </span>
                  <Sparkles size={13} className="aegis-bio-exec-lab__warm-text" />
                </div>

                <div className="my-auto py-1.5 sm:py-2 flex flex-col sm:block sm:space-y-1">
                  <p className="aegis-bio-exec-lab__shell-bento-body font-medium leading-snug">
                    {viewModel.pendingDecision?.name ?? viewModel.pulsePendingTitle}
                  </p>
                  {viewModel.journalSnippet ? (
                  <p className="aegis-bio-exec-lab__shell-bento-chip opacity-65 mt-0.5 sm:mt-1 leading-normal line-clamp-2 sm:line-clamp-none">
                    « {viewModel.journalSnippet} »
                  </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-[color:var(--bio-frame-border)]">
                  {viewModel.pendingDecision && viewModel.pendingDecision.ageDays > 0 ? (
                    <span className="aegis-bio-exec-lab__shell-bento-chip opacity-50 tabular-nums">
                      {locale === "fr"
                        ? `Depuis ${viewModel.pendingDecision.ageDays} j`
                        : `${viewModel.pendingDecision.ageDays}d pending`}
                    </span>
                  ) : (
                    <span aria-hidden className="w-px opacity-0" />
                  )}
                  <NavLink
                    to="/decisions"
                    className="text-[11px] font-semibold flex items-center gap-1 aegis-bio-exec-lab__accent-text hover:translate-x-0.5 transition-transform no-underline min-h-[44px] items-center"
                  >
                    <span>Ouvrir</span>
                    <ChevronRight size={13} />
                  </NavLink>
                </div>
              </div>
            </div>
            ) : null}
            </>
            )}
          </div>
        </div>
        {heroLabEnabled && heroBuilderOpen && heroPreviewStackedChrome ? (
          <MobileAppDockBar
            previewOnDesktop
            position="relative"
            className={cn(
              "aegis-bio-exec-lab__frame-dock",
              !previewDockVisible && "aegis-bio-exec-lab__frame-dock--hidden",
            )}
          />
        ) : null}
      </div>
      {heroLabEnabled ? (
        <Suspense fallback={null}>
          <BioExecutiveHeroLab
            config={config}
            editBreakpoint={editBreakpoint}
            activeConfigKey={heroLabConfigKey}
            onEditBreakpoint={handleEditBreakpoint}
            viewportDisplay={viewportDisplay}
            onViewportDisplay={setViewportDisplay}
            mobileDeviceGabarit={mobileDeviceGabarit}
            onMobileDeviceGabarit={setMobileDeviceGabarit}
            onConfigChange={persist}
            selectedTarget={labTarget}
            onSelectedTarget={setLabTarget}
            onEditorOpenChange={setHeroBuilderOpen}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
