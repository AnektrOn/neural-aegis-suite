import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideToStartProps {
  label: string;
  onComplete: () => void;
  className?: string;
}

export function SlideToStart({ label, onComplete, className }: SlideToStartProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [completed, setCompleted] = useState(false);

  const THRESHOLD = 0.82;

  const finish = () => {
    if (completed) return;
    setCompleted(true);
    onComplete();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (completed) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (completed || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const knob = 48;
    const max = rect.width - knob - 8;
    const x = Math.max(0, Math.min(max, e.clientX - rect.left - 4));
    setDragX(x);
    if (x >= max * THRESHOLD) finish();
  };

  const onPointerUp = () => {
    if (completed) return;
    if (!trackRef.current) return;
    const max = trackRef.current.offsetWidth - 56;
    if (dragX < max * THRESHOLD) setDragX(0);
  };

  return (
    <div
      ref={trackRef}
      className={cn(
        "welcome-slide-track relative h-14 rounded-full select-none touch-none",
        completed && "opacity-70",
        className,
      )}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn(
          "welcome-slide-knob absolute top-1 left-1 flex h-12 w-12 items-center justify-center rounded-full",
          "transition-transform",
          completed && "translate-x-[calc(100%-3.5rem)]",
        )}
        style={completed ? undefined : { transform: `translateX(${dragX}px)` }}
        onPointerDown={onPointerDown}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            finish();
          }
        }}
      >
        <ChevronRight size={20} strokeWidth={1.5} aria-hidden />
      </div>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] uppercase tracking-[0.28em] font-display text-muted-foreground pointer-events-none">
        {label}
      </span>
    </div>
  );
}
