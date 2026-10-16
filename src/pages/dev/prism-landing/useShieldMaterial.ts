import { useEffect, useState } from "react";
import { loadMaterialXFromZip } from "./loadMaterialXImport";
import { resolveShieldMarbleZipUrl } from "./resolveShieldMarbleZip";
import {
  DEFAULT_SHIELD_PHYSICAL,
  type PrismMaterialConfig,
  type PrismMaterialLook,
} from "./prismMaterialConfig";

/** 1 = full 2K texel density on shield (2 in MTLX tiles and looks blocky up close). */
const MARBLE_UV_SCALE = 1;

/** `glass` hides low-poly faceting better until a higher-res GLB is used. */
const SHIELD_LOOK: PrismMaterialLook =
  import.meta.env.VITE_PRISM_SHIELD_MATERIAL === "marble" ? "textured" : "glass";

export function useShieldMaterial(): PrismMaterialConfig | null {
  const [config, setConfig] = useState<PrismMaterialConfig | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const marbleZipUrl = await resolveShieldMarbleZipUrl();
      const response = await fetch(marbleZipUrl);
      const blob = await response.blob();
      const file = new File([blob], "Marble_Orange_Streaks.zip", {
        type: "application/zip",
      });
      const result = await loadMaterialXFromZip(file);
      if (cancelled) return;

      const metalness = result.parsed.scalars.metalness ?? 0.12;
      const roughness = result.parsed.scalars.roughness ?? 0.38;

      setConfig({
        look: SHIELD_LOOK,
        textures: result.textures,
        normalOnGlass: SHIELD_LOOK === "glass" && Boolean(result.textures.normalMap),
        color: result.parsed.scalars.baseColorHex ?? "#f5f0ea",
        metalness: Math.min(0.35, metalness),
        roughness: Math.max(0.22, Math.min(0.55, roughness)),
        textureFlipY: false,
        textureRepeat: MARBLE_UV_SCALE,
        physical: { ...DEFAULT_SHIELD_PHYSICAL },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
