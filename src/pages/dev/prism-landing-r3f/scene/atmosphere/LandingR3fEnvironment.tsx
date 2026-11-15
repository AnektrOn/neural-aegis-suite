import { Environment } from "@react-three/drei";
import hdriAsset from "../../assets/hdri/moonless_golf_1k.hdr.asset.json";
import { useR3fSceneConfig } from "../../config/r3fSceneConfigContext";

export function LandingR3fEnvironment() {
  const { config } = useR3fSceneConfig();
  const environmentIntensity = config.environmentIntensity;

  return (
    <Environment
      files={hdriAsset.url}
      environmentIntensity={environmentIntensity}
      background={false}
    />
  );
}
