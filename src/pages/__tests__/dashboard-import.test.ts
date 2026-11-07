import { describe, expect, it } from "vitest";

describe("Dashboard module", () => {
  it("loads without throwing at import time", async () => {
    const mod = await import("../Dashboard");
    expect(mod.default).toBeTruthy();
  }, 15000);

  it("loads BioExecutiveMobileDashboard", async () => {
    const mod = await import("@/features/bio-executive-dashboard/BioExecutiveMobileDashboard");
    expect(mod.BioExecutiveMobileDashboard).toBeTruthy();
  });
});
