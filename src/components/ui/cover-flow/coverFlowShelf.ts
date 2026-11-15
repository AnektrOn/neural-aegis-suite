import { useEffect, type RefObject } from "react";

export const COVER_FLOW_MAX_VISIBLE_OFFSET = 4;
export const COVER_FLOW_SPACING_PX = 148;
export const COVER_FLOW_ROTATE_DEG = 50;
export const COVER_FLOW_SWIPE_PX = 44;

export type CoverFlowStyleOptions = {
  /** Horizontal gap between card centers (px). */
  spacingPx?: number;
  /** Y-rotation per offset step (deg). */
  rotateDeg?: number;
  /** Depth push per offset step (px). */
  depthPx?: number;
};

export function coverFlowCardStyle(
  offset: number,
  reduceMotion: boolean,
  options?: CoverFlowStyleOptions,
) {
  const spacingPx = options?.spacingPx ?? COVER_FLOW_SPACING_PX;
  const rotateDeg = options?.rotateDeg ?? COVER_FLOW_ROTATE_DEG;
  const depthPx = options?.depthPx ?? 96;
  const abs = Math.abs(offset);
  if (abs > COVER_FLOW_MAX_VISIBLE_OFFSET) {
    return {
      opacity: 0,
      pointerEvents: "none" as const,
      transform: "translate(-50%, -50%) scale(0.5)",
      zIndex: 0,
    };
  }
  const scale = Math.max(0.58, 1 - abs * 0.1);
  const translateX = offset * spacingPx;
  const rotateY = offset * -rotateDeg;
  const translateZ = -abs * depthPx;
  return {
    opacity: Math.max(0.35, 1 - abs * 0.14),
    pointerEvents: "auto" as const,
    zIndex: 40 - abs,
    transform: `translate(-50%, -50%) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
    transition: reduceMotion ? "none" : "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease",
  };
}

/** Horizontal drag — touch + mouse (pointer events, capture on the whole section). */
export function useCoverFlowDragSwipe(
  containerRef: RefObject<HTMLElement | null>,
  onPrev: () => void,
  onNext: () => void,
  draggingClassName = "persona-cover-flow--dragging",
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let axis: "x" | "y" | null = null;
    let pointerId: number | null = null;

    const reset = () => {
      tracking = false;
      axis = null;
      pointerId = null;
      el.classList.remove(draggingClassName);
    };

    const suppressNextClick = () => {
      const block = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
        el.removeEventListener("click", block, true);
      };
      el.addEventListener("click", block, true);
      window.setTimeout(() => el.removeEventListener("click", block, true), 400);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      tracking = true;
      axis = null;
      pointerId = e.pointerId;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* already captured */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!tracking || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (axis == null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (axis === "x" && Math.abs(dx) > 10) {
        e.preventDefault();
        el.classList.add(draggingClassName);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!tracking || e.pointerId !== pointerId) return;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* */
      }
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const swiped =
        axis === "x" && Math.abs(dx) >= COVER_FLOW_SWIPE_PX && Math.abs(dx) >= Math.abs(dy);
      reset();
      if (!swiped) return;
      suppressNextClick();
      if (dx > 0) onPrev();
      else onNext();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      reset();
    };
  }, [containerRef, onPrev, onNext, draggingClassName]);
}
