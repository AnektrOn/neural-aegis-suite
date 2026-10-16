import { forwardRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { LANDING_SCROLL_KEYFRAME_COUNT } from "./landingStageRandomScroll";

export type PrismLandingHeroOverlayProps = {
  onEnterScroll?: () => void;
  onScrollProgress?: (progress: number, f: number) => void;
};

const PrismLandingHeroOverlay = forwardRef<
  HTMLDivElement,
  PrismLandingHeroOverlayProps
>(function PrismLandingHeroOverlay({ onEnterScroll, onScrollProgress }, ref) {
  const { t } = useLanguage();
  const scrollSteps = LANDING_SCROLL_KEYFRAME_COUNT - 1;

  return (
    <div
      ref={ref}
      className="prism-scroll prism-landing-hero-scroll"
      onScroll={(e) => {
        const el = e.currentTarget;
        const max = el.scrollHeight - el.clientHeight;
        const progress = max > 0 ? el.scrollTop / max : 0;
        const f = progress * scrollSteps;
        el.style.setProperty("--f", String(f));
        onScrollProgress?.(progress, f);
      }}
    >
      <div className="prism-landing-hero-sticky">
      <div className="prism-copy">
        <div className="prism-lede">
          <p className="prism-eyebrow reveal" style={{ "--d": "0.05s" } as CSSProperties}>
            {t("welcome.philosophy.eyebrow")}
          </p>
          <h1 className="prism-headline reveal" style={{ "--d": "0.15s" } as CSSProperties}>
            {t("welcome.philosophy.title")}
          </h1>
          <p className="prism-sub reveal" style={{ "--d": "0.25s" } as CSSProperties}>
            {t("welcome.hero.subtitle")}
          </p>
        </div>
        <div className="prism-actions reveal" style={{ "--d": "0.35s" } as CSSProperties}>
          <Link to="/auth" className="prism-btn prism-btn-primary">
            {t("auth.signIn")}
          </Link>
          <button
            type="button"
            className="prism-btn prism-btn-quiet"
            onClick={() => {
              const node = ref && typeof ref !== "function" ? ref.current : null;
              if (node) {
                const max = node.scrollHeight - node.clientHeight;
                node.scrollTo({ top: max * 0.12, behavior: "smooth" });
              }
            }}
          >
            {t("welcome.hero.cta")}
          </button>
        </div>
      </div>
      <footer className="prism-strip reveal" style={{ "--d": "0.45s" } as CSSProperties}>
        <span><span className="by">Aegis</span> Exocortex</span>
        <span>État 0 — Hero</span>
        <span>Scroll — poses 3D aléatoires</span>
      </footer>
      </div>
      {Array.from({ length: scrollSteps }, (_, index) => (
        <section
          key={index}
          className="prism-hero-scroll-step"
          style={{ "--i": index + 1 } as CSSProperties}
          aria-hidden
        />
      ))}
    </div>
  );
});

export default PrismLandingHeroOverlay;
