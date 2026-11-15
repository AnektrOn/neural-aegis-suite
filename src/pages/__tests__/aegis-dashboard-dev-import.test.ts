import { describe, expect, it } from "vitest";

describe("Aegis dashboard dev imports", () => {
  it("loads HeroLab and dev page", async () => {
    const heroLab = await import("@/features/bio-executive-dashboard/BioExecutiveHeroLab");
    expect(heroLab.BioExecutiveHeroLab).toBeTruthy();
    const dev = await import("@/pages/dev/aegis-dashboard/AegisBioExecutiveDevPage");
    expect(dev.default).toBeTruthy();
  }, 20000);
});