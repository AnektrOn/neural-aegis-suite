import { forwardRef, type CSSProperties, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  PRISM_LANDING_SECTIONS,
  type PrismLandingSectionId,
} from "./prismLandingPresets";

export type PrismLandingScrollOverlayProps = {
  scroll: RefObject<number>;
  onSectionChange?: (section: PrismLandingSectionId) => void;
  onBackToLanding?: () => void;
};

function sectionFromScroll(scroll01: number): PrismLandingSectionId {
  const t = Math.min(1, Math.max(0, scroll01));
  const idx = Math.min(
    PRISM_LANDING_SECTIONS.length - 1,
    Math.floor(t * PRISM_LANDING_SECTIONS.length),
  );
  return PRISM_LANDING_SECTIONS[idx].id;
}

const PrismLandingScrollOverlay = forwardRef<
  HTMLDivElement,
  PrismLandingScrollOverlayProps
>(function PrismLandingScrollOverlay(
  { scroll, onSectionChange, onBackToLanding },
  ref,
) {
  return (
    <div
      ref={ref}
      className="prism-scroll"
      onScroll={(e) => {
        const el = e.currentTarget;
        const max = el.scrollHeight - el.clientHeight;
        const progress = max > 0 ? el.scrollTop / max : 0;
        scroll.current = progress;
        const steps = PRISM_LANDING_SECTIONS.length - 1;
        const f = progress * steps;
        el.style.setProperty("--f", String(f));
        document.querySelector(".prism-landing-root")?.style.setProperty("--f", String(f));
        onSectionChange?.(sectionFromScroll(progress));
      }}
    >
      {PRISM_LANDING_SECTIONS.map((block, index) => {
        const side = index % 2 === 0 ? "left" : "right";
        const isLast = index === PRISM_LANDING_SECTIONS.length - 1;
        const panelStyle = { "--i": index } as CSSProperties;

        return (
          <section
            key={block.id}
            className={`prism-step side-${side}${isLast ? " prism-step-last" : ""}`}
            style={{ minHeight: block.scrollHeightVh, ...panelStyle }}
            data-section={block.id}
          >
            <div
              className={`prism-panel${isLast ? " prism-panel-final" : ""}`}
              style={panelStyle}
            >
              {block.id === "hero" && onBackToLanding ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mb-4 pointer-events-auto border-border bg-transparent text-foreground"
                  onClick={onBackToLanding}
                >
                  Retour hero
                </Button>
              ) : null}
              {index > 0 ? (
                <p className="prism-eyebrow">{String(index).padStart(2, "0")}</p>
              ) : (
                <p className="prism-eyebrow">État 1 — Scroll</p>
              )}
              <h2 className="prism-title">{block.title}</h2>
              <p className="prism-text">{block.body}</p>
              {isLast ? (
                <div className="prism-actions-final">
                  <a href="/auth" className="prism-btn prism-btn-primary prism-btn-compact">
                    Commencer
                  </a>
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
});

export default PrismLandingScrollOverlay;
