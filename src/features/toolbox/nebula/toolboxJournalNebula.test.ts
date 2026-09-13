import { describe, expect, it } from "vitest";
import { TOOLBOX_NEBULA_GROUPS } from "./toolboxNebulaGroups";
import { JOURNAL_NEBULA_SLUGS, journalNebulaMode } from "./toolboxJournalNebula";
import { isParticleVisualSlug, visualLanguageForSlug } from "./toolboxNebulaVisuals";
import { engineIdForSlug } from "./toolboxNebulaVisuals";

describe("journal nebula family", () => {
  const journalGroup = TOOLBOX_NEBULA_GROUPS.find((g) => g.id === "journal");
  if (!journalGroup) throw new Error("missing journal group");

  it("covers every slug in the journal group", () => {
    for (const slug of journalGroup.slugs) {
      expect(JOURNAL_NEBULA_SLUGS.has(slug)).toBe(true);
    }
    expect(JOURNAL_NEBULA_SLUGS.size).toBe(journalGroup.slugs.length);
  });

  it("uses stream engine and particles for all journal slugs", () => {
    for (const slug of journalGroup.slugs) {
      expect(engineIdForSlug(slug)).toBe("stream");
      expect(visualLanguageForSlug(slug)).toBe("particles");
      expect(isParticleVisualSlug(slug)).toBe(true);
    }
  });

  it("assigns journal modes", () => {
    expect(journalNebulaMode("journal_prompt")).toBe("prompt");
    expect(journalNebulaMode("journal_stream")).toBe("timed");
    expect(journalNebulaMode("worry_dump")).toBe("steps");
    expect(journalNebulaMode("evening_review")).toBe("steps");
  });
});
