import { describe, expect, it } from "vitest";
import { TOOLBOX_NEBULA_GROUPS } from "./toolboxNebulaGroups";
import {
  BODY_NEBULA_SLUGS,
  BODY_MOVE_NEBULA_SLUGS,
  BODY_SCAN_NEBULA_SLUGS,
} from "./toolboxBodyNebula";
import {
  isMatterVisualSlug,
  isParticleVisualSlug,
  visualLanguageForSlug,
} from "./toolboxNebulaVisuals";

describe("body nebula family", () => {
  const bodyGroup = TOOLBOX_NEBULA_GROUPS.find((g) => g.id === "body");
  if (!bodyGroup) throw new Error("missing body group");

  it("covers every slug in the Corps & somatique group", () => {
    for (const slug of bodyGroup.slugs) {
      expect(BODY_NEBULA_SLUGS.has(slug)).toBe(true);
    }
    expect(BODY_NEBULA_SLUGS.size).toBe(bodyGroup.slugs.length);
  });

  it("routes scan and move subsets without overlap", () => {
    expect(BODY_SCAN_NEBULA_SLUGS.size).toBe(2);
    expect(BODY_MOVE_NEBULA_SLUGS.size).toBe(6);
    for (const slug of BODY_SCAN_NEBULA_SLUGS) {
      expect(BODY_MOVE_NEBULA_SLUGS.has(slug)).toBe(false);
    }
  });

  it("uses matter visual language for the whole body family", () => {
    for (const slug of bodyGroup.slugs) {
      expect(visualLanguageForSlug(slug)).toBe("matter");
      expect(isMatterVisualSlug(slug)).toBe(true);
      expect(isParticleVisualSlug(slug)).toBe(false);
    }
  });
});
