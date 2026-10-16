import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PrismLandingHeroOverlay from "./PrismLandingHeroOverlay";
import PrismLandingScrollOverlay from "./PrismLandingScrollOverlay";
import { useShieldMaterial } from "./useShieldMaterial";
import {
  PRISM_LANDING_MODE_LANDING,
  PRISM_LANDING_MODE_SCROLL,
  type PrismLandingExperienceMode,
} from "./prismLandingMode";
import "./prism-landing.css";
import { PrismLandingNav } from "./PrismLandingNav";
import { LandingStageLayoutPanel } from "./LandingStageLayoutPanel";
import { useLandingStageLayout } from "./useLandingStageLayout";
import { useLandingScrollKeyframes } from "./useLandingScrollKeyframes";

const PrismLandingCanvas = lazy(() => import("./PrismLandingCanvas"));

export default function PrismLandingPage() {
  const scroll = useRef(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollOverlayRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<PrismLandingExperienceMode>(
    PRISM_LANDING_MODE_LANDING,
  );
  const materialConfig = useShieldMaterial();
  const {
    layout: stageLayout,
    worldPositions,
    setLink,
    patchItem,
    patchCluster,
    resetLayout,
  } = useLandingStageLayout();

  const {
    displayLayout,
    worldPositions: scrollWorldPositions,
    regenerateKeyframes,
    onLandingScrollProgress,
    scroll01,
  } = useLandingScrollKeyframes(stageLayout);

  const panelWorldPositions =
    scroll01 > 0.0005 ? scrollWorldPositions : worldPositions;

  const eventSource =
    mode === PRISM_LANDING_MODE_SCROLL ? scrollOverlayRef : heroRef;

  const enterScroll = useCallback(() => {
    scroll.current = 0;
    setMode(PRISM_LANDING_MODE_SCROLL);
  }, []);

  const backToLanding = useCallback(() => {
    scroll.current = 0;
    if (scrollOverlayRef.current) {
      scrollOverlayRef.current.scrollTop = 0;
    }
    document.querySelector<HTMLElement>(".prism-landing-root")?.style.setProperty("--f", "0");
    setMode(PRISM_LANDING_MODE_LANDING);
  }, []);

  useEffect(() => {
    const box = document.getElementById("prism-landing-errors");
    if (!box) return;
    const show = (msg: string) => {
      box.textContent += `${msg}\n`;
    };
    const onError = (e: ErrorEvent) => show(`Erreur : ${e.message || e.type}`);
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason as Error | string | undefined;
      show(`Erreur : ${reason instanceof Error ? reason.message : String(reason)}`);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    try {
      const c = document.createElement("canvas");
      if (!(c.getContext("webgl2") || c.getContext("webgl"))) {
        show("WebGL indisponible dans ce navigateur.");
      }
    } catch {
      show("WebGL indisponible dans ce navigateur.");
    }
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <div className="prism-landing-root">
      <pre id="prism-landing-errors" className="prism-landing-errors" />
      <PrismLandingNav />
      <div className="prism-landing-canvas" aria-hidden>
        <Suspense fallback={null}>
          {materialConfig ? (
            <PrismLandingCanvas
              mode={mode}
              scroll={scroll}
              materialConfig={materialConfig}
              eventSource={eventSource}
              stageLayout={displayLayout}
            />
          ) : null}
        </Suspense>
      </div>

      {mode === PRISM_LANDING_MODE_LANDING ? (
        <>
          <LandingStageLayoutPanel
            layout={stageLayout}
            worldPositions={panelWorldPositions}
            scrollProgress={scroll01}
            onRegenerateScroll={regenerateKeyframes}
            onLinkChange={setLink}
            onItemPatch={patchItem}
            onClusterPatch={patchCluster}
            onReset={resetLayout}
          />
          <PrismLandingHeroOverlay
            ref={heroRef}
            onScrollProgress={onLandingScrollProgress}
            onEnterScroll={enterScroll}
          />
        </>
      ) : (
        <PrismLandingScrollOverlay
          ref={scrollOverlayRef}
          scroll={scroll}
          onBackToLanding={backToLanding}
        />
      )}

      {mode === PRISM_LANDING_MODE_SCROLL ? (
        <Button
          variant="ghost"
          size="sm"
          className="prism-landing-back gap-2"
          asChild
        >
          <Link to="/dev">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Dev Lab
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
