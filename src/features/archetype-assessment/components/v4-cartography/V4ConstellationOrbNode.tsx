import { memo } from "react";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  x: number;
  y: number;
  sizePx: number;
  hot: boolean;
  dominant?: boolean;
  ariaLabel: string;
  onActivate: (id: string, clientX: number, clientY: number) => void;
  onMove: (clientX: number, clientY: number) => void;
  onDeactivate: (id: string) => void;
}

/** Transparent hit target — WebGL orbs render on shared V4ConstellationOrbCanvas. */
export const V4ConstellationOrbNode = memo(function V4ConstellationOrbNode({
  id,
  x,
  y,
  sizePx,
  hot,
  dominant,
  ariaLabel,
  onActivate,
  onMove,
  onDeactivate,
}: Props) {
  const hit = Math.max(sizePx + 8, 32);

  return (
    <div
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
        dominant && "z-[3]",
        hot && "z-[4]",
      )}
      style={{ left: x, top: y, width: hit, height: hit }}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onMouseEnter={(e) => onActivate(id, e.clientX, e.clientY)}
      onMouseMove={(e) => onMove(e.clientX, e.clientY)}
      onMouseLeave={() => onDeactivate(id)}
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) onActivate(id, t.clientX, t.clientY);
      }}
      onFocus={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onActivate(id, rect.left + rect.width / 2, rect.bottom);
      }}
      onBlur={() => onDeactivate(id)}
    >
      {dominant ? (
        <span
          className="pointer-events-none absolute inset-0 rounded-full border border-white/12"
          aria-hidden
        />
      ) : null}
    </div>
  );
});
