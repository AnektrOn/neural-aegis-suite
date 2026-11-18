import { describe, expect, it } from "vitest";
import {
  findNewestBatchId,
  logosPathSelectionWeight,
  pickWeightedPaths,
  LOGOS_PATH_WEIGHT_FAVORITED,
  LOGOS_PATH_WEIGHT_NEW_BATCH,
  LOGOS_PATH_WEIGHT_OLDER,
} from "../logosPathWeights";

const base = [
  {
    id: "a1",
    batchId: "old",
    batchCreatedAt: "2026-11-18T08:00:00.000Z",
    isFavorited: false,
  },
  {
    id: "a2",
    batchId: "old",
    batchCreatedAt: "2026-11-18T08:00:00.000Z",
    isFavorited: false,
  },
  {
    id: "b1",
    batchId: "new",
    batchCreatedAt: "2026-11-18T12:00:00.000Z",
    isFavorited: false,
  },
  {
    id: "b2",
    batchId: "new",
    batchCreatedAt: "2026-11-18T12:00:00.000Z",
    isFavorited: true,
  },
  {
    id: "b3",
    batchId: "new",
    batchCreatedAt: "2026-11-18T12:00:00.000Z",
    isFavorited: false,
  },
];

describe("logosPathWeights", () => {
  it("finds newest batch id", () => {
    expect(findNewestBatchId(base)).toBe("new");
  });

  it("assigns weights: favorite > new > older", () => {
    const newest = "new";
    expect(logosPathSelectionWeight(base[0], newest)).toBe(LOGOS_PATH_WEIGHT_OLDER);
    expect(logosPathSelectionWeight(base[2], newest)).toBe(LOGOS_PATH_WEIGHT_NEW_BATCH);
    expect(logosPathSelectionWeight(base[3], newest)).toBe(LOGOS_PATH_WEIGHT_FAVORITED);
  });

  it("picks three distinct ids with deterministic random", () => {
    // Pool order weights: 0.5, 0.5, 1, 2, 1 (total 5). r=0.5*5=2.5 → favorited b2.
    const seq = [0.5, 0.01, 0.01];
    let i = 0;
    const picked = pickWeightedPaths(base, 3, () => seq[i++] ?? 0);
    expect(picked).toHaveLength(3);
    expect(new Set(picked.map((p) => p.id)).size).toBe(3);
    expect(picked[0].id).toBe("b2");
  });

  it("returns all when fewer than requested", () => {
    const picked = pickWeightedPaths(base.slice(0, 2), 3, () => 0);
    expect(picked).toHaveLength(2);
  });
});
