/**
 * Path-card liquid sculptures — drop files in `./assets/`, then set filenames here.
 * Supported: png / webp / jpg / jpeg (transparent or black-keyed cutouts work best).
 * Titles are dynamic (DB); covers are fixed art keyed by category when known.
 *
 * Do not hash category % 5 alone — several real slugs collide (e.g. cap_decision
 * and miroir_relationnel both land on index 0). Prefer the explicit map below,
 * then deconflict among the cards currently on screen.
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

/**
 * Stable cover assignment for known LOGOS categories (cron batch slugs).
 * One cover each — never reuse an index across this set.
 */
export const LOGOS_PATH_CATEGORY_SCULPTURE = {
  cap_decision: 0,
  miroir_ombre: 1,
  interface_perception: 2,
  miroir_relationnel: 3,
  signal_ancrage: 4,
  // Legacy / brief aliases
  decision: 0,
  mental: 1,
  intention: 2,
  relation: 3,
  body: 4,
} as const satisfies Record<string, LogosPathSculptureIndex>;

const assetUrls = import.meta.glob<string>("./assets/*", {
  eager: true,
  query: "?url",
  import: "default",
});

function normalizeCategory(category?: string): string {
  return (category ?? "").trim().toLowerCase();
}

function hashToIndex(key: string): LogosPathSculptureIndex {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return (h % LOGOS_PATH_COUNT) as LogosPathSculptureIndex;
}

/** Preferred cover for a single category/id (may still collide across categories). */
export function logosPathSculptureIndexFor(opts: {
  category?: string;
  pathId?: string;
  fallbackSlot?: number;
}): LogosPathSculptureIndex {
  const category = normalizeCategory(opts.category);
  if (category && category in LOGOS_PATH_CATEGORY_SCULPTURE) {
    return LOGOS_PATH_CATEGORY_SCULPTURE[category as keyof typeof LOGOS_PATH_CATEGORY_SCULPTURE];
  }
  const key = category || opts.pathId?.trim().toLowerCase() || "";
  if (key) return hashToIndex(key);
  return (Math.abs(opts.fallbackSlot ?? 0) % LOGOS_PATH_COUNT) as LogosPathSculptureIndex;
}

/**
 * Assign sculptures for the cards currently shown: unique indices when possible.
 * Known categories keep their mapped cover; collisions / unknowns take a free slot.
 */
export function logosPathSculptureIndicesForPaths(
  paths: ReadonlyArray<{ id: string; category?: string }>,
): LogosPathSculptureIndex[] {
  const used = new Set<number>();
  const result: Array<LogosPathSculptureIndex | null> = paths.map(() => null);

  paths.forEach((path, i) => {
    const category = normalizeCategory(path.category);
    if (category && category in LOGOS_PATH_CATEGORY_SCULPTURE) {
      const preferred =
        LOGOS_PATH_CATEGORY_SCULPTURE[category as keyof typeof LOGOS_PATH_CATEGORY_SCULPTURE];
      if (!used.has(preferred)) {
        result[i] = preferred;
        used.add(preferred);
      }
    }
  });

  paths.forEach((path, i) => {
    if (result[i] != null) return;
    const preferred = logosPathSculptureIndexFor({
      category: path.category,
      pathId: path.id,
      fallbackSlot: i,
    });
    if (!used.has(preferred)) {
      result[i] = preferred;
      used.add(preferred);
      return;
    }
    for (let offset = 1; offset < LOGOS_PATH_COUNT; offset++) {
      const candidate = ((preferred + offset) % LOGOS_PATH_COUNT) as LogosPathSculptureIndex;
      if (!used.has(candidate)) {
        result[i] = candidate;
        used.add(candidate);
        return;
      }
    }
    result[i] = preferred;
  });

  return result as LogosPathSculptureIndex[];
}

export function logosPathSculptureSrc(index: LogosPathSculptureIndex): string | null {
  const filename = LOGOS_PATH_SCULPTURE_FILENAMES[index];
  const hit = assetUrls[`./assets/${filename}`];
  return typeof hit === "string" && hit.length > 0 ? hit : null;
}
