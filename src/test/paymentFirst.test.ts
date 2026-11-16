import { describe, expect, it, vi } from "vitest";
import { canProvisionPaidAccount, resolvePaidAccount } from "../../supabase/functions/_shared/payment-first";

const paid = { status: "complete", payment_status: "paid", metadata: { priceId: "aegis_solo_monthly" }, customer_details: { email: "buyer@example.com" } };

describe("Payment before account creation", () => {
  it("never invites or looks up an account before payment", async () => {
    const accounts = { find: vi.fn(), invite: vi.fn() };
    await expect(resolvePaidAccount({ ...paid, payment_status: "unpaid" }, accounts)).rejects.toThrow("Payment not confirmed");
    expect(accounts.find).not.toHaveBeenCalled();
    expect(accounts.invite).not.toHaveBeenCalled();
  });
  it("creates the account only after paid checkout using Stripe's email", async () => {
    const accounts = { find: vi.fn().mockResolvedValue(null), invite: vi.fn().mockResolvedValue("new-user") };
    expect(await resolvePaidAccount(paid, accounts)).toBe("new-user");
    expect(accounts.invite).toHaveBeenCalledWith("buyer@example.com");
  });
  it("preserves an existing account and avoids a duplicate invitation", async () => {
    const accounts = { find: vi.fn().mockResolvedValue("existing-user"), invite: vi.fn() };
    expect(await resolvePaidAccount(paid, accounts)).toBe("existing-user");
    expect(accounts.invite).not.toHaveBeenCalled();
  });
  it("requires completed checkout and an allowed Solo plan", () => {
    expect(canProvisionPaidAccount({ ...paid, status: "open" })).toBe(false);
    expect(canProvisionPaidAccount({ ...paid, metadata: { priceId: "unknown" } })).toBe(false);
    expect(canProvisionPaidAccount(paid)).toBe(true);
  });
  it("accepts a Stripe-confirmed fully discounted checkout", () => {
    expect(canProvisionPaidAccount({ ...paid, payment_status: "no_payment_required" })).toBe(true);
  });
});