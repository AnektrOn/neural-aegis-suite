export type PrismMaterialLook = "glass" | "textured";

export type PrismTextureSlot =
  | "map"
  | "normalMap"
  | "roughnessMap"
  | "metalnessMap"
  | "aoMap";

export type PrismTextureUrls = Partial<Record<PrismTextureSlot, string>>;

/** Polished stone / metal hero shield — `meshPhysicalMaterial` layer. */
export type PrismPhysicalMaterialParams = {
  clearcoat: number;
  clearcoatRoughness: number;
  envMapIntensity: number;
  normalScale: number;
  ior: number;
  aoMapIntensity: number;
  /** Sheen on dielectric highlights (marble wax / polish). */
  sheen: number;
  sheenRoughness: number;
  sheenColor: string;
};

export type PrismMaterialConfig = {
  look: PrismMaterialLook;
  textures: PrismTextureUrls;
  /** Applique la normal importée sur le verre transmission (preview). */
  normalOnGlass: boolean;
  color: string;
  metalness: number;
  roughness: number;
  /** MaterialX / Substance : activer si les maps semblent inversées en Y. */
  textureFlipY: boolean;
  /** Répétition UV (UVScale du MTLX). */
  textureRepeat: number;
  /** Used when `look === "textured"` (marble shield). */
  physical?: PrismPhysicalMaterialParams;
};

export const DEFAULT_SHIELD_PHYSICAL: PrismPhysicalMaterialParams = {
  clearcoat: 0.52,
  clearcoatRoughness: 0.08,
  envMapIntensity: 1.45,
  normalScale: 1.25,
  ior: 1.55,
  aoMapIntensity: 1.15,
  sheen: 0.35,
  sheenRoughness: 0.42,
  sheenColor: "#f0e6dc",
};

export const DEFAULT_PRISM_MATERIAL_CONFIG: PrismMaterialConfig = {
  look: "glass",
  textures: {},
  normalOnGlass: false,
  color: "#c8d0e0",
  metalness: 0.85,
  roughness: 0.35,
  textureFlipY: false,
  textureRepeat: 1,
};

export const PRISM_TEXTURE_SLOT_LABELS: Record<PrismTextureSlot, string> = {
  map: "Base color (map)",
  normalMap: "Normal",
  roughnessMap: "Roughness",
  metalnessMap: "Metalness",
  aoMap: "Ambient occlusion",
};
