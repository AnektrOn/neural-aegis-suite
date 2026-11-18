import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  override: null as string | null,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "founder-id" } }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      let product: unknown;
      let limit: number | undefined;
      const data = () => table === "profiles" ? { plan_override: db.override }
        : db.rows.filter(row => !product || row.product_id === product).slice(0, limit);
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => { if (key === "product_id") product = value; return query; },
        order: () => query,
        limit: (value: number) => { limit = value; return query; },
        maybeSingle: async () => ({ data: table === "profiles" ? data() : (data() as unknown[])[0] ?? null }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: data() }).then(resolve),
      };
      return query;
    },
    channel: () => { const channel = { on: () => channel, subscribe: () => channel }; return channel; },
    removeChannel: vi.fn(),
  },
}));
import { useSubscription } from "./useSubscription";

const founder = {
  id: "founder", product_id: "aegis_founders_lifetime", price_id: "founders",
  status: "active", current_period_end: "2099-12-31T23:59:59.000Z",
  cancel_at_period_end: false, paddle_subscription_id: "pi_founder",
};
const logos = {
  ...founder, id: "logos", product_id: "aegis_solo_logos", price_id: "logos",
  paddle_subscription_id: "sub_logos", status: "canceled", current_period_end: "2026-11-17T00:00:00.000Z",
};

describe("independent lifetime and recurring access", () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-18T00:00:00Z")); db.rows = []; db.override = null; });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it("keeps Founders Solo lifetime access after the newer LOGOS subscription expires", async () => {
    db.rows = [logos, founder];
    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tier).toBe("matrix");
    expect(result.current.isActive).toBe(true);
    expect(result.current.subscription?.id).toBe("founder");
    expect(result.current.hasLogos).toBe(false);
  });

  it("keeps LOGOS until cancellation takes effect, then returns to lifetime Solo on refetch", async () => {
    db.rows = [{ ...logos, current_period_end: "2026-12-01T00:00:00Z" }, founder];
    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.hasLogos).toBe(true));
    db.rows = [logos, founder];
    await act(async () => { await result.current.refetch(); });
    expect(result.current.hasLogos).toBe(false);
    expect(result.current.tier).toBe("matrix");
    expect(result.current.isActive).toBe(true);
  });

  it("does not grant lifetime access when the founder purchase is also expired", async () => {
    db.rows = [logos, { ...founder, status: "canceled", current_period_end: logos.current_period_end }];
    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isActive).toBe(false);
    expect(result.current.tier).toBe("free");
  });

  it("does not downgrade an active Ultra purchase when Solo was purchased later", async () => {
    db.rows = [founder, { ...founder, id: "ultra", product_id: "aegis_ultra" }];
    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tier).toBe("ultra");
  });

  it("preserves AppSumo Solo lifetime without granting LOGOS", async () => {
    db.rows = [logos, { ...founder, product_id: "aegis_solo", price_id: "appsumo_lifetime", current_period_end: null }];
    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tier).toBe("matrix");
    expect(result.current.hasLogos).toBe(false);
  });
});