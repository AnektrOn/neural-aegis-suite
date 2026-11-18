/**
 * Path-card liquid sculptures — drop files in `./assets/`, then set filenames here.
 * Supported: png / webp / jpg / jpeg (transparent or black-keyed cutouts work best).
 */
export const LOGOS_PATH_COUNT = 5;

export type LogosPathSculptureIndex = 0 | 1 | 2 | 3 | 4;

/** Seconds from vortex → settled PNG (auto, no click). */
export const LOGOS_PATH_SCULPTURE_ASSEMBLE_SEC = 10;

export const LOGOS_PATH_SCULPTURE_FILENAMES = [
  "path-1-cover.png",
  "path-2-cover.png",
  "path-3-cover.png",
  "path-4-cover.png",
  "path-5-cover.png",
] as const satisfies readonly string[];

const assetUrls = import.meta.glob<string>("./assets/*", {
  eager: true,
  query: "?url",
  import: "default",
});

export function logosPathSculptureSrc(index: LogosPathSculptureIndex): string | null {
  const filename = LOGOS_PATH_SCULPTURE_FILENAMES[index];
  const hit = assetUrls[`./assets/${filename}`];
  return typeof hit === "string" && hit.length > 0 ? hit : null;
}
