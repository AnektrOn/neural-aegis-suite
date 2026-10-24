import albedoUrl from "../../assets/textures/wasteland/windswept-wasteland_albedo.png";
import normalUrl from "../../assets/textures/wasteland/windswept-wasteland_normal-dx.png";
import roughnessUrl from "../../assets/textures/wasteland/windswept-wasteland_roughness.png";

/** PBR windswept wasteland — chemins statiques pour Vite. */
export const R3F_WASTELAND_TEXTURE_URLS = [albedoUrl, roughnessUrl, normalUrl] as const;

export type R3fWastelandTextureSet = {
  albedo: string;
  roughness: string;
  normal: string;
};

export const r3fWastelandTexturePaths: R3fWastelandTextureSet = {
  albedo: albedoUrl,
  roughness: roughnessUrl,
  normal: normalUrl,
};
