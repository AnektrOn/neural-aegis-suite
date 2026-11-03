import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BioExecutiveHeroGradualBlur } from "./BioExecutiveHeroGradualBlur";
import type { DragTarget } from "./bioExecutiveHeroLabDrag";
import type { HeroSilhouetteOverlay } from "./bioExecutiveHeroLabConfig";
import { computeHeroOverlayColumnEscape } from "./heroOverlayColumnEscape";

type BioExecutiveHeroColumnOverlayProps = {
  visible: boolean;
  overlay: HeroSilhouetteOverlay;
  heroLab: boolean;
  labTarget: DragTarget;
  onLabTargetSelect: (target: DragTarget) => void;
  onPointerDown: (target: DragTarget) => (event: React.PointerEvent<HTMLDivElement>) => void;
};

const COLUMN_SELECTOR = ".aegis-bio-exec-lab__desktop-hero";

export function BioExecutiveHeroColumnOverlay({
  visible,
  overlay,
  heroLab,
  labTarget,
  onLabTargetSelect,
  onPointerDown,
}: BioExecutiveHeroColumnOverlayProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [col, setCol] = useState<HTMLElement | null>(null);
  const [box, setBox] = useState<ReturnType<typeof computeHeroOverlayColumnEscape> | null>(null);

  useLayoutEffect(() => {
    const figure = anchorRef.current?.parentElement;
    const column = figure?.closest<HTMLElement>(COLUMN_SELECTOR) ?? null;
    setCol(column);
    if (!visible || !figure || !column) {
      setBox(null);
      return;
    }

    const measure = () => {
      const next = computeHeroOverlayColumnEscape(column, figure, overlay);
      setBox((prev) =>
        prev &&
        prev.widthPx === next.widthPx &&
        prev.topPx === next.topPx &&
        prev.heightPx === next.heightPx &&
        prev.leftPx === next.leftPx
          ? prev
          : next,
      );
    };

    measure();
    const stage = figure.closest<HTMLElement>(".aegis-bio-exec-lab__hero-stage");
    const canvas = figure.closest<HTMLElement>(".aegis-bio-exec-lab__hero-canvas");
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(figure);
    ro.observe(column);
    if (stage) ro.observe(stage);
    if (canvas) ro.observe(canvas);
    window.addEventListener("resize", measure);
    column.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      column.removeEventListener("scroll", measure);
    };
  }, [visible, overlay.topPct, overlay.heightPct, overlay.columnFullWidth]);

  return (
    <>
      <span ref={anchorRef} hidden aria-hidden />
      {visible && overlay.columnFullWidth && col && box && box.heightPx > 0
        ? createPortal(
            <BioExecutiveHeroGradualBlur
              overlay={overlay}
              overlayHost="column-escape"
              columnEscapeBox={box}
              heroLab={heroLab}
              selected={labTarget === "overlay"}
              onSelect={() => onLabTargetSelect("overlay")}
              onPointerDown={onPointerDown("overlay")}
              overlayShellClassName="aegis-bio-exec-lab__hero-overlay-root--column z-[2]"
            />,
            col,
          )
        : null}
    </>
  );
}
