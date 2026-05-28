import { useMemo, useState } from "react";
import { X, ChevronRight, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { GrimoireLoadState, PulseCard } from "../domain/types";
import { getRuneAccent } from "../domain/runeAccent";
import { SacredGeometry } from "./SacredGeometry";

interface PulseGrimoireProps {
  state: GrimoireLoadState;
  onClose: () => void;
  onOpenCourse: (card: PulseCard) => void;
}

type GrimoireTab = "in_progress" | "validated";

function CardRow({ item, onOpenCourse, completed }: { item: PulseCard; onOpenCourse: (card: PulseCard) => void; completed?: boolean }) {
  const accent = getRuneAccent(item.principleCode);
  return (
    <button
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
      {completed ? (
        <CheckCircle2
          className="text-accent-primary shrink-0"
          size={16}
          strokeWidth={1.5}
        />
      ) : (
        <ChevronRight
          className="text-border-subtle group-hover:text-text-secondary transition-colors shrink-0"
          size={16}
          strokeWidth={1.5}
        />
      )}
    </button>
  );
}

export function PulseGrimoire({ state, onClose, onOpenCourse }: PulseGrimoireProps) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<GrimoireTab>("in_progress");

  const library = state.status === "ready" ? state.library : [];
  const inProgress = useMemo(() => library.filter((c) => !c.isCourseCompleted), [library]);
  const validated = useMemo(() => library.filter((c) => c.isCourseCompleted), [library]);

  const activeCards = tab === "in_progress" ? inProgress : validated;

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

      <div className="max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto relative z-10 flex flex-col min-h-[80vh]">
        {/* Header */}
        <div className="px-4 sm:px-5 md:px-6 py-4 flex justify-between items-center border-b border-border-subtle">
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

        {/* Tabs */}
        <div className="px-4 sm:px-5 md:px-6 pt-4 pb-1 flex gap-1">
          <button
            type="button"
            onClick={() => setTab("in_progress")}
            className={`flex-1 py-2.5 rounded-lg font-barlow text-[11px] sm:text-xs font-medium uppercase tracking-[0.14em] transition-all ${
              tab === "in_progress"
                ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/25"
                : "text-muted-foreground hover:text-text-secondary hover:bg-bg-elevated/50 border border-transparent"
            }`}
          >
            {t("pulse.inProgress", { count: inProgress.length })}
          </button>
          <button
            type="button"
            onClick={() => setTab("validated")}
            className={`flex-1 py-2.5 rounded-lg font-barlow text-[11px] sm:text-xs font-medium uppercase tracking-[0.14em] transition-all flex items-center justify-center gap-1.5 ${
              tab === "validated"
                ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/25"
                : "text-muted-foreground hover:text-text-secondary hover:bg-bg-elevated/50 border border-transparent"
            }`}
          >
            <CheckCircle2 size={12} strokeWidth={1.5} />
            {t("pulse.validated", { count: validated.length })}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5 md:p-6 overflow-y-auto">
          {state.status === "loading" && (
            <div className="py-20 flex justify-center">
              <div className="w-6 h-6 border-2 border-border-subtle border-t-accent-primary rounded-full animate-spin" />
            </div>
          )}

          {state.status === "error" && (
            <p className="text-center text-muted-foreground font-sans text-sm py-20">{state.message}</p>
          )}

          {state.status === "ready" && (
            activeCards.length === 0 ? (
              <div className="py-12 sm:py-16 flex flex-col items-center justify-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mb-4 sm:mb-5 opacity-15">
                  <SacredGeometry type="MENTALISM" isGlowing={false} />
                </div>
                <p className="font-barlow text-[11px] sm:text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {tab === "in_progress" ? t("pulse.noInProgress") : t("pulse.grimoireEmpty")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeCards.map((item) => (
                  <CardRow
                    key={item.id}
                    item={item}
                    onOpenCourse={onOpenCourse}
                    completed={tab === "validated"}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
