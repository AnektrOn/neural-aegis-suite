import { X, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { GrimoireLoadState, RunePrincipleCode, PulseCard } from "../domain/types";
import { SacredGeometry } from "./SacredGeometry";

const PRINCIPLE_ACCENT: Record<RunePrincipleCode, string> = {
  MENTALISM: "217 91% 60%",
  CORRESPONDENCE: "250 70% 68%",
  VIBRATION: "158 64% 52%",
  POLARITY: "38 92% 56%",
  RHYTHM: "200 80% 60%",
  CAUSE_EFFECT: "0 70% 60%",
  GENDER: "280 60% 65%",
};

interface PulseGrimoireProps {
  state: GrimoireLoadState;
  onClose: () => void;
  onOpenCourse: (card: PulseCard) => void;
}

export function PulseGrimoire({ state, onClose, onOpenCourse }: PulseGrimoireProps) {
  const { t } = useLanguage();

  const library = state.status === "ready" ? state.library : [];
  const runes = state.status === "ready" ? state.runes : [];

  return (
    <div className="min-h-[calc(100vh-8rem)] -m-4 md:-m-6 bg-bg-base rounded-[18px] relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--foreground) / 0.3) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="max-w-2xl mx-auto relative z-10 flex flex-col min-h-[80vh]">
        <div className="px-4 sm:px-5 py-4 flex justify-between items-center border-b border-border-subtle">
          <h1 className="font-barlow text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
            {t("pulse.grimoireTitle")}
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors active:scale-95"
            aria-label={t("pulse.close")}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
          {state.status === "loading" && (
            <div className="py-20 flex justify-center">
              <div className="w-6 h-6 border-2 border-border-subtle border-t-accent-primary rounded-full animate-spin" />
            </div>
          )}

          {state.status === "error" && (
            <p className="text-center text-muted-foreground font-sans text-sm py-20">{state.message}</p>
          )}

          {state.status === "ready" && (
            <>
              <div className="mb-6 sm:mb-8 dashboard-panel p-4 sm:p-5">
                <h2 className="font-barlow text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-5 sm:mb-6 text-center">
                  {t("pulse.runesTitle")}
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 sm:gap-4">
                  {runes.map((rune) => {
                    const accent = PRINCIPLE_ACCENT[rune.principleCode];
                    const progressPercent = Math.min(
                      (rune.pulsesCount / rune.pulsesToUnlock) * 100,
                      100,
                    );
                    return (
                      <div key={rune.principleCode} className="flex flex-col items-center gap-2 sm:gap-3">
                        <div
                          className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 transition-all duration-700 ${
                            rune.isUnlocked ? "" : "opacity-40 grayscale"
                          }`}
                          style={rune.isUnlocked ? { filter: `drop-shadow(0 0 8px hsla(${accent} / 0.45))` } : undefined}
                        >
                          <SacredGeometry type={rune.principleCode} isGlowing={rune.isUnlocked} />
                        </div>
                        <div className="w-8 sm:w-9 md:w-10 h-[2px] bg-border-subtle rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${progressPercent}%`,
                              background: rune.isUnlocked ? `hsl(${accent})` : "hsl(var(--muted-foreground) / 0.3)",
                              boxShadow: rune.isUnlocked ? `0 0 6px hsla(${accent} / 0.6)` : "none",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {library.length === 0 ? (
                <div className="py-12 sm:py-16 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mb-4 sm:mb-5 opacity-15">
                    <SacredGeometry type="MENTALISM" isGlowing={false} />
                  </div>
                  <p className="font-barlow text-[11px] sm:text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {t("pulse.grimoireEmpty")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="dashboard-section-label mb-3 sm:mb-4 flex items-center gap-2">
                    <div className="w-1 h-1 bg-accent-primary rounded-full" />
                    {t("pulse.fragmentsCollected", { count: library.length })}
                  </div>
                  {library.map((item) => {
                    const accent = PRINCIPLE_ACCENT[item.principleCode];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onOpenCourse(item)}
                        className="w-full text-left group card-interactive border p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 min-h-[56px] active:scale-[0.98]"
                      >
                        <div
                          className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                          style={{ filter: `drop-shadow(0 0 6px hsla(${accent} / 0.2))` }}
                        >
                          <SacredGeometry type={item.principleCode} isGlowing />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-cormorant text-text-primary text-sm md:text-base leading-tight truncate">
                            {item.title}
                          </h3>
                          <div className="mt-1 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
                            {item.principleName}
                          </div>
                        </div>
                        <ChevronRight
                          className="text-border-subtle group-hover:text-text-secondary transition-colors shrink-0"
                          size={16}
                          strokeWidth={1.5}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
