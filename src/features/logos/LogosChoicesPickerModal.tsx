import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  coverFlowCardStyle,
  useCoverFlowDragSwipe,
} from "@/components/ui/cover-flow/coverFlowShelf";
import { cn } from "@/lib/utils";
import {
  LOGOS_DIALOG_CONTENT_Z,
  LOGOS_DIALOG_OVERLAY_CLASS,
} from "@/features/logos/logosDialogStack";

export type LogosChoiceItem =
  | {
      kind: "toolbox";
      id: string;
      title: string;
      subtitle?: string | null;
    }
  | {
      kind: "pulse";
      id: string;
      title: string;
      subtitle?: string | null;
    };

type Props = {
  open: boolean;
  items: LogosChoiceItem[];
  busy: boolean;
  onSelect: (item: LogosChoiceItem) => void;
  onDismiss: () => void;
};

/** Wider shelf than Persona portraits so 2–3 choices breathe. */
const LOGOS_COVER_FLOW = {
  spacingPx: 210,
  rotateDeg: 38,
  depthPx: 110,
} as const;

/** Placeholder paths once artworks land in `public/logos/covers/`. */
export const LOGOS_CHOICE_COVER_PATHS = {
  toolbox: "/logos/covers/toolbox-cover.png",
  pulse: "/logos/covers/pulse-cover.png",
} as const;

function kindLabel(kind: LogosChoiceItem["kind"]) {
  return kind === "toolbox" ? "Toolbox" : "Pulse";
}

export function LogosChoicesPickerModal({ open, items, busy, onSelect, onDismiss }: Props) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const swipeSurfaceRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useEffect(() => {
    if (open) setActiveIndex(0);
  }, [open, items]);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(Math.max(0, items.length - 1));
  }, [items.length, activeIndex]);

  const goTo = useCallback(
    (index: number) => {
      const n = items.length;
      if (n === 0) return;
      setActiveIndex(((index % n) + n) % n);
    },
    [items.length],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useCoverFlowDragSwipe(swipeSurfaceRef, goPrev, goNext);

  const active = items[activeIndex] ?? items[0];

  const confirmActive = () => {
    if (busy || !active) return;
    onSelect(active);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      confirmActive();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !busy) onDismiss();
      }}
    >
      <DialogContent
        showCloseButton={!busy}
        overlayClassName={cn(LOGOS_DIALOG_OVERLAY_CLASS, "bg-[color:var(--aegis-abyss)]/72 dark:bg-black/80")}
        className={cn(
          LOGOS_DIALOG_CONTENT_Z,
          "logos-choices-picker max-w-[min(100vw,56rem)] gap-0 overflow-visible border-[color:var(--aegis-cardline)] p-0 sm:rounded-[1.75rem]",
          "bg-[color:var(--aegis-bg)] text-[color:var(--aegis-ink)] shadow-[0_28px_90px_rgba(0,0,0,0.35)]",
          "dark:bg-[color:var(--aegis-abyss)] dark:shadow-[0_28px_90px_rgba(0,0,0,0.55)]",
        )}
      >
        <DialogHeader className="space-y-2 px-5 pb-1 pt-5 text-center sm:px-8 sm:pt-7">
          <p className="font-display text-[10px] uppercase tracking-[0.22em] text-[color:var(--aegis-ink)] dark:text-[color:var(--aegis-gold)]">
            LOGOS
          </p>
          <DialogTitle className="font-cormorant-display text-center text-[1.85rem] font-light leading-[1.1] tracking-tight text-[color:var(--aegis-ink)] sm:text-[2.15rem]">
            Choisis une pratique
          </DialogTitle>
          <DialogDescription className="mx-auto max-w-md text-center font-quattrocento text-sm leading-relaxed text-[color:var(--aegis-ink-muted)]">
            Tu peux sélectionner ici pendant que LOGOS parle — ça ouvre directement l&apos;exercice.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={swipeSurfaceRef}
          className="touch-pan-y cursor-grab select-none px-2 pb-2 [&.persona-cover-flow--dragging]:cursor-grabbing sm:px-4"
          style={{ touchAction: "pan-y pinch-zoom" }}
        >
          <div
            className="persona-cover-flow-stage relative mx-auto flex w-full max-w-5xl items-center justify-center overflow-x-clip overflow-y-visible py-4 sm:py-8"
            style={{ perspective: "1400px", perspectiveOrigin: "50% 42%" }}
            role="tablist"
            aria-label={t("logos.practiceChoice")}
            tabIndex={0}
            onKeyDown={onKeyDown}
          >
            <div
              className="relative flex h-[min(78vw,28rem)] w-full items-center justify-center sm:h-[min(70vw,30rem)]"
              style={{ transformStyle: "preserve-3d" }}
            >
              {items.map((item, index) => {
                const offset = index - activeIndex;
                const flow = coverFlowCardStyle(offset, reduceMotion, LOGOS_COVER_FLOW);
                const isCenter = offset === 0;
                const isPulse = item.kind === "pulse";

                return (
                  <button
                    key={`${item.kind}:${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isCenter}
                    disabled={busy}
                    onClick={() => {
                      if (!isCenter) {
                        goTo(index);
                        return;
                      }
                      confirmActive();
                    }}
                    className={cn(
                      "persona-cover-flow-card absolute left-1/2 top-1/2 flex w-[min(72vw,18.5rem)] flex-col overflow-hidden rounded-[1.75rem] border p-0 text-left sm:w-[min(58vw,20rem)]",
                      "border-[color:var(--aegis-ink)]/25 dark:border-[color:var(--aegis-gold)]/30",
                      "bg-[color:var(--aegis-surface)] dark:bg-[color:var(--aegis-surface)]",
                      "shadow-[0_16px_48px_rgba(0,0,0,0.28)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.45)]",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--aegis-ink)] dark:focus-visible:outline-[color:var(--aegis-gold)]",
                      "aspect-[3/4] min-h-0 disabled:opacity-60",
                      isCenter &&
                        "border-[color:var(--aegis-ink)]/55 shadow-[0_22px_56px_rgba(20,20,18,0.22)] dark:border-[color:var(--aegis-gold)]/55 dark:shadow-[0_22px_56px_color-mix(in_srgb,var(--aegis-gold)_22%,transparent)]",
                    )}
                    style={flow}
                  >
                    {/* Artwork slot — gradient placeholder until /logos/covers/{toolbox|pulse}-cover.png */}
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-0",
                        isPulse
                          ? "bg-[radial-gradient(120%_80%_at_50%_0%,color-mix(in_srgb,var(--aegis-ink)_18%,transparent),transparent_70%),linear-gradient(165deg,var(--aegis-surface)_0%,var(--aegis-abyss)_100%)] dark:bg-[radial-gradient(120%_80%_at_50%_0%,color-mix(in_srgb,var(--aegis-gold)_28%,transparent),transparent_70%),linear-gradient(165deg,#1e1e1c_0%,#070707_100%)]"
                          : "bg-[radial-gradient(100%_70%_at_20%_10%,color-mix(in_srgb,var(--aegis-ink)_12%,transparent),transparent_60%),linear-gradient(180deg,var(--aegis-surface-elevated)_0%,var(--aegis-bg)_55%,var(--aegis-abyss)_100%)] dark:bg-[radial-gradient(100%_70%_at_20%_10%,color-mix(in_srgb,var(--aegis-gold)_18%,transparent),transparent_60%),linear-gradient(180deg,#1e1e1c_0%,#0b0b0a_55%,#070707_100%)]",
                      )}
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--aegis-abyss)]/90 via-[color:var(--aegis-abyss)]/25 to-transparent dark:from-black/85 dark:via-black/30 dark:to-transparent"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(20,20,18,0.2)] dark:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--aegis-gold)_28%,transparent)]"
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "absolute right-3 top-3 z-[1] rounded-full border px-2.5 py-0.5 font-display text-[8px] uppercase tracking-wider backdrop-blur-sm",
                        "border-[color:var(--aegis-ink)]/20 bg-[color:var(--aegis-surface)]/70 text-[color:var(--aegis-ink)]",
                        "dark:border-[color:var(--aegis-gold)]/35 dark:bg-black/45 dark:text-[color:var(--aegis-ink)]",
                      )}
                    >
                      {kindLabel(item.kind)}
                      {item.subtitle ? ` · ${item.subtitle}` : ""}
                    </span>
                    <div className="relative z-[1] mt-auto flex flex-col p-5 pt-16">
                      <p className="font-cormorant text-[1.85rem] leading-[1.05] text-[color:var(--aegis-ink)] sm:text-[2.15rem] dark:text-[color:var(--aegis-ink)]">
                        {item.title}
                      </p>
                      <p className="mt-2 line-clamp-2 font-display text-[10px] uppercase tracking-[0.2em] text-[color:var(--aegis-ink-muted)]">
                        {item.subtitle || kindLabel(item.kind)}
                      </p>
                      {isCenter ? (
                        <span
                          className={cn(
                            "mt-4 inline-flex w-fit items-center rounded-full border px-3 py-1.5 font-display text-[9px] uppercase tracking-[0.18em] backdrop-blur-sm",
                            "border-[color:var(--aegis-ink)]/35 bg-[color:var(--aegis-ink)]/5 text-[color:var(--aegis-ink)]",
                            "dark:border-[color:var(--aegis-gold)]/50 dark:bg-[color:var(--aegis-gold)]/12 dark:text-[color:var(--aegis-ink)]",
                          )}
                        >
                          {busy ? "Ouverture…" : "Choisir"}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-1 flex items-center justify-center gap-3 px-4 pb-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={busy || items.length < 2}
              className="h-9 w-9 shrink-0 rounded-full border-[color:var(--aegis-cardline)] bg-[color:var(--aegis-surface)] text-[color:var(--aegis-ink)] hover:border-[color:var(--aegis-gold)]/40"
              onClick={goPrev}
              aria-label={t("logos.previousChoice")}
            >
              <ChevronLeft size={18} aria-hidden />
            </Button>
            <div
              className="flex max-w-[min(100%,14rem)] flex-1 flex-wrap items-center justify-center gap-1.5"
              role="presentation"
            >
              {items.map((item, i) => (
                <button
                  key={`${item.kind}:${item.id}:dot`}
                  type="button"
                  disabled={busy}
                  aria-label={item.title}
                  aria-current={i === activeIndex ? "true" : undefined}
                  onClick={() => goTo(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === activeIndex
                      ? "w-5 bg-[color:var(--aegis-ink)] dark:bg-[color:var(--aegis-gold)]"
                      : "w-2 bg-[color:var(--aegis-ink-subtle)]/50 hover:bg-[color:var(--aegis-ink-muted)]",
                  )}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={busy || items.length < 2}
              className="h-9 w-9 shrink-0 rounded-full border-[color:var(--aegis-cardline)] bg-[color:var(--aegis-surface)] text-[color:var(--aegis-ink)] hover:border-[color:var(--aegis-gold)]/40"
              onClick={goNext}
              aria-label={t("logos.nextChoice")}
            >
              <ChevronRight size={18} aria-hidden />
            </Button>
          </div>

          <p className="pb-5 text-center font-cinzel text-[9px] uppercase tracking-[0.22em] text-[color:var(--aegis-ink-subtle)]">
            Glisse · flèches · Entrée pour confirmer
          </p>
        </div>

        <div className="flex justify-center border-t border-[color:var(--aegis-cardline)] px-5 py-3">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            className="font-display text-[10px] uppercase tracking-[0.16em] text-[color:var(--aegis-ink-muted)] hover:text-[color:var(--aegis-ink)]"
            onClick={onDismiss}
          >
            {t("general.cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
