import { describe, expect, it } from "vitest";
import { BUILTIN_TOOLBOX_CONTENT_TYPES } from "@/lib/toolbox-content-type-definitions";
import { EXTRA_TOOLBOX_DEMO_TYPES } from "./buildDemoToolboxItem";
import {
  listUngroupedNebulaSlugs,
  TOOLBOX_NEBULA_GROUPS,
} from "./toolboxNebulaGroups";

describe("toolboxNebulaGroups", () => {
  const allSlugs = [
    ...BUILTIN_TOOLBOX_CONTENT_TYPES.map((d) => d.slug),
    ...EXTRA_TOOLBOX_DEMO_TYPES.map((e) => e.slug),
  ];

  it("covers every demo slug exactly once", () => {
    const flat = TOOLBOX_NEBULA_GROUPS.flatMap((g) => g.slugs);
    expect(listUngroupedNebulaSlugs(allSlugs)).toEqual([]);
    expect(new Set(flat).size).toBe(flat.length);
    expect(flat.length).toBe(allSlugs.length);
  });

  it("marks merge candidates that exist in the same group", () => {
    for (const group of TOOLBOX_NEBULA_GROUPS) {
      for (const pair of group.merge_candidates ?? []) {
        for (const slug of pair) {
          expect(group.slugs).toContain(slug);
        }
      }
      if (group.primary) {
        expect(group.slugs).toContain(group.primary);
      }
    }
  });
});
