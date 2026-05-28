import { useEffect, useRef, useState } from "react";
import { FileText, RotateCw, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PulseCard } from "../domain/types";
import { getRuneAccent } from "../domain/runeAccent";
import { SacredGeometry } from "./SacredGeometry";

interface SwipeableCardProps {
  card: PulseCard;
  onSwipe: (direction: "left" | "right", card: PulseCard) => void;
  isTop: boolean;
}

export function SwipeableCard({ card, onSwipe, isTop }: SwipeableCardProps) {
  const { t } = useLanguage();
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const accent = getRuneAccent(card.principleCode);

  const SWIPE_THRESHOLD = typeof window !== "undefined" && window.innerWidth < 400 ? 80 : 120;
  const ROTATION_MULTIPLIER = 0.05;

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isTop) return;
    const target = e.target as HTMLElement;
    if (target.closest(".no-drag")) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !isTop) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const triggerSwipe = (direction: "left" | "right") => {
    setExitDirection(direction);
    setTimeout(() => onSwipe(direction, card), 300);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset.x > SWIPE_THRESHOLD) triggerSwipe("right");
    else if (dragOffset.x < -SWIPE_THRESHOLD) triggerSwipe("left");
    else setDragOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (isTop && cardRef.current) {
      (cardRef.current as HTMLDivElement & { forceSwipe?: (d: "left" | "right") => void }).forceSwipe =
        triggerSwipe;
    }
  }, [isTop, card.id]);

  let swipeTransform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * ROTATION_MULTIPLIER}deg)`;
  let transition = isDragging ? "none" : "transform 0.3s ease-out";

  if (exitDirection === "right") {
    swipeTransform = `translate3d(150vw, ${dragOffset.y}px, 0) rotate(30deg)`;
  } else if (exitDirection === "left") {
    swipeTransform = `translate3d(-150vw, ${dragOffset.y}px, 0) rotate(-30deg)`;
  }

  const likeOpacity = Math.min(Math.max(dragOffset.x / SWIPE_THRESHOLD, 0), 1);
  const nopeOpacity = Math.min(Math.max(-dragOffset.x / SWIPE_THRESHOLD, 0), 1);

  const handleFlip = () => {
    if (Math.abs(dragOffset.x) < 5 && Math.abs(dragOffset.y) < 5) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`absolute w-full h-full will-change-transform ${isTop ? "z-20" : "z-10"}`}
      style={{ transform: swipeTransform, transition, touchAction: "none" }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
    >
      <div
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
      >
        <div
          className="w-full h-full transition-transform duration-500 rounded-[18px] relative"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ── RECTO ── */}
          <div
            className="absolute inset-0 w-full h-full rounded-[18px] overflow-hidden flex flex-col bg-bg-surface border border-border-subtle select-none"
            style={{
              backfaceVisibility: "hidden",
              boxShadow: `0 4px 28px hsl(0 0% 0% / 0.32), 0 0 24px hsla(${accent} / 0.06), inset 0 1px 0 hsl(var(--foreground) / 0.04)`,
            }}
          >
            {isTop && (
              <>
                <div
                  className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center transition-opacity duration-150"
                  style={{ opacity: likeOpacity, background: `hsla(${accent} / 0.06)` }}
                >
                  <div
                    className="font-cormorant tracking-widest text-2xl sm:text-3xl rounded-xl px-5 sm:px-6 py-2 rotate-[-15deg] backdrop-blur-md"
                    style={{
                      border: `1px solid hsl(var(--primary) / 0.5)`,
                      color: "hsl(var(--primary))",
                      background: "hsl(var(--background) / 0.7)",
                    }}
                  >
                    {t("pulse.swipeAssimilate")}
                  </div>
                </div>
                <div
                  className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center transition-opacity duration-150"
                  style={{ opacity: nopeOpacity, background: "hsl(var(--background) / 0.4)" }}
                >
                  <div className="font-cormorant tracking-widest text-2xl sm:text-3xl text-muted-foreground rounded-xl px-5 sm:px-6 py-2 rotate-[15deg] border border-border-subtle backdrop-blur-md bg-bg-base/70">
                    {t("pulse.swipeIgnore")}
                  </div>
                </div>
              </>
            )}

            <div className="px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center relative">
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{ background: `linear-gradient(135deg, hsla(${accent} / 0.4), transparent 60%)` }}
              />
              <span className="relative font-barlow text-[10px] font-medium uppercase tracking-[0.14em] px-2.5 sm:px-3 py-1 rounded-full bg-bg-elevated/50 text-text-secondary border border-border-subtle">
                {card.principleName}
              </span>
              <div className="relative font-mono text-[10px] tracking-widest px-2 py-1 rounded-md bg-bg-elevated/50 text-muted-foreground">
                {card.timeLabel}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative">
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{ background: `radial-gradient(circle at 50% 40%, hsla(${accent} / 0.5), transparent 70%)` }}
              />
              <div
                className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-48 lg:h-48 mb-5 sm:mb-8"
                style={{ filter: `drop-shadow(0 0 18px rgba(251,191,36,0.25))` }}
              >
                <SacredGeometry type={card.principleCode} glowIntensity={1} />
              </div>
              <h2 className="font-cormorant text-lg sm:text-xl md:text-2xl lg:text-[26px] text-center leading-tight mb-2 text-text-primary">
                {card.title}
              </h2>
              <div className="w-10 h-[1px] mt-3 sm:mt-4 mb-2" style={{ background: `hsla(${accent} / 0.25)` }} />
            </div>

            <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-t border-border-subtle flex justify-center items-center bg-bg-base/40 gap-2 text-muted-foreground">
              <RotateCw size={13} className="animate-pulse" />
              <span className="font-barlow text-[10px] font-medium uppercase tracking-[0.14em]">
                {t("pulse.reveal")}
              </span>
            </div>
          </div>

          {/* ── VERSO ── */}
          <div
            className="absolute inset-0 w-full h-full rounded-[18px] overflow-hidden flex flex-col bg-bg-surface border border-border-subtle select-none"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex justify-between items-start border-b border-border-subtle bg-bg-base/50">
              <span className="font-barlow text-[11px] sm:text-xs font-medium uppercase tracking-[0.14em] text-text-secondary">
                {card.principleName}
              </span>
              <div className="flex items-center gap-1 font-mono text-[9px] tracking-widest text-muted-foreground border border-border-subtle px-2 py-1 rounded-sm bg-bg-elevated/50">
                <FileText size={10} /> {card.format}
              </div>
            </div>

            <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-1 flex flex-col overflow-y-auto relative">
              <div className="mb-6 sm:mb-8">
                <h3 className="font-barlow text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-2 sm:mb-3">
                  {t("pulse.question")}
                </h3>
                <p className="text-sm sm:text-base text-text-primary font-cormorant italic leading-relaxed border-l pl-3 sm:pl-4" style={{ borderColor: `hsla(${accent} / 0.3)` }}>
                  &ldquo;{card.problem}&rdquo;
                </p>
              </div>

              <div className="flex-1">
                <h3 className="font-barlow text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-3 sm:mb-4">
                  {t("pulse.teaching")}
                </h3>
                <ul className="space-y-3 sm:space-y-3.5">
                  {card.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 sm:gap-3 text-[13px] sm:text-sm text-text-secondary font-sans leading-relaxed">
                      <div
                        className="mt-1.5 min-w-[4px] w-[4px] h-[4px] shrink-0 rounded-full"
                        style={{ background: `hsl(${accent})`, boxShadow: `0 0 5px hsla(${accent} / 0.6)` }}
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-bg-base/60 rounded-xl border border-border-subtle text-center">
                <p className="text-[11px] sm:text-xs font-cormorant text-muted-foreground italic">
                  &laquo; {card.principleQuote} &raquo;
                </p>
              </div>
            </div>

            <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-t border-border-subtle flex justify-between items-center bg-bg-base/40 gap-2 text-muted-foreground">
              <span className="flex items-center gap-2 font-barlow text-[10px] font-medium uppercase tracking-[0.14em]">
                <ArrowRight size={13} /> {t("pulse.decide")}
              </span>
              <RotateCw size={13} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
