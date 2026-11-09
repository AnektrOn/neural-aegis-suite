import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Library,
  X,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Hexagon,
  HelpCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  Unlock,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import type { PulseCard, SwipeAction, RuneProgress } from "../domain/types";
import {
  recordPulseSwipe,
  recyclePulseIgnored,
  fetchPulseDiagnostic,
  isPulseDeckExhausted,
  type PulseDiagnostic,
} from "../services/pulseService";
import { usePulseDeck } from "../hooks/usePulseDeck";
import { usePulseGrimoire } from "../hooks/usePulseGrimoire";
import { SwipeableCard } from "../components/SwipeableCard";
import { PulseGrimoire, CardRow } from "../components/PulseGrimoire";
import { PulseRuneTracker, buildGlyphGroups, type GlyphGroup } from "../components/PulseRuneTracker";
import { PulseCourseView } from "../components/PulseCourseView";
import { PulseOnboarding } from "../components/PulseOnboarding";
import { SacredGeometry } from "../components/SacredGeometry";
import { isPulseOnboarded, markPulseOnboarded } from "../lib/pulseOnboarding";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import { cn } from "@/lib/utils";

type PulseView = "deck" | "grimoire" | "runes";
type CodexTab = "grimoire" | "runes";
type GrimoireSubTab = "in_progress" | "validated";

export default function PulsePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { state: deckState, reload: reloadDeck } = usePulseDeck();
  const [localCards, setLocalCards] = useState<PulseCard[]>([]);
  const [activeView, setActiveView] = useState<PulseView>("deck");
  const { state: grimoireState, reload: reloadGrimoire } = usePulseGrimoire(true);
  const [activeCourse, setActiveCourse] = useState<PulseCard | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isRecycling, setIsRecycling] = useState(false);
  const [diag, setDiag] = useState<PulseDiagnostic | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [codexTab, setCodexTab] = useState<CodexTab>("grimoire");
  const [grimoireSubTab, setGrimoireSubTab] = useState<GrimoireSubTab>("in_progress");
  const [selectedGroupCode, setSelectedGroupCode] = useState<string | null>(null);
  const onboardingInitRef = useRef(false);

  useEffect(() => {
    if (onboardingInitRef.current || !user?.id) return;
    onboardingInitRef.current = true;
    if (!isPulseOnboarded(user.id)) {
      setShowOnboarding(true);
    }
  }, [user?.id]);

  const completeOnboarding = useCallback(() => {
    if (user?.id) markPulseOnboarded(user.id);
    setShowOnboarding(false);
  }, [user?.id]);

  useEffect(() => {
    if (deckState.status === "ready") {
      setLocalCards(deckState.cards);
      if (deckState.cards.length === 0) {
        fetchPulseDiagnostic().then((d) => {
          setDiag(isPulseDeckExhausted(d) ? null : d);
        });
      } else {
        setDiag(null);
      }
    }
  }, [deckState]);

  const library = grimoireState.status === "ready" ? grimoireState.library : [];
  const libraryCount = library.length;
  const inProgressCards = useMemo(() => library.filter((c) => !c.isCourseCompleted), [library]);
  const validatedCards = useMemo(() => library.filter((c) => c.isCourseCompleted), [library]);

  const runes = grimoireState.status === "ready" ? grimoireState.runes : [];
  const glyphGroups = useMemo(() => buildGlyphGroups(runes), [runes]);
  const unlockedRunesCount = useMemo(() => runes.filter((r) => r.isUnlocked).length, [runes]);
  const totalRunesCount = runes.length;

  const activeGroup = useMemo(() => {
    if (!glyphGroups.length) return null;
    if (selectedGroupCode) {
      return glyphGroups.find((g) => g.collectionCode === selectedGroupCode) ?? glyphGroups[0];
    }
    return glyphGroups[0];
  }, [glyphGroups, selectedGroupCode]);

  const showNotification = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSwipe = useCallback(
    async (direction: "left" | "right", card: PulseCard) => {
      if (isSwiping) return;
      setIsSwiping(true);

      const action: SwipeAction = direction === "right" ? "assimilated" : "ignored";
      const result = await recordPulseSwipe(card.id, action);

      if ("error" in result) {
        showNotification(result.error);
        setIsSwiping(false);
        return;
      }

      if (action === "assimilated") {
        showNotification(t("pulse.fragmentAssimilated"));
      }

      setLocalCards((prev) => prev.filter((c) => c.id !== card.id));
      await reloadDeck();
      if (action === "assimilated") {
        await reloadGrimoire();
      }
      setIsSwiping(false);
    },
    [isSwiping, reloadDeck, reloadGrimoire, showNotification, t],
  );

  const forceSwipe = useCallback(
    (direction: "left" | "right") => {
      if (localCards.length === 0 || isSwiping) return;
      void handleSwipe(direction, localCards[0]);
    },
    [localCards, isSwiping, handleSwipe],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (activeCourse || showOnboarding) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        forceSwipe("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        forceSwipe("right");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [forceSwipe, activeCourse, showOnboarding]);

  const handleRecycleIgnored = useCallback(async () => {
    setIsRecycling(true);
    const result = await recyclePulseIgnored();
    if (result.ok && result.recycled > 0) {
      showNotification(t("pulse.recycledCards", { count: String(result.recycled) }));
      await reloadDeck();
    } else if (result.ok && result.recycled === 0) {
      showNotification(t("pulse.noCardsToRecycle"));
    }
    setIsRecycling(false);
  }, [reloadDeck, showNotification, t]);

  const onboardingOverlay = showOnboarding ? <PulseOnboarding onComplete={completeOnboarding} /> : null;

  if (activeCourse) {
    return (
      <>
        <PulseCourseView
          card={activeCourse}
          onClose={() => setActiveCourse(null)}
          onComplete={(result) => {
            setActiveCourse(null);
            if (result.ok && result.runeUnlocked && result.principleCode) {
              const runeName =
                grimoireState.status === "ready"
                  ? grimoireState.runes.find((r) => r.principleCode === result.principleCode)?.principleName ??
                    activeCourse.principleName
                  : activeCourse.principleName;
              showNotification(t("pulse.runeUnlocked", { name: runeName }));
            } else {
              showNotification(t("pulse.wisdomIntegrated"));
            }
            void reloadGrimoire();
          }}
        />
        {onboardingOverlay}
      </>
    );
  }

  // Mobile dedicated full screen modal views
  if (activeView === "grimoire") {
    return (
      <>
        <PulseGrimoire
          state={grimoireState}
          onClose={() => setActiveView("deck")}
          onOpenCourse={(card) => {
            setActiveView("deck");
            setActiveCourse(card);
          }}
        />
        {onboardingOverlay}
      </>
    );
  }

  if (activeView === "runes") {
    return (
      <>
        <PulseRuneTracker state={grimoireState} onClose={() => setActiveView("deck")} />
        {onboardingOverlay}
      </>
    );
  }

  // Dual-pane layout: Left is Focal Card Deck, Right is Integrated Live Codex
  const leftDeckPane = (
    <div className="flex flex-col h-full justify-between space-y-4">
      {/* Kicker & Title Header */}
      <div>
        <div className="flex items-center justify-between">
          <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.24em] uppercase text-[#9e7828] dark:text-[#c9a24b]">
            AEGIS PULSE · FRAGMENTS DE CONSCIENCE
          </p>
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t("pulse.showGuide")}
          >
            <HelpCircle size={15} strokeWidth={1.5} />
            <span className="font-cinzel text-[10px] uppercase tracking-wider hidden sm:inline">Guide</span>
          </button>
        </div>
        <h1 className="font-cormorant text-2xl sm:text-3xl font-light text-foreground mt-1">
          {t("pulse.title")}
        </h1>
        <p className="font-sans text-xs text-muted-foreground mt-1">
          {localCards.length > 0
            ? `${localCards.length} fragments prêts à être assimilés ou ignorés.`
            : "Cycle d'assimilation actuel complété."}
        </p>
      </div>

      {/* Main Interactive Deck Frame */}
      <div className="relative w-full aspect-[3/4] max-h-[50dvh] sm:max-h-[55dvh] lg:max-h-[58dvh] mx-auto flex items-center justify-center">
        {deckState.status === "loading" && localCards.length === 0 && (
          <div className="flex justify-center py-24">
            <div className="w-7 h-7 border-2 border-border-subtle border-t-accent-primary rounded-full animate-spin" />
          </div>
        )}

        {deckState.status === "error" && (
          <div className="text-center p-8 dashboard-panel w-full">
            <p className="text-muted-foreground font-sans text-sm mb-4">{deckState.message}</p>
            <button
              type="button"
              onClick={() => void reloadDeck()}
              className="btn-solaire px-6 py-2.5 font-cinzel text-xs uppercase tracking-[0.14em]"
            >
              {t("pulse.retry")}
            </button>
          </div>
        )}

        {deckState.status !== "error" && (
          <>
            {localCards.length > 0 ? (
              localCards.map((card, index) => {
                if (index > 2) return null;
                const isTop = index === 0;
                return (
                  <div
                    key={card.id}
                    className="absolute inset-0"
                    style={{
                      transform: !isTop ? `scale(${1 - index * 0.05}) translateY(${index * 12}px)` : "none",
                      zIndex: 10 - index,
                      opacity: 1 - index * 0.28,
                      transition: "all 0.3s ease-out",
                    }}
                  >
                    <SwipeableCard card={card} onSwipe={handleSwipe} isTop={isTop} />
                  </div>
                );
              })
            ) : deckState.status === "ready" || deckState.status === "idle" ? (
              <div className="w-full h-full dashboard-panel flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 mb-4 opacity-25">
                  <SacredGeometry type="MENTALISM" isGlowing={false} />
                </div>
                <h2 className="text-base font-cormorant text-foreground tracking-widest uppercase mb-2">
                  {t("pulse.cycleComplete")}
                </h2>
                <p className="text-muted-foreground font-sans text-xs mb-5 max-w-sm">
                  {t("pulse.cycleCompleteHint")}
                </p>

                {import.meta.env.DEV && diag && diag.total > 0 && !isPulseDeckExhausted(diag) && (
                  <div className="mb-4 p-3 rounded-lg border border-amber-400/20 bg-amber-400/5 max-w-sm text-left">
                    <div className="flex items-center gap-2 text-xs text-amber-400 mb-1">
                      <AlertCircle size={13} />
                      <span className="font-medium">{t("pulse.diagnosticTitle")}</span>
                    </div>
                    <div className="space-y-0.5 text-[10px] text-muted-foreground font-mono">
                      <p>user: {diag.userId ?? "—"}</p>
                      <p>total: {diag.total} | assignées: {diag.forYou} | rpc: {diag.rpcCards}</p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleRecycleIgnored()}
                  disabled={isRecycling}
                  className="btn-solaire px-5 py-2.5 font-cinzel text-xs uppercase tracking-[0.14em] flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isRecycling ? "animate-spin" : ""} />
                  {isRecycling ? t("pulse.recycling") : t("pulse.recycleIgnored")}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Action Controls & Keyboard Hints */}
      <div className="pt-2">
        {localCards.length > 0 ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-8 sm:gap-12">
              <button
                type="button"
                onClick={() => forceSwipe("left")}
                disabled={isSwiping}
                className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border border-white/10 bg-black/40 text-muted-foreground hover:text-[#e9e4d8] hover:border-white/25 transition-all disabled:opacity-30 active:scale-95 shadow-md backdrop-blur-md"
                aria-label={t("pulse.swipeIgnore")}
              >
                <X size={20} strokeWidth={1.5} />
              </button>

              {/* Mobile shortcuts to Grimoire / Runes */}
              <div className="lg:hidden flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView("runes")}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full border border-border-subtle/50"
                  aria-label={t("pulse.runeTrackerTitle")}
                >
                  <Hexagon size={16} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("grimoire")}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full border border-border-subtle/50 relative"
                  aria-label={t("pulse.grimoireTitle")}
                >
                  <Library size={16} strokeWidth={1.5} />
                  {libraryCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent-primary text-primary-foreground text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                      {libraryCount}
                    </span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => forceSwipe("right")}
                disabled={isSwiping}
                className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border border-[#c9a24b]/40 bg-[#c9a24b]/15 text-[#c9a24b] hover:bg-[#c9a24b]/25 hover:border-[#c9a24b]/70 hover:shadow-[0_0_16px_rgba(201,162,75,0.3)] transition-all disabled:opacity-30 active:scale-95 shadow-md backdrop-blur-md"
                aria-label={t("pulse.swipeAssimilate")}
              >
                <CheckCircle2 size={20} strokeWidth={1.5} />
              </button>
            </div>

            <p className="font-mono text-[10px] tracking-wider text-muted-foreground/50 uppercase hidden lg:block">
              [←] Ignorer &bull; [→] Assimiler
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="font-cinzel text-[10px] uppercase tracking-widest text-muted-foreground">
              Toutes les impulsions sont à jour
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const rightCodexPane = (
    <div className="flex flex-col h-full space-y-4">
      {/* Codex Tabs Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCodexTab("grimoire")}
            className={cn(
              "font-cinzel text-xs uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-2",
              codexTab === "grimoire"
                ? "border-[#9e7828]/50 bg-[#9e7828]/10 text-[#9e7828] dark:border-[#c9a24b]/50 dark:bg-[#c9a24b]/15 dark:text-[#c9a24b]"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Library size={14} strokeWidth={1.5} />
            <span>Grimoire</span>
            <span className="font-mono text-[10px] opacity-70">({libraryCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setCodexTab("runes")}
            className={cn(
              "font-cinzel text-xs uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-2",
              codexTab === "runes"
                ? "border-[#9e7828]/50 bg-[#9e7828]/10 text-[#9e7828] dark:border-[#c9a24b]/50 dark:bg-[#c9a24b]/15 dark:text-[#c9a24b]"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Hexagon size={14} strokeWidth={1.5} />
            <span>Runes de Sagesse</span>
            <span className="font-mono text-[10px] opacity-70">
              ({unlockedRunesCount}/{totalRunesCount})
            </span>
          </button>
        </div>
      </div>

      {/* Codex Body */}
      {codexTab === "grimoire" ? (
        <div className="space-y-3">
          {/* Sub-tabs: En cours / Validés */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGrimoireSubTab("in_progress")}
              className={cn(
                "font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border transition-colors",
                grimoireSubTab === "in_progress"
                  ? "border-accent-primary/40 bg-accent-primary/10 text-accent-primary"
                  : "border-border-subtle text-muted-foreground hover:text-foreground",
              )}
            >
              À intégrer ({inProgressCards.length})
            </button>
            <button
              type="button"
              onClick={() => setGrimoireSubTab("validated")}
              className={cn(
                "font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border transition-colors",
                grimoireSubTab === "validated"
                  ? "border-accent-primary/40 bg-accent-primary/10 text-accent-primary"
                  : "border-border-subtle text-muted-foreground hover:text-foreground",
              )}
            >
              Validés ({validatedCards.length})
            </button>
          </div>

          {/* Cards List */}
          {grimoireState.status === "loading" ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-border-subtle border-t-accent-primary rounded-full animate-spin" />
            </div>
          ) : (grimoireSubTab === "in_progress" ? inProgressCards : validatedCards).length === 0 ? (
            <div className="dashboard-panel p-8 text-center space-y-3">
              <BookOpen size={28} strokeWidth={1.25} className="mx-auto text-muted-foreground/30" />
              <p className="font-cormorant text-base text-foreground">
                {grimoireSubTab === "in_progress"
                  ? "Aucun fragment en attente d'intégration"
                  : "Aucun fragment encore validé"}
              </p>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Balayez les cartes vers la droite pour assimiler des fragments de conscience et les inscrire dans votre grimoire.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {(grimoireSubTab === "in_progress" ? inProgressCards : validatedCards).map((item) => (
                <CardRow
                  key={item.id}
                  item={item}
                  onOpenCourse={(c) => setActiveCourse(c)}
                  completed={item.isCourseCompleted}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Glyphs Group Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {glyphGroups.map((g) => {
              const isSelected = activeGroup?.collectionCode === g.collectionCode;
              const isComplete = g.progress >= 1;
              const firstRune = g.runes[0];
              const glyphCode = g.collectionCode === "__none__" ? "AEGIS" : g.collectionCode;
              return (
                <button
                  key={g.collectionCode}
                  type="button"
                  onClick={() => setSelectedGroupCode(g.collectionCode)}
                  className={cn(
                    "aegis-dock-tile p-3.5 rounded-2xl text-left transition-all duration-200 relative group flex flex-col justify-between min-h-[104px]",
                    isSelected
                      ? "border-[#c9a24b]/60 shadow-[0_0_20px_rgba(201,162,75,0.18)]"
                      : "hover:border-[#c9a24b]/30",
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-8 h-8 relative opacity-75 group-hover:opacity-100 transition-opacity">
                      <SacredGeometry
                        type={glyphCode}
                        glowIntensity={g.progress}
                        glyphSvg={firstRune?.glyphSvg}
                      />
                    </div>
                    {isComplete ? (
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/40">
                        <Unlock size={10} />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-black/20 text-muted-foreground flex items-center justify-center border border-border-subtle">
                        <Lock size={10} />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-cinzel text-[10px] font-semibold uppercase tracking-wider text-foreground truncate">
                      {g.collectionName}
                    </p>
                    <p className="font-mono text-[9px] text-[#c9a24b] mt-0.5">
                      {g.unlockedCount}/{g.totalCount} ({Math.round(g.progress * 100)}%)
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Rune Group Detail Card */}
          {activeGroup && (
            <div className="aegis-dock-tile rounded-2xl p-5 space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-cinzel text-[10.5px] uppercase tracking-[0.2em] text-[#9e7828] dark:text-[#c9a24b]">
                    COLLECTION DE RUNES
                  </p>
                  <h3 className="font-cormorant text-xl text-foreground font-light">
                    {activeGroup.collectionName}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {Math.round(activeGroup.progress * 100)}%
                  </span>
                  <p className="font-mono text-[9px] text-muted-foreground uppercase">Déverrouillé</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-black/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#9e7828] to-[#c9a24b] transition-all duration-500"
                  style={{ width: `${Math.round(activeGroup.progress * 100)}%` }}
                />
              </div>

              {/* Runes within this group */}
              <div className="space-y-2 pt-1">
                {activeGroup.runes.map((rune) => (
                  <div
                    key={rune.principleCode}
                    className="aegis-dock-tile rounded-xl p-3 flex items-center justify-between gap-3 hover:border-[#c9a24b]/35 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 shrink-0 opacity-80">
                        <SacredGeometry type={rune.principleCode} isGlowing={rune.isUnlocked} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-cinzel text-xs font-semibold text-foreground truncate">
                          {rune.principleName}
                        </p>
                        <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                          Code: {rune.principleCode}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {rune.isUnlocked ? (
                        <span className="font-cinzel text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                          Initié
                        </span>
                      ) : (
                        <span className="font-cinzel text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-border-subtle text-muted-foreground">
                          {rune.pulsesCount}/{rune.pulsesToUnlock} puls.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <MemberPageScaffold width="wide" viewport className="min-w-0 overflow-x-hidden">
      {/* Mobile Top Navigation Pills (<lg) */}
      <div className="lg:hidden px-4 pt-3 pb-1">
        <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md member-top-dock-margin-end">
          <button
            type="button"
            onClick={() => setActiveView("deck")}
            className={cn(
              "flex-1 min-h-[36px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-cinzel text-[9.5px] font-semibold uppercase tracking-wider transition-all",
              activeView === "deck"
                ? "bg-[#c9a24b] text-[#0b0b0a] shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Sparkles size={12} strokeWidth={1.5} />
            <span className="truncate">Deck ({localCards.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView("grimoire");
              setCodexTab("grimoire");
            }}
            className={cn(
              "flex-1 min-h-[36px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-cinzel text-[9.5px] font-semibold uppercase tracking-wider transition-all",
              activeView === "grimoire"
                ? "bg-[#c9a24b] text-[#0b0b0a] shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Library size={12} strokeWidth={1.5} />
            <span className="truncate">Grimoire ({libraryCount})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView("runes");
              setCodexTab("runes");
            }}
            className={cn(
              "flex-1 min-h-[36px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-cinzel text-[9.5px] font-semibold uppercase tracking-wider transition-all",
              activeView === "runes"
                ? "bg-[#c9a24b] text-[#0b0b0a] shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Hexagon size={12} strokeWidth={1.5} />
            <span className="truncate">Runes ({unlockedRunesCount}/{totalRunesCount})</span>
          </button>
        </div>
      </div>

      {/* Desktop Split View (>=lg) */}
      <div className="hidden lg:contents">
        <MemberSplitLayout
          left={leftDeckPane}
          right={rightCodexPane}
          leftColSpan={6}
          rightColSpan={6}
          scrollRight={true}
        />
      </div>

      {/* Mobile Active View (<lg) */}
      <div className="lg:hidden px-4 pb-[calc(var(--mobile-dock-padding,5rem)+1.5rem)]">
        {activeView === "deck" && <div className="pt-2">{leftDeckPane}</div>}
        {activeView !== "deck" && <div className="pt-2">{rightCodexPane}</div>}
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 sm:top-24 left-1/2 transform -translate-x-1/2 z-50 mx-4 max-w-[calc(100vw-2rem)]"
        >
          <div className="ethereal-glass border border-border-subtle px-4 sm:px-5 py-3 rounded-xl shadow-lg">
            <span className="font-barlow text-[11px] font-medium uppercase tracking-[0.12em] text-foreground">
              {toast}
            </span>
          </div>
        </div>
      )}

      {onboardingOverlay}
    </MemberPageScaffold>
  );
}
