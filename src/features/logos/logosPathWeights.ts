/** Weighted opening-path selection for LOGOS. */

export const LOGOS_PATH_WEIGHT_NEW_BATCH = 1;
export const LOGOS_PATH_WEIGHT_OLDER = 0.5;
export const LOGOS_PATH_WEIGHT_FAVORITED = 2;
export const LOGOS_OPENING_PATH_COUNT = 3;

export type LogosWeightedPathCandidate = {
  id: string;
  batchId: string;
  batchCreatedAt: string;
  isFavorited: boolean;
};

export function logosPathSelectionWeight(
  candidate: Pick<LogosWeightedPathCandidate, "batchId" | "isFavorited">,
  newestBatchId: string | null,
): number {
  if (candidate.isFavorited) return LOGOS_PATH_WEIGHT_FAVORITED;
  if (newestBatchId && candidate.batchId === newestBatchId) {
    return LOGOS_PATH_WEIGHT_NEW_BATCH;
  }
  return LOGOS_PATH_WEIGHT_OLDER;
}

/** Newest batch among the available pool (by batchCreatedAt). */
export function findNewestBatchId(
  candidates: ReadonlyArray<Pick<LogosWeightedPathCandidate, "batchId" | "batchCreatedAt">>,
): string | null {
  if (candidates.length === 0) return null;
  let best = candidates[0];
  for (let i = 1; i < candidates.length; i++) {
    const c = candidates[i];
    if (c.batchCreatedAt > best.batchCreatedAt) best = c;
  }
  return best.batchId;
}

/**
 * Weighted random sample without replacement.
 * `random` must return [0, 1).
 */
export function pickWeightedPaths<T extends LogosWeightedPathCandidate>(
  candidates: ReadonlyArray<T>,
  count: number = LOGOS_OPENING_PATH_COUNT,
  random: () => number = Math.random,
): T[] {
  if (count <= 0 || candidates.length === 0) return [];
  const newestBatchId = findNewestBatchId(candidates);
  const pool = candidates.map((item) => ({
    item,
    weight: logosPathSelectionWeight(item, newestBatchId),
  }));
  const picked: T[] = [];
  const take = Math.min(count, pool.length);

  for (let n = 0; n < take; n++) {
    const total = pool.reduce((sum, row) => sum + row.weight, 0);
    if (total <= 0) break;
    let r = random() * total;
    let index = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) {
        index = i;
        break;
      }
    }
    picked.push(pool[index].item);
    pool.splice(index, 1);
  }

  return picked;
}
