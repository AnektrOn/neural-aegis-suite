import { describe, expect, it } from "vitest";
import { isLogosProduct, LOGOS_PRODUCT_IDS } from "@/lib/logosEntitlement";

describe("logosEntitlement", () => {
  it("recognizes standalone ambassador and combo products", () => {
    expect(LOGOS_PRODUCT_IDS).toContain("aegis_logos");
    expect(isLogosProduct("aegis_logos")).toBe(true);
    expect(isLogosProduct("aegis_solo_logos")).toBe(true);
    expect(isLogosProduct("aegis_solo")).toBe(false);
  });
});