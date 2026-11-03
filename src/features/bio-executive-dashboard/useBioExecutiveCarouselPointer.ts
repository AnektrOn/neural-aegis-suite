import { useEffect, type RefObject } from "react";

const INTERACTIVE = "a, button, input, textarea, select, [role='tab']";

/** Mouse / pen drag to scroll horizontal carousels (trackpad swipe still uses native overflow). */
export function useBioExecutiveCarouselPointer(
  carouselRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || !enabled) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = el.scrollLeft;
      el.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      el.scrollLeft = startScroll - (event.clientX - startX);
    };

    const endDrag = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
    };
  }, [carouselRef, enabled]);
}
