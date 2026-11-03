import { useCallback, useRef } from "react";
import {
  HERO_CANVAS_ELEMENT_IDS,
  type HeroBreakpointSlice,
  type HeroElementId,
  type HeroElementLayout,
  type HeroSilhouetteLayout,
  type HeroSilhouetteOverlay,
} from "./bioExecutiveHeroLabConfig";

type DragTarget = "silhouette" | "overlay" | HeroElementId;

function isCanvasTarget(target: DragTarget): boolean {
  return target !== "silhouette" && target !== "overlay" && HERO_CANVAS_ELEMENT_IDS.includes(target);
}

type UseHeroLabDragOptions = {
  enabled: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  columnRef: React.RefObject<HTMLDivElement | null>;
  figureRef: React.RefObject<HTMLDivElement | null>;
  slice: HeroBreakpointSlice;
  onSliceChange: (next: HeroBreakpointSlice) => void;
  activeTarget: DragTarget;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function useHeroLabDrag({
  enabled,
  canvasRef,
  columnRef,
  figureRef,
  slice,
  onSliceChange,
  activeTarget,
}: UseHeroLabDragOptions) {
  const sliceRef = useRef(slice);
  sliceRef.current = slice;

  const onPointerDown = useCallback(
    (target: DragTarget) => (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled || event.button !== 0) return;
      if (target !== activeTarget) return;

      const container =
        target === "overlay"
          ? sliceRef.current.overlay.columnFullWidth
            ? columnRef.current
            : figureRef.current
          : isCanvasTarget(target)
            ? canvasRef.current
            : figureRef.current;
      if (!container) return;

      event.preventDefault();
      event.stopPropagation();
      const el = event.currentTarget;
      el.setPointerCapture(event.pointerId);
      const rect = container.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;

      const startSil = { ...sliceRef.current.silhouette };
      const startOverlay = { ...sliceRef.current.overlay };
      const startEl =
        target !== "silhouette" && target !== "overlay"
          ? { ...sliceRef.current.elements[target as HeroElementId] }
          : null;

      const onMove = (ev: PointerEvent) => {
        const dx = ((ev.clientX - startX) / rect.width) * 100;
        const dy = ((ev.clientY - startY) / rect.height) * 100;

        if (target === "silhouette") {
          onSliceChange({
            ...sliceRef.current,
            silhouette: {
              ...startSil,
              leftPct: clamp(startSil.leftPct + dx, 0, 100),
              bottomPct: clamp(startSil.bottomPct - dy, -35, 55),
            },
          });
          return;
        }

        if (target === "overlay") {
          onSliceChange({
            ...sliceRef.current,
            overlay: {
              ...startOverlay,
              ...(startOverlay.columnFullWidth
                ? { topPct: clamp(startOverlay.topPct + dy, 0, 100) }
                : {
                    leftPct: clamp(startOverlay.leftPct + dx, 0, 100),
                    topPct: clamp(startOverlay.topPct + dy, 0, 100),
                  }),
            },
          });
          return;
        }

        const id = target as HeroElementId;
        const base = startEl!;
        const next: HeroElementLayout = { ...base };

        if (isCanvasTarget(id)) {
          next.leftPct = clamp((base.leftPct ?? 0) + dx, 0, 100);
          next.topPct = clamp((base.topPct ?? 0) + dy, 0, 100);
        } else if (base.anchor === "topRight" || base.anchor === "bottomRight") {
          next.rightPct = clamp((base.rightPct ?? 0) - dx, 0, 100);
        } else {
          next.leftPct = clamp((base.leftPct ?? 0) + dx, 0, 100);
        }

        if (!isCanvasTarget(id)) {
          if (base.anchor === "bottomLeft" || base.anchor === "bottomRight") {
            next.bottomPct = clamp((base.bottomPct ?? 0) - dy, 0, 100);
          } else {
            next.topPct = clamp((base.topPct ?? 0) + dy, 0, 100);
          }
        }

        onSliceChange({
          ...sliceRef.current,
          elements: { ...sliceRef.current.elements, [id]: next },
        });
      };

      const onUp = () => {
        el.releasePointerCapture(event.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [activeTarget, canvasRef, columnRef, enabled, figureRef, onSliceChange],
  );

  return { onPointerDown };
}

export function patchSilhouette(
  slice: HeroBreakpointSlice,
  partial: Partial<HeroSilhouetteLayout>,
): HeroBreakpointSlice {
  return { ...slice, silhouette: { ...slice.silhouette, ...partial } };
}

export function patchOverlay(
  slice: HeroBreakpointSlice,
  partial: Partial<HeroSilhouetteOverlay>,
): HeroBreakpointSlice {
  return { ...slice, overlay: { ...slice.overlay, ...partial } };
}

export function patchElement(
  slice: HeroBreakpointSlice,
  id: HeroElementId,
  partial: Partial<HeroElementLayout>,
): HeroBreakpointSlice {
  return {
    ...slice,
    elements: { ...slice.elements, [id]: { ...slice.elements[id], ...partial } },
  };
}

export type { DragTarget };
