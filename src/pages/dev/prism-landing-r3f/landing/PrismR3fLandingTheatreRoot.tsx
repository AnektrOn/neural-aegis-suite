import { SheetProvider, editable as e } from "@theatre/r3f";
import type { ReactNode } from "react";
import { landingR3fCameraSheet } from "../cinematic/landingR3fTheatre";
import { getPrismLandingBeat } from "./prismR3fLandingBeats";

const beat0 = getPrismLandingBeat(0);

type Props = {
  children?: ReactNode;
};

/** Theatre sheet + caméra par défaut (landing `/prism` uniquement). */
export function PrismR3fLandingTheatreRoot({ children }: Props) {
  return (
    <SheetProvider sheet={landingR3fCameraSheet}>
      <e.perspectiveCamera
        theatreKey="Camera"
        makeDefault
        fov={55}
        near={0.1}
        far={400}
        position={beat0.cameraPosition}
      />
      {children}
    </SheetProvider>
  );
}
