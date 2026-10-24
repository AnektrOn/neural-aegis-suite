declare module "n8ao" {
  import type { Pass } from "postprocessing";
  import type { Camera, Scene } from "three";

  export class N8AOPostPass extends Pass {
    constructor(scene: Scene, camera: Camera, width: number, height: number);
    configuration: {
      aoRadius: number;
      distanceFalloff: number;
      intensity: number;
      color: import("three").Color;
      gammaCorrection: boolean;
    };
    setSize(width: number, height: number): void;
  }
}
