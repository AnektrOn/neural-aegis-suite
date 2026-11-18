import { useCallback, useEffect, useRef } from "react";
import SculptureHero from "@/components/ui/liquid-sculpture-hero";
import { INTRO_V2_SCULPTURE_HERO } from "@/pages/dev/intro-v2/introV2SculpturePreset";
import {
  SCULPTURE_HOLD_ORDER_CAP,
  sculptureHoldVisualOrder,
} from "@/pages/dev/intro-v2/scenes/sculpture/sculptureNarrative";
import {
  LOGOS_PATH_SCULPTURE_ASSEMBLE_SEC,
  logosPathSculptureSrc,
  type LogosPathSculptureIndex,
} from "./logosPathSculptureAssets";

const STAGE_BLACK = "#000000";
const preset = INTRO_V2_SCULPTURE_HERO;

/** Card-scale liquid sculpture — intro-v2 preset, auto-assemble after delay (no click). */
export function LogosPathCardNebula({ index }: { index: LogosPathSculptureIndex }) {
  const src = logosPathSculptureSrc(index);
  const mixRef = useRef(0);

  useEffect(() => {
    if (!src) return;
    mixRef.current = 0;
    const startedAt = performance.now();
    const durationMs = Math.max(0.5, LOGOS_PATH_SCULPTURE_ASSEMBLE_SEC) * 1000;
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (performance.now() - startedAt) / durationMs);
      mixRef.current = t;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [src]);

  const getHoldOrder = useCallback(
    () => sculptureHoldVisualOrder(mixRef.current),
    [],
  );

  if (!src) {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-black"
        aria-hidden
      />
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-black">
      <SculptureHero
        layoutMode="stage"
        hideFallbackImage
        restStyle="particles"
        height="100%"
        showNav={false}
        showCredit={false}
        backdropText=""
        loadFonts={false}
        theme="dark"
        background={STAGE_BLACK}
        darkBackground={STAGE_BLACK}
        src={src}
        darkSrc={src}
        mobileSrc={src}
        mobileDarkSrc={src}
        imageAlt=""
        getHoldOrder={getHoldOrder}
        ambient={preset.ambient}
        {...preset}
        // Five cards: slightly lighter than fullscreen intro.
        particleDensity={Math.min(preset.particleDensity, 0.48)}
        stageFit="cover"
        sculptureScale={1}
        mobileSculptureScale={1}
        sculptureX={0}
        sculptureY={0}
        interactive={false}
        stabilizeOnHold
        holdRevealImage
        holdOrderCap={SCULPTURE_HOLD_ORDER_CAP}
        className="!h-full !min-h-0 !w-full"
      />
    </div>
  );
}
