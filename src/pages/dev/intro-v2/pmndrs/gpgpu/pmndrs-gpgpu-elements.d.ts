import type { ThreeElements } from "@react-three/fiber";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      simulationMaterial: ThreeElements["shaderMaterial"];
      dofPointsMaterial: ThreeElements["shaderMaterial"];
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      simulationMaterial: ThreeElements["shaderMaterial"];
      dofPointsMaterial: ThreeElements["shaderMaterial"];
    }
  }
}

export {};
