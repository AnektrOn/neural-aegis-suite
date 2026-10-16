import { type MutableRefObject } from "react";
import type { IntroV2ChapterId } from "./introV2Copy";
import type { HoldState } from "@/features/intro/useHoldProgress";
import type { IntroPhase } from "@/features/intro/useIntroMachine";
import { INTRO_FLOW_SCENE_KNOBS, type FlowGpgpuDevKnobs } from "./flowGpgpuHoldMorph";
import NeuralNoiseScene from "./scenes/NeuralNoiseScene";
import LiquidSculptureIntroScene from "./scenes/LiquidSculptureIntroScene";
import { GpgpuCurlDofScene } from "./scenes/GpgpuCurlDofScene";
import { AsteroidFallScene } from "./scenes/AsteroidFallScene";

type Props = {
  chapter: IntroV2ChapterId | null;
  hold: MutableRefObject<HoldState>;
  phase: IntroPhase;
  lowPower: boolean;
  className?: string;
  flowDevKnobs?: FlowGpgpuDevKnobs;
};

export default function IntroV2Stage({
  chapter,
  hold,
  phase,
  lowPower,
  className,
  flowDevKnobs,
}: Props) {
  if (chapter === "neural" || chapter === null) {
    return (
      <NeuralNoiseScene hold={hold} phase={phase} lowPower={lowPower} className={className} />
    );
  }

  if (chapter === "sculpture") {
    return (
      <LiquidSculptureIntroScene
        lowPower={lowPower}
        className={className}
        hold={hold}
        phase={phase}
      />
    );
  }

  if (chapter === "flow") {
    return (
      <GpgpuCurlDofScene
        lowPower={lowPower}
        className={className}
        hold={hold}
        phase={phase}
        devKnobs={flowDevKnobs ?? INTRO_FLOW_SCENE_KNOBS}
      />
    );
  }

  if (chapter === "asteroids") {
    return (
      <AsteroidFallScene lowPower={lowPower} className={className} hold={hold} phase={phase} />
    );
  }

  return <NeuralNoiseScene hold={hold} phase={phase} lowPower={lowPower} className={className} />;
}
