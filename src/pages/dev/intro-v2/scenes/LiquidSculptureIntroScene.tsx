import { useCallback, useRef } from "react";
import SculptureHero from "@/components/ui/liquid-sculpture-hero";
import { holdChapterMix, type HoldState } from "@/features/intro/useHoldProgress";
import type { IntroPhase } from "@/features/intro/useIntroMachine";
import { INTRO_V2_SCULPTURE_SRC } from "../introV2SculptureAsset";
import { INTRO_V2_SCULPTURE_HERO } from "../introV2SculpturePreset";
import {
  SCULPTURE_HOLD_ORDER_CAP,
  sculptureHoldVisualOrder,
} from "./sculpture/sculptureNarrative";
import type { MutableRefObject } from "react";

const STAGE_BLACK = "#000000";
const preset = INTRO_V2_SCULPTURE_HERO;

type Props = {
  hold: MutableRefObject<HoldState>;
  phase?: IntroPhase;
  lowPower?: boolean;
  className?: string;
};

/** Vortex dispersion until long-press (intro hold) reassembles the crystal. */
export default function LiquidSculptureIntroScene({ hold, phase, lowPower, className }: Props) {
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const getHoldOrder = useCallback(() => {
    const mix = holdChapterMix(hold.current, phaseRef.current ?? "entry");
    return sculptureHoldVisualOrder(mix);
  }, [hold]);

  return (
    <div className={className}>
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
        src={INTRO_V2_SCULPTURE_SRC}
        darkSrc={INTRO_V2_SCULPTURE_SRC}
        mobileSrc={INTRO_V2_SCULPTURE_SRC}
        mobileDarkSrc={INTRO_V2_SCULPTURE_SRC}
        imageAlt="Cristal de quartz"
        getHoldOrder={getHoldOrder}
        ambient={lowPower ? false : preset.ambient}
        {...preset}
        interactive={false}
        holdOrderCap={SCULPTURE_HOLD_ORDER_CAP}
      />
    </div>
  );
}
