import { Suspense, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  R3F_GODRAYS_HALL_BG,
  R3F_GODRAYS_HALL_FOG,
  R3F_GODRAYS_HALL_ORBIT_TARGET,
} from "./r3fGodraysHallConstants";
import { LandingR3fHallAmbientLights } from "./LandingR3fHallAmbientLights";
import { LandingR3fSlitMonolith } from "./LandingR3fSlitMonolith";
import { LandingR3fWastelandGround } from "../wasteland/LandingR3fWastelandGround";
import { LandingR3fEnvironment } from "../atmosphere/LandingR3fEnvironment";
import { LandingR3fHallSunLight } from "../atmosphere/LandingR3fHallSunLight";
import { LandingR3fShatteredCube } from "../shatteredCube/LandingR3fShatteredCube";
import { LandingR3fMarbleMonolith } from "../marbleMonolith/LandingR3fMarbleMonolith";
import type { R3fHallSceneMode } from "../LandingR3fSceneContent";
import { PrismR3fLandingSceneReady } from "../../landing/PrismR3fLandingSceneReady";

type Props = {
  sceneMode?: R3fHallSceneMode;
};

export function LandingR3fGodraysHallScene({ sceneMode = "lab" }: Props) {
  const orbitRef = useRef<OrbitControlsImpl | null>(null);
  const isLanding = sceneMode === "landing";

  return (
    <>
      <color attach="background" args={[R3F_GODRAYS_HALL_BG]} />
      <fog attach="fog" args={R3F_GODRAYS_HALL_FOG} />

      <LandingR3fHallAmbientLights />
      {!isLanding ? <LandingR3fHallSunLight /> : null}

      {!isLanding ? (
        <OrbitControls
          ref={orbitRef}
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={3}
          maxDistance={120}
          maxPolarAngle={Math.PI * 0.49}
          target={R3F_GODRAYS_HALL_ORBIT_TARGET}
        />
      ) : null}

      <Suspense fallback={null}>
        <LandingR3fEnvironment />
        <LandingR3fWastelandGround />
        {isLanding ? <PrismR3fLandingSceneReady /> : null}
      </Suspense>

      <Suspense fallback={null}>
        <LandingR3fSlitMonolith orbitRef={orbitRef} />
        <LandingR3fShatteredCube
          autoPlay={!isLanding}
          enableClickBurst={!isLanding}
        />
        <LandingR3fMarbleMonolith />
      </Suspense>
    </>
  );
}
