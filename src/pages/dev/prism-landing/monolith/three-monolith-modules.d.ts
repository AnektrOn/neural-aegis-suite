declare module "three-monolith/webgpu";
declare module "three-monolith/tsl";
declare module "three-monolith/addons/*";
declare module "n8ao" {
  import type { Pass } from "postprocessing";
  import type { Camera, Scene } from "three";
  export class N8AOPostPass extends Pass {
    constructor(scene: Scene, camera: Camera, width?: number, height?: number);
    configuration: Record<string, unknown>;
    setSize(width: number, height: number): void;
    dispose(): void;
  }
}
