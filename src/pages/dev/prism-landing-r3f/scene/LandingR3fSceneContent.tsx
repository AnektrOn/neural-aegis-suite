import { R3fCubeCoreLightProvider } from "../config/R3fCubeCoreLightContext";
import { R3fGutterLightProvider } from "../config/R3fGutterLightContext";
import { LandingR3fGodraysHallScene } from "./godraysHall/LandingR3fGodraysHallScene";
import { LandingR3fDemandInvalidate } from "./LandingR3fDemandInvalidate";
import { LandingR3fPostPipeline } from "./LandingR3fPostPipeline";

export function LandingR3fSceneContent() {
  return (
    <R3fGutterLightProvider>
      <R3fCubeCoreLightProvider>
        <LandingR3fDemandInvalidate />
        <LandingR3fGodraysHallScene />
        <LandingR3fPostPipeline />
      </R3fCubeCoreLightProvider>
    </R3fGutterLightProvider>
  );
}
