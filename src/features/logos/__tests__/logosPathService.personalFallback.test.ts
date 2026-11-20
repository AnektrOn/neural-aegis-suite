import { describe, expect, it } from "vitest";

/** Mirrors listAvailableLogosPaths personal-vs-shared branch. */
function pickPathPool(
  personal: { id: string; daysUntilExpiry: number }[],
  usedIds: Set<string>,
  shared: { id: string }[],
) {
  const availablePersonal = personal.filter(
    (path) => path.daysUntilExpiry > 0 && !usedIds.has(path.id),
  );
  if (availablePersonal.length > 0) return availablePersonal;
  return shared;
}

describe("logosPathService personal fallback", () => {
  it("falls back to shared paths when personal batch exists but none are available", () => {
    const personal = [
      { id: "batch:0", daysUntilExpiry: 2 },
      { id: "batch:1", daysUntilExpiry: 1 },
    ];
    const used = new Set(["batch:0", "batch:1"]);
    const shared = [{ id: "uuid-1" }, { id: "uuid-2" }];
    expect(pickPathPool(personal, used, shared)).toEqual(shared);
  });

  it("keeps personal paths when at least one is available", () => {
    const personal = [
      { id: "batch:0", daysUntilExpiry: 2 },
      { id: "batch:1", daysUntilExpiry: -1 },
    ];
    const shared = [{ id: "uuid-1" }];
    expect(pickPathPool(personal, new Set(), shared)).toEqual([personal[0]]);
  });
});