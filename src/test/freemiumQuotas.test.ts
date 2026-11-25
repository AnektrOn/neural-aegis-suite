import { describe, expect, it } from "vitest";
import {
  FREE_DAILY_GLOBAL_PULSE,
  FREE_DAILY_GLOBAL_TOOLBOX,
  STRIPE_PRICE_AEGIS_LOGOS_AMBASSADOR_MONTHLY,
  LOGOS_AMBASSADOR_PRICE_EUR,
} from "@/lib/soloPlanQuotas";

describe("freemium quotas constants", () => {
  it("exposes daily Initiation caps", () => {
    expect(FREE_DAILY_GLOBAL_PULSE).toBe(5);
    expect(FREE_DAILY_GLOBAL_TOOLBOX).toBe(5);
  });

  it("exposes LOGOS ambassador checkout key", () => {
    expect(STRIPE_PRICE_AEGIS_LOGOS_AMBASSADOR_MONTHLY).toBe("aegis_logos_ambassador_monthly");
    expect(LOGOS_AMBASSADOR_PRICE_EUR).toBe(130);
  });
});