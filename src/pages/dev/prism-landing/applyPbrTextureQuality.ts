import * as THREE from "three";
import type { PrismTextureSlot } from "./prismMaterialConfig";

const COLOR_SLOTS: PrismTextureSlot[] = ["map"];

export function applyPbrTextureQuality(
  tex: THREE.Texture,
  slot: PrismTextureSlot,
  maxAnisotropy: number,
) {
  tex.colorSpace = COLOR_SLOTS.includes(slot)
    ? THREE.SRGBColorSpace
    : THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
}
