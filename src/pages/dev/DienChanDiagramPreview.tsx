import { cn } from "@/lib/utils";
import type { PointCoord } from "./dienChanBqcCoordinates";
import { DIEN_CHAN_FACE_DIAGRAM_PATHS } from "./dienChanFaceDiagramPaths";

type Props = {
  className?: string;
  activePoints: number[];
  pointsCoordinates: Record<number, PointCoord[]>;
  spotlightPointId?: number | null;
  hoveredPoint?: number | null;
};

/** Dev overlay — same 400×450 frame as Moricoli / Notebook LM. */
export function DienChanDiagramPreview({
  className,
  activePoints,
  pointsCoordinates,
  spotlightPointId = null,
  hoveredPoint = null,
}: Props) {
  const active = new Set(activePoints);

  return (
    <div
      className={cn(
        "pointer-events-none absolute right-4 top-14 z-30 overflow-hidden rounded-lg border border-white/20 bg-black/75 shadow-lg backdrop-blur-sm",
        className,
      )}
    >
      <p className="border-b border-white/10 px-2 py-1 font-display text-[8px] uppercase tracking-[0.14em] text-white/45">
        Aperçu 2D · 400×450
      </p>
      <svg viewBox="0 0 400 450" className="block h-auto w-[min(168px,34vw)]" aria-hidden>
        {DIEN_CHAN_FACE_DIAGRAM_PATHS.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={p.fill ?? "none"}
            fillOpacity={p.opacity}
            stroke={p.stroke}
            strokeWidth={p.strokeWidth}
          />
        ))}
        {Object.entries(pointsCoordinates).flatMap(([idStr, coords]) => {
          const id = Number(idStr);
          if (!active.has(id)) return [];
          return coords.map((c, i) => {
            const selected = spotlightPointId === id;
            const hovered = hoveredPoint === id && !selected;
            const hot = selected || hovered;
            return (
              <g key={`${id}-${i}`}>
                {selected && (
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={11}
                    fill="none"
                    stroke="hsl(0 90% 58%)"
                    strokeWidth={2}
                    strokeOpacity={0.75}
                  />
                )}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={selected ? 6 : hot ? 5 : 4}
                  fill={selected ? "hsl(0 88% 52%)" : "hsl(28 88% 50%)"}
                  fillOpacity={hot ? 1 : 0.92}
                  stroke={selected ? "hsl(0 100% 75%)" : "rgba(0,0,0,0.5)"}
                  strokeWidth={selected ? 1.8 : 1.2}
                />
                <text
                  x={c.x}
                  y={c.y - 9}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  fill={selected ? "hsl(0 95% 72%)" : hot ? "hsl(24 95% 65%)" : "rgba(255,255,255,0.55)"}
                >
                  {id}
                </text>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
}
