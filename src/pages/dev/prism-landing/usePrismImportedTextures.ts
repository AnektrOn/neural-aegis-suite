import * as THREE from "three";
import { useEffect, useState } from "react";
import { applyPbrTextureQuality } from "./applyPbrTextureQuality";
import type { PrismTextureSlot, PrismTextureUrls } from "./prismMaterialConfig";

export type LoadedPrismTextures = Partial<
  Record<PrismTextureSlot, THREE.Texture>
>;

export function usePrismImportedTextures(
  urls: PrismTextureUrls,
  flipY = false,
  repeat = 1,
): LoadedPrismTextures {
  const [textures, setTextures] = useState<LoadedPrismTextures>({});

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const slots = Object.entries(urls).filter(
      (entry): entry is [PrismTextureSlot, string] =>
        Boolean(entry[1]),
    );

    if (slots.length === 0) {
      setTextures({});
      return;
    }

    let cancelled = false;
    const loaded: THREE.Texture[] = [];

    void Promise.all(
      slots.map(([slot, url]) =>
        loader.loadAsync(url).then((tex) => {
          tex.flipY = flipY;
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(repeat, repeat);
          applyPbrTextureQuality(tex, slot, 1);
          loaded.push(tex);
          return [slot, tex] as const;
        }),
      ),
    ).then((pairs) => {
      if (cancelled) {
        loaded.forEach((t) => t.dispose());
        return;
      }
      const next: LoadedPrismTextures = {};
      for (const [slot, tex] of pairs) {
        next[slot] = tex;
      }
      setTextures(next);
    });

    return () => {
      cancelled = true;
      loaded.forEach((t) => t.dispose());
    };
  }, [JSON.stringify(urls), flipY, repeat]);

  return textures;
}
