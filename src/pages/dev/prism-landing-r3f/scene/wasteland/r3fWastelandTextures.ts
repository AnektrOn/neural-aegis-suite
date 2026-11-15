/**
 * PBR windswept wasteland — chemins via glob (textures gitignorées / absentes = URLs vides).
 * Évite de casser `vite build` / APK quand les PNG locaux ne sont pas présents.
 */
const wastelandFileUrls = import.meta.glob<string>(
  "../../assets/textures/wasteland/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

function findWastelandUrl(match: (stem: string) => boolean): string {
  for (const [path, url] of Object.entries(wastelandFileUrls)) {
    const stem = path.split("/").pop()?.toLowerCase() ?? "";
    if (match(stem)) return url;
  }
  return "";
}

const albedoUrl = findWastelandUrl(
  (n) => /albedo|basecolor|diffuse/.test(n) && !/preview|normal|rough|ao|metal|height/.test(n),
);
const roughnessUrl = findWastelandUrl((n) => /roughness|_rough/.test(n));
const normalUrl = findWastelandUrl((n) => /normal/.test(n) && !/rough/.test(n));

/** PBR windswept wasteland — chemins pour useTexture (peuvent être vides hors lab local). */
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
