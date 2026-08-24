import { memo } from "react";
import { cn } from "@/lib/utils";
import type { OrbZone } from "./v4CartographyUtils";

interface Props {
  id: string;
  x: number;
  y: number;
  sizePx: number;
  color: string;
  zone: OrbZone;
  hot: boolean;
  selected?: boolean;
  dominant?: boolean;
  quiet?: boolean;
  touch?: boolean;
  allowHover?: boolean;
  flow?: boolean;
  ariaLabel: string;
  onHover: (id: string) => void;
  onLeave: (id: string) => void;
  onSelect: (id: string) => void;
}

/** Clinical HUD node — ring + core. Details live in the dock, not on the node. */
export const V4ConstellationOrbNode = memo(function V4ConstellationOrbNode({
  id,
  x,
  y,
  sizePx,
  color,
  zone,
  hot,
  selected,
  dominant,
  quiet,
  touch,
  allowHover = true,
  flow,
  ariaLabel,
  onHover,
  onLeave,
  onSelect,
}: Props) {
  const visual = Math.max(sizePx, touch ? 30 : 36);
  const hit = Math.max(visual, 44);

  return (
    <div
      className={cn(
        flow ? "relative flex shrink-0 items-center justify-center" : "absolute z-10 -translate-x-1/2 -translate-y-1/2",
        !flow && dominant && "z-[11]",
        !flow && (hot || selected) && "z-[12]",
      )}
      style={{
        width: hit,
        height: hit,
        ...(flow ? undefined : { left: x, top: y }),
      }}
    >
      <button
        type="button"
        data-slot="v4-hud-node"
        className={cn(
          "v4-hud-node",
          flow ? "v4-hud-node-flow" : "absolute left-1/2 top-1/2",
          `v4-hud-node-${zone}`,
          hot && "is-hot",
          selected && "is-selected",
          dominant && "is-dominant",
          quiet && !hot && !selected && "is-quiet",
        )}
        style={{ color, width: visual, height: visual }}
        aria-label={ariaLabel}
        aria-pressed={selected}
        onMouseEnter={() => {
          if (allowHover) onHover(id);
        }}
        onMouseLeave={() => {
          if (allowHover) onLeave(id);
        }}
        onFocus={() => {
          if (allowHover) onHover(id);
        }}
        onBlur={() => {
          if (allowHover) onLeave(id);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
      >
        <span className="v4-hud-node-ring" aria-hidden />
      </button>
    </div>
  );
});
