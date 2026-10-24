import { Environment } from "@react-three/drei";
import hdriUrl from "../../assets/hdri/moonless_golf_1k.hdr?url";
import { useR3fSceneConfig } from "../../config/r3fSceneConfigContext";

export function LandingR3fEnvironment() {
  const { config } = useR3fSceneConfig();
  const environmentIntensity = config.environmentIntensity;

  return (
    <Environment
      files={hdriUrl}
      environmentIntensity={environmentIntensity}
      background={false}
    />
  );
}
