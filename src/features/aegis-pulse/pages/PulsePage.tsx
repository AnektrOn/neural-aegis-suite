import { useCallback, useEffect, useState } from "react";
import { Library, X, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PulseCard, SwipeAction } from "../domain/types";
import { recordPulseSwipe, recyclePulseIgnored, fetchPulseDiagnostic, type PulseDiagnostic } from "../services/pulseService";
import { usePulseDeck } from "../hooks/usePulseDeck";
import { usePulseGrimoire } from "../hooks/usePulseGrimoire";
import { SwipeableCard } from "../components/SwipeableCard";
import { PulseGrimoire } from "../components/PulseGrimoire";
import { PulseCourseView } from "../components/PulseCourseView";
import { SacredGeometry } from "../components/SacredGeometry";

export default function PulsePage() {
  const { t } = useLanguage();
  const { state: deckState, reload: reloadDeck } = usePulseDeck();
  const { state: grimoireState, reload: reloadGrimoire } = usePulseGrimoire();

  const [localCards, setLocalCards] = useState<PulseCard[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [activeCourse, setActiveCourse] = useState<PulseCard | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isRecycling, setIsRecycling] = useState(false);
  const [diag, setDiag] = useState<PulseDiagnostic | null>(null);

  useEffect(() => {
    if (deckState.status === "ready") {
      setLocalCards(deckState.cards);
      if (deckState.cards.length === 0) {
        fetchPulseDiagnostic().then(setDiag);
      } else {
        setDiag(null);
      }
    }
  }, [deckState]);

  const libraryCount =
    grimoireState.status === "ready" ? grimoireState.library.length : 0;

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

      if (!result.ok) {
        showNotification(result.error);
        setIsSwiping(false);
        return;
      }

      if (action === "assimilated") {
        if (result.runeUnlocked && result.principleCode) {
          const runeName =
            grimoireState.status === "ready"
              ? grimoireState.runes.find((r) => r.principleCode === result.principleCode)
                  ?.principleName ?? card.principleName
              : card.principleName;
          showNotification(t("pulse.runeUnlocked", { name: runeName }));
        } else {
          showNotification(t("pulse.fragmentAssimilated"));
        }
      }

      setLocalCards((prev) => prev.filter((c) => c.id !== card.id));
      await Promise.all([reloadDeck(), reloadGrimoire()]);
      setIsSwiping(false);
    },
    [isSwiping, grimoireState, reloadDeck, reloadGrimoire, showNotification, t],
  );

  const forceSwipe = (direction: "left" | "right") => {
    if (localCards.length === 0 || isSwiping) return;
    void handleSwipe(direction, localCards[0]);
  };

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

  if (activeCourse) {
    return (
      <PulseCourseView
        card={activeCourse}
        onClose={() => setActiveCourse(null)}
        onComplete={() => {
          setActiveCourse(null);
          showNotification(t("pulse.wisdomIntegrated"));
        }}
      />
    );
  }

  if (showLibrary) {
    return (
      <PulseGrimoire
        state={grimoireState}
        onClose={() => setShowLibrary(false)}
        onOpenCourse={(card) => {
          setShowLibrary(false);
          setActiveCourse(card);
        }}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-bg-base flex flex-col relative overflow-hidden -m-4 md:-m-6 rounded-[18px]">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--foreground) / 0.35) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] max-w-[700px] max-h-[700px] rounded-full blur-[100px] pointer-events-none bg-[hsla(var(--neural-glow)/0.04)]" />

      <nav className="w-full px-4 sm:px-5 py-4 flex justify-between items-center z-50 relative">
        <div className="w-11 h-11" />
        <h1 className="font-barlow text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
          {t("pulse.title")}
        </h1>
        <button
          type="button"
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors relative rounded-full"
          onClick={() => setShowLibrary(true)}
          aria-label={t("pulse.grimoireTitle")}
        >
          <Library size={20} strokeWidth={1.5} />
          {libraryCount > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-accent-primary text-primary-foreground text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">
              {libraryCount}
            </span>
          )}
        </button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 sm:px-6 w-full max-w-md md:max-w-lg mx-auto pb-10">
        {deckState.status === "loading" && localCards.length === 0 && (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 border-2 border-border-subtle border-t-accent-primary rounded-full animate-spin" />
          </div>
        )}

        {deckState.status === "error" && (
          <div className="text-center p-8">
            <p className="text-muted-foreground font-sans text-sm mb-4">{deckState.message}</p>
            <button
              type="button"
              onClick={() => void reloadDeck()}
              className="dashboard-cta--inline dashboard-cta px-6 py-3 font-barlow text-xs uppercase tracking-[0.14em]"
            >
              {t("pulse.retry")}
            </button>
          </div>
        )}

        {deckState.status !== "error" && (
          <div className="relative w-full aspect-[3/4] max-h-[500px] sm:max-h-[550px] md:max-h-[600px]">
            {localCards.length > 0 ? (
              localCards.map((card, index) => {
                if (index > 2) return null;
                const isTop = index === 0;
                return (
                  <div
                    key={card.id}
                    className="absolute inset-0"
                    style={{
                      transform: !isTop
                        ? `scale(${1 - index * 0.05}) translateY(${index * 12}px)`
                        : "none",
                      zIndex: 10 - index,
                      opacity: 1 - index * 0.3,
                      transition: "all 0.3s ease-out",
                    }}
                  >
                    <SwipeableCard card={card} onSwipe={handleSwipe} isTop={isTop} />
                  </div>
                );
              })
            ) : deckState.status === "ready" || deckState.status === "idle" ? (
              <div className="absolute inset-0 dashboard-panel flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mb-5 sm:mb-6 opacity-20">
                  <SacredGeometry type="MENTALISM" isGlowing={false} />
                </div>
                <h2 className="text-base sm:text-lg font-cormorant text-text-primary tracking-widest uppercase mb-3">
                  {t("pulse.cycleComplete")}
                </h2>
                <p className="text-muted-foreground font-sans text-xs sm:text-sm mb-6">
                  {t("pulse.cycleCompleteHint")}
                </p>

                {/* Diagnostic info when cards exist but none are visible */}
                {diag && diag.total > 0 && (
                  <div className="mb-5 p-3 rounded-lg border border-amber-400/20 bg-amber-400/5 max-w-sm text-left">
                    <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
                      <AlertCircle size={13} />
                      <span className="font-medium">{t("pulse.diagnosticTitle")}</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-muted-foreground leading-relaxed font-mono">
                      <p>user: {diag.userId ?? "—"}</p>
                      <p>cartes en base: {diag.total} ({diag.active} actives)</p>
                      <p>pour vous (ciblage): {diag.forYou}</p>
                      <p>RPC deck retourne: {diag.rpcCards}</p>
                      <p>déjà swipées: {diag.swiped}</p>
                      {diag.sampleKeys.length > 0 && (
                        <p className="break-all">clés: {diag.sampleKeys.join(", ")}</p>
                      )}
                      {diag.rpcError && (
                        <p className="text-red-400">RPC: {diag.rpcError}</p>
                      )}
                    </div>
                    {diag.userId && diag.forYou === 0 && diag.active > 0 && (
                      <p className="text-[11px] text-amber-400 mt-2 leading-relaxed">
                        Aucune carte ne vous est assignée. Votre UUID ne correspond pas au target_user_ids des cartes en base.
                      </p>
                    )}
                    {diag.forYou > 0 && diag.rpcCards === 0 && diag.swiped === 0 && !diag.rpcError && (
                      <p className="text-[11px] text-amber-400 mt-2 leading-relaxed">
                        Des cartes vous sont assignées mais le RPC ne les retourne pas — vérifiez que la migration 120700 est appliquée.
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleRecycleIgnored()}
                  disabled={isRecycling}
                  className="dashboard-cta--inline dashboard-cta px-6 py-3 font-barlow text-xs uppercase tracking-[0.14em] flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isRecycling ? "animate-spin" : ""} />
                  {isRecycling ? t("pulse.recycling") : t("pulse.recycleIgnored")}
                </button>
              </div>
            ) : null}
          </div>
        )}

        {localCards.length > 0 && (
          <div className="flex items-center justify-center gap-10 sm:gap-12 mt-6 sm:mt-8">
            <button
              type="button"
              onClick={() => forceSwipe("left")}
              disabled={isSwiping}
              className="w-12 h-12 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary hover:border-muted-foreground transition-all disabled:opacity-30 active:scale-95"
              aria-label={t("pulse.swipeIgnore")}
            >
              <X size={22} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-accent-primary transition-colors rounded-full"
              aria-label={t("pulse.grimoireTitle")}
            >
              <div className="w-2 h-2 bg-accent-primary rounded-full shadow-[0_0_8px_hsla(var(--primary)/0.5)]" />
            </button>
            <button
              type="button"
              onClick={() => forceSwipe("right")}
              disabled={isSwiping}
              className="w-12 h-12 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-accent-primary hover:bg-accent-primary/10 hover:border-accent-primary/30 transition-all disabled:opacity-30 active:scale-95"
              aria-label={t("pulse.swipeAssimilate")}
            >
              <CheckCircle2 size={22} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed top-20 sm:top-24 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 mx-4 max-w-[calc(100vw-2rem)]">
          <div className="ethereal-glass border border-border-subtle px-4 sm:px-5 py-3 rounded-xl shadow-lg">
            <span className="font-barlow text-[11px] font-medium uppercase tracking-[0.12em] text-text-primary">
              {toast}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
