/**
 * @example/gpgpu-curl-noise-dof — pmndrs/examples (Canvas + scene graph from App.tsx).
 * @see https://github.com/pmndrs/examples/tree/main/examples/gpgpu-curl-noise-dof
 */
import { Canvas, useThree } from "@react-three/fiber";
import { useLayoutEffect, type MutableRefObject } from "react";
import * as THREE from "three";
import type { HoldState } from "@/features/intro/useHoldProgress";
import type { IntroPhase } from "@/features/intro/useIntroMachine";
import { Particles } from "../pmndrs/gpgpu/Particles";
import { INTRO_V2_PALETTE } from "../introV2Palette";
import { INTRO_V2_FLOW } from "../introV2FlowPreset";
import type { FlowGpgpuDevKnobs } from "../flowGpgpuHoldMorph";

/** Fixed view so focus ≈ 5 stays on the particle field while tuning. */
function LockedFlowCamera() {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.position.set(0, 0.12, 6);
    camera.lookAt(0, 0, 0);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 25;
      camera.updateProjectionMatrix();
    }
  }, [camera]);
  return null;
}

export type { FlowGpgpuTuning } from "../flowGpgpuTuning";

type Props = {
  lowPower?: boolean;
  className?: string;
  hold: MutableRefObject<HoldState>;
  phase?: IntroPhase;
  /** Cible « net » ; le clic long interpole depuis flou + vitesse élevée. */
  devKnobs?: FlowGpgpuDevKnobs;
};

function GpgpuCurlDofContent({
  lowPower = false,
  hold,
  phase,
  devKnobs,
}: {
  lowPower?: boolean;
  hold: MutableRefObject<HoldState>;
  phase?: IntroPhase;
  devKnobs?: FlowGpgpuDevKnobs;
}) {
  return (
    <>
      <color attach="background" args={[INTRO_V2_PALETTE.heroBg]} />
      <LockedFlowCamera />
      <Particles hold={hold} phase={phase} devKnobs={devKnobs} lowPower={lowPower} />
    </>
  );
}

/** Self-contained Canvas — matches pmndrs example (required for float FBO + DOF shaders). */
export function GpgpuCurlDofScene({
  lowPower = false,
  className,
  hold,
  phase,
  devKnobs,
}: Props) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        linear
        dpr={lowPower ? 1 : [1, INTRO_V2_FLOW.dprMax]}
        camera={{ fov: 25, position: [0, 0, 6] }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(INTRO_V2_PALETTE.heroBg, 1);
        }}
      >
        <GpgpuCurlDofContent lowPower={lowPower} hold={hold} phase={phase} devKnobs={devKnobs} />
      </Canvas>
    </div>
  );
}
