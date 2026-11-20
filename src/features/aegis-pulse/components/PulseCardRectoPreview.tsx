import { useCallback, useEffect, useState } from "react";
import { ArrowRight, FileText, RotateCw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import type { PulseCard } from "../domain/types";
import { getRuneAccent } from "../domain/runeAccent";
import { SacredGeometry } from "./SacredGeometry";
import { cn } from "@/lib/utils";

type Props = {
  card: PulseCard;
  className?: string;
  /** Click or footer to flip recto ↔ verso. */
  flipable?: boolean;
};

const faceShell =
  "absolute inset-0 flex h-full w-full flex-col overflow-hidden rounded-[1.35rem] border border-border/25 bg-bg-base shadow-[0_12px_40px_rgba(0,0,0,0.35)]";

/** Pulse deck card preview with optional 3D flip (recto / verso). */
export function PulseCardRectoPreview({ card, className, flipable = true }: Props) {
  const { t } = useLanguage();
  const { reduceMotion } = useAegisMotion();
  const accent = getRuneAccent(card.principleCode);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [card.id]);

  const toggleFlip = useCallback(() => {
    if (!flipable) return;
    setIsFlipped((f) => !f);
  }, [flipable]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!flipable) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggleFlip();
    }
  };

  const flipTransition = reduceMotion ? "none" : "transform 0.5s ease-out";

  return (
    <div
      className={cn("relative aspect-[3/4] w-full min-h-0 select-none", className)}
      role={flipable ? "group" : undefined}
      aria-label={card.title}
      tabIndex={flipable ? 0 : undefined}
      onKeyDown={onKeyDown}
    >
      {!flipable ? (
        <div className={cn(faceShell, "relative")}>
          <RectoFace card={card} accent={accent} />
        </div>
      ) : (
        <div
          className="h-full w-full cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={toggleFlip}
        >
          <div
            className="relative h-full w-full"
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transition: flipTransition,
            }}
          >
            <div className={faceShell} style={{ backfaceVisibility: "hidden" }}>
              <RectoFace card={card} accent={accent} />
              <FlipFooter label={t("pulse.reveal")} variant="recto" onFlip={toggleFlip} />
            </div>
            <div
              className={faceShell}
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <VersoFace card={card} accent={accent} t={t} />
              <FlipFooter label={t("pulse.reveal")} variant="verso" onFlip={toggleFlip} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FlipFooter({
  label,
  variant,
  onFlip,
}: {
  label: string;
  variant: "recto" | "verso";
  onFlip: () => void;
}) {
  const { reduceMotion } = useAegisMotion();
  const { t } = useLanguage();

  return (
    <button
      type="button"
      className={cn(
        "flex w-full shrink-0 items-center gap-2 border-t border-border-subtle bg-bg-base/40 px-4 py-2.5 text-muted-foreground",
        "font-barlow text-[10px] font-medium uppercase tracking-[0.14em]",
        variant === "verso" ? "justify-between" : "justify-center",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onFlip();
      }}
    >
      {variant === "verso" ? (
        <>
          <span className="flex items-center gap-2">
            <ArrowRight size={13} aria-hidden /> {t("pulse.decide")}
          </span>
          <RotateCw size={13} aria-hidden />
        </>
      ) : (
        <>
          <RotateCw size={13} className={reduceMotion ? undefined : "animate-pulse"} aria-hidden />
          {label}
        </>
      )}
    </button>
  );
}

function RectoFace({ card, accent }: { card: PulseCard; accent: string }) {
  return (
    <>
      <div className="relative flex shrink-0 items-center justify-between px-4 py-3">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ background: `linear-gradient(135deg, hsla(${accent} / 0.4), transparent 60%)` }}
        />
        <span className="relative font-barlow text-[10px] font-medium uppercase tracking-[0.14em] px-2.5 py-1 rounded-full bg-bg-elevated/50 text-text-secondary border border-border-subtle">
          {card.principleName}
        </span>
        <div className="relative font-mono text-[10px] tracking-widest px-2 py-1 rounded-md bg-bg-elevated/50 text-muted-foreground">
          {card.timeLabel}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center p-4">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ background: `radial-gradient(circle at 50% 40%, hsla(${accent} / 0.5), transparent 70%)` }}
        />
        <div
          className="mb-4 h-[clamp(5.5rem,28vw,8.5rem)] w-[clamp(5.5rem,28vw,8.5rem)] shrink-0"
          style={{ filter: "drop-shadow(0 0 18px rgba(251,191,36,0.25))" }}
        >
          <SacredGeometry type={card.principleCode} glowIntensity={1} />
        </div>
        <h2 className="px-2 text-center font-cormorant text-lg leading-tight text-text-primary sm:text-xl">
          {card.title}
        </h2>
        <span
          className="mt-3 mb-1 h-px w-10"
          style={{ background: `hsla(${accent} / 0.25)` }}
          aria-hidden
        />
      </div>
    </>
  );
}

function VersoFace({
  card,
  accent,
  t,
}: {
  card: PulseCard;
  accent: string;
  t: (key: string) => string;
}) {
  return (
    <>
      <div className="flex shrink-0 items-start justify-between border-b border-border-subtle bg-bg-base/50 px-4 pb-3 pt-4">
        <span className="font-barlow text-[10px] font-medium uppercase tracking-[0.14em] text-text-secondary">
          {card.principleName}
        </span>
        <div className="flex items-center gap-1 rounded-sm border border-border-subtle bg-bg-elevated/50 px-2 py-1 font-mono text-[9px] tracking-widest text-muted-foreground">
          <FileText size={10} aria-hidden /> {card.format}
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5">
          <h3 className="mb-2 font-barlow text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {t("pulse.question")}
          </h3>
          <p
            className="border-l pl-3 font-cormorant text-sm italic leading-relaxed text-text-primary"
            style={{ borderColor: `hsla(${accent} / 0.3)` }}
          >
            &ldquo;{card.problem}&rdquo;
          </p>
        </div>

        <div>
          <h3 className="mb-3 font-barlow text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {t("pulse.teaching")}
          </h3>
          <ul className="space-y-2.5">
            {card.bullets.map((bullet, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-[13px] leading-relaxed text-text-secondary"
              >
                <span
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                  style={{
                    background: `hsl(${accent})`,
                    boxShadow: `0 0 5px hsla(${accent} / 0.6)`,
                  }}
                />
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 rounded-xl border border-border-subtle bg-bg-base/60 p-3 text-center">
          <p className="font-cormorant text-[11px] italic text-muted-foreground">
            &laquo; {card.principleQuote} &raquo;
          </p>
        </div>
      </div>
    </>
  );
}