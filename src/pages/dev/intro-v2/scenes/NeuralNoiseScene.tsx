import type { MutableRefObject } from "react";
import { NeuralNoise } from "@/components/ui/neural-noise";
import type { HoldState } from "@/features/intro/useHoldProgress";
import type { IntroPhase } from "@/features/intro/useIntroMachine";
import { DocumentaryTravel2D } from "../camera/DocumentaryTravel2D";
import { INTRO_V2_PALETTE, nebulaRgbMix } from "../introV2Palette";
import {
  INTRO_V2_NEURAL,
  INTRO_V2_NEURAL_MOBILE,
  type IntroV2NeuralPreset,
} from "../introV2NeuralPreset";

type Props = {
  hold: MutableRefObject<HoldState>;
  phase?: IntroPhase;
  className?: string;
  lowPower?: boolean;
  tuning?: IntroV2NeuralPreset;
};

/** 2D WebGL backdrop — no R3F canvas (avoids double rAF with sculpture/flow). */
export default function NeuralNoiseScene({
  hold,
  phase,
  className,
  lowPower = false,
  tuning: tuningProp,
}: Props) {
  const tuning = tuningProp ?? (lowPower ? INTRO_V2_NEURAL_MOBILE : INTRO_V2_NEURAL);

  return (
    <div className={className} aria-hidden>
      <div className="absolute inset-0" style={{ backgroundColor: INTRO_V2_PALETTE.heroBgCss }} />
      {lowPower ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_42%,rgba(24,190,199,0.14),transparent_72%)]"
          aria-hidden
        />
      ) : null}
      <DocumentaryTravel2D
        hold={hold}
        phase={phase}
        lowPower={lowPower}
        className="absolute inset-0 overflow-hidden"
      >
        <NeuralNoise
          className="h-full w-full"
          color={nebulaRgbMix(tuning.baseAccent)}
          overlayColors={tuning.overlayAccents.map((a) => nebulaRgbMix(a))}
          overlayMixMax={tuning.overlayMix}
          densityBoostMax={tuning.densityBoost}
          hold={hold}
          phase={phase}
          lowPower={lowPower}
          speed={tuning.speed}
          opacity={tuning.opacity}
        />
      </DocumentaryTravel2D>
    </div>
  );
}
