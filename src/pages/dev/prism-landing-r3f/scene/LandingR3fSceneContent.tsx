import { Suspense } from "react";
import { R3fCubeCoreLightProvider } from "../config/R3fCubeCoreLightContext";
import { R3fGutterLightProvider } from "../config/R3fGutterLightContext";
import { R3fMarbleGodrayLightProvider } from "../config/R3fMarbleGodrayLightContext";
import { LandingR3fGodraysHallScene } from "./godraysHall/LandingR3fGodraysHallScene";
import { LandingR3fDemandInvalidate } from "./LandingR3fDemandInvalidate";
import { LandingR3fPostPipeline } from "./LandingR3fPostPipeline";
import { PrismR3fLandingActiveCameraSetup } from "../landing/PrismR3fLandingActiveCameraSetup";
import { PrismR3fLandingTheatreRoot } from "../landing/PrismR3fLandingTheatreRoot";
import { PrismR3fLandingTheatreRig } from "../landing/PrismR3fLandingTheatreRig";
import { PrismR3fLandingTravelAtmosphere } from "../landing/PrismR3fLandingTravelAtmosphere";

export type R3fHallSceneMode = "lab" | "landing";

export type LandingR3fSceneContentProps = {
  sceneMode?: R3fHallSceneMode;
};

export function LandingR3fSceneContent({ sceneMode = "lab" }: LandingR3fSceneContentProps) {
  const isLanding = sceneMode === "landing";

  const scene = (
    <>
      <LandingR3fDemandInvalidate />
      <LandingR3fGodraysHallScene sceneMode={sceneMode} />
      {isLanding ? <PrismR3fLandingActiveCameraSetup /> : null}
      {isLanding ? <PrismR3fLandingTheatreRig /> : null}
      {isLanding ? <PrismR3fLandingTravelAtmosphere /> : null}
      <LandingR3fPostPipeline sceneMode={sceneMode} />
    </>
  );

  return (
    <R3fGutterLightProvider>
      <R3fCubeCoreLightProvider>
        <R3fMarbleGodrayLightProvider>
          {isLanding ? (
            <>
              <Suspense fallback={null}>
                <PrismR3fLandingTheatreRoot />
              </Suspense>
              {scene}
            </>
          ) : (
            scene
          )}
        </R3fMarbleGodrayLightProvider>
      </R3fCubeCoreLightProvider>
    </R3fGutterLightProvider>
  );
}
