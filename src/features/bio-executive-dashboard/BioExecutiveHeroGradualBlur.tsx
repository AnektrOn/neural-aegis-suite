import { cn } from "@/lib/utils";
import { useRef } from "react";
import { overlayBoxStyle, type HeroOverlayEscapeBox, type HeroSilhouetteOverlay } from "./bioExecutiveHeroLabConfig";

type BioExecutiveHeroGradualBlurProps = {
  overlay: HeroSilhouetteOverlay;
  overlayHost?: "figure" | "column-escape";
  columnEscapeBox?: HeroOverlayEscapeBox | null;
  overlayRootRef?: React.MutableRefObject<HTMLDivElement | null>;
  overlayShellClassName?: string;
  heroLab: boolean;
  selected: boolean;
  onSelect: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
};

function tintBackground(overlay: HeroSilhouetteOverlay, opacityPct: number): string {
  const a = opacityPct / 100;
  switch (overlay.tint) {
    case "dark":
      return `color-mix(in srgb, var(--bio-hero-surface, var(--bio-column)) ${opacityPct}%, transparent)`;
    case "light":
      return `rgba(255, 255, 255, ${a * 0.35})`;
    case "none":
      return "transparent";
    case "frame":
    default:
      return `color-mix(in srgb, var(--bio-hero-surface, var(--bio-frame)) ${opacityPct}%, transparent)`;
  }
}

/** CSS gradient axis: 0% = blur-min side, 100% = blur-max side. */
function gradientDirection(direction: HeroSilhouetteOverlay["gradualDirection"]): string {
  switch (direction) {
    case "top":
      return "to top";
    case "bottom":
      return "to bottom";
    case "left":
      return "to left";
    case "right":
      return "to right";
    default:
      return "to bottom";
  }
}

function stripCount(overlay: HeroSilhouetteOverlay): number {
  return Math.min(16, Math.max(4, Math.round(overlay.gradualLayers)));
}

/** 0 = blur-min side, 1 = blur-max side along the gradient axis. */
function stripProgress(
  direction: HeroSilhouetteOverlay["gradualDirection"],
  index: number,
  total: number,
): number {
  const along = index / Math.max(1, total - 1);
  switch (direction) {
    case "top":
    case "left":
      return 1 - along;
    case "bottom":
    case "right":
    default:
      return along;
  }
}

function stripClipPath(
  direction: HeroSilhouetteOverlay["gradualDirection"],
  index: number,
  total: number,
): string {
  const i = index / total;
  const end = (index + 1) / total;
  switch (direction) {
    case "left":
      return `inset(0 ${(1 - end) * 100}% 0 ${i * 100}%)`;
    case "right":
      return `inset(0 ${i * 100}% 0 ${(1 - end) * 100}%)`;
    case "top":
      return `inset(${(1 - end) * 100}% 0 ${i * 100}% 0)`;
    case "bottom":
    default:
      return `inset(${i * 100}% 0 ${(1 - end) * 100}% 0)`;
  }
}

function stripBlurPx(overlay: HeroSilhouetteOverlay, index: number, total: number): number {
  const t = stripProgress(overlay.gradualDirection, index, total);
  return overlay.blurMinPx + t * (overlay.blurMaxPx - overlay.blurMinPx);
}

/**
 * Progressive blur: one backdrop at max strength, revealed via gradient mask (multi-band
 * backdrop layers stack to a uniform blur when band masks overlap).
 */
function gradualRevealMask(overlay: HeroSilhouetteOverlay): string {
  const dir = gradientDirection(overlay.gradualDirection);
  if (overlay.blurMaxPx <= 0) return "none";
  const startAlpha =
    overlay.blurMaxPx <= overlay.blurMinPx
      ? 1
      : Math.min(1, Math.max(0, overlay.blurMinPx / overlay.blurMaxPx));
  if (startAlpha >= 0.999) {
    return `linear-gradient(${dir}, black 0%, black 100%)`;
  }
  return `linear-gradient(${dir}, rgba(0,0,0,${startAlpha.toFixed(3)}) 0%, rgba(0,0,0,1) 100%)`;
}

function gradualTintGradient(overlay: HeroSilhouetteOverlay): string {
  const dir = gradientDirection(overlay.gradualDirection);
  const min = tintBackground(overlay, overlay.opacityMinPct);
  const max = tintBackground(overlay, overlay.opacityMaxPct);
  return `linear-gradient(${dir}, ${min} 0%, ${max} 100%)`;
}

/** Minimal fill so backdrop-filter applies consistently in WebKit. */
const BLUR_LAYER_FILL = "rgba(255, 255, 255, 0.001)";

export function BioExecutiveHeroGradualBlur({
  overlay,
  overlayHost = "figure",
  columnEscapeBox = null,
  overlayRootRef,
  overlayShellClassName,
  heroLab,
  selected,
  onSelect,
  onPointerDown,
}: BioExecutiveHeroGradualBlurProps) {
  const host: "figure" | "column-escape" =
    overlay.columnFullWidth && overlayHost === "column-escape" ? "column-escape" : "figure";
  const boxStyle = overlayBoxStyle(overlay, host, columnEscapeBox);
  const rootRef = useRef<HTMLDivElement>(null);
  const applyVisualEffects = overlay.enabled || (heroLab && selected);
  const revealMask =
    overlay.blurMode === "gradual" && overlay.blurMaxPx > 0 ? gradualRevealMask(overlay) : "none";
  const strips = overlay.blurMode === "gradual" ? stripCount(overlay) : 0;

  const assignRootRef = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (overlayRootRef) overlayRootRef.current = node;
  };

  const ring =
    heroLab && selected ? "ring-1 ring-[hsl(var(--aegis-warm))] ring-offset-2 ring-offset-transparent" : "";

  const shellClass = cn(
    "aegis-bio-exec-lab__hero-overlay-root absolute overflow-hidden pointer-events-none",
    heroLab && selected && "pointer-events-auto",
    overlayShellClassName ?? "z-[2]",
    heroLab && selected && "border border-[color:var(--bio-frame-border)]/35",
    heroLab && "cursor-grab touch-none active:cursor-grabbing",
    !heroLab && "pointer-events-none",
    ring,
    !overlay.enabled && heroLab && "border-dashed opacity-45",
  );

  if (overlay.blurMode === "uniform") {
    return (
      <div ref={assignRootRef} style={boxStyle} onClick={onSelect} onPointerDown={onPointerDown} className={shellClass}>
        {applyVisualEffects ? (
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: overlay.blurMaxPx > 0 ? `blur(${overlay.blurMaxPx}px)` : undefined,
              WebkitBackdropFilter: overlay.blurMaxPx > 0 ? `blur(${overlay.blurMaxPx}px)` : undefined,
              background: tintBackground(overlay, overlay.opacityMaxPct),
            }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div ref={assignRootRef} style={boxStyle} onClick={onSelect} onPointerDown={onPointerDown} className={shellClass}>
      {applyVisualEffects && overlay.blurMaxPx > 0
        ? Array.from({ length: strips }).map((_, index) => {
            const blur = stripBlurPx(overlay, index, strips);
            const clip = stripClipPath(overlay.gradualDirection, index, strips);
            return (
              <div
                key={index}
                data-bio-blur-strip
                className="pointer-events-none absolute inset-0"
                style={{
                  clipPath: clip,
                  WebkitClipPath: clip,
                  backdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
                  WebkitBackdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
                  background: BLUR_LAYER_FILL,
                }}
              />
            );
          })
        : null}
      {applyVisualEffects && (overlay.opacityMinPct > 0 || overlay.opacityMaxPct > 0) && (
        <div
          data-bio-blur-tint
          className="pointer-events-none absolute inset-0"
          style={{
            background: gradualTintGradient(overlay),
            maskImage: revealMask !== "none" ? revealMask : undefined,
            WebkitMaskImage: revealMask !== "none" ? revealMask : undefined,
            maskSize: "100% 100%",
            WebkitMaskSize: "100% 100%",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
      )}
    </div>
  );
}
