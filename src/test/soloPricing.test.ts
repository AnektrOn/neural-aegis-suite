import { describe, expect, it } from "vitest";
import { SOLO_PRICING } from "../pages/aegis-landing/soloPricing";

describe("Homepage Solo catalogue", () => {
  it("offers Solo at 35 euros monthly", () => {
    expect(SOLO_PRICING.find(p => p.id === "aegis_solo_monthly")).toMatchObject({ amount: 35, interval: "month" });
  });
  it("offers Solo with LOGOS at 110 euros monthly", () => {
    expect(SOLO_PRICING.find(p => p.id === "aegis_solo_logos_monthly")).toMatchObject({ amount: 110, interval: "month" });
  });
  it("offers lifetime Founders at 350 euros once for at most 20 seats", () => {
    expect(SOLO_PRICING.find(p => p.id === "aegis_founders_lifetime")).toMatchObject({ amount: 350, interval: "once", maxSeats: 20 });
  });
});