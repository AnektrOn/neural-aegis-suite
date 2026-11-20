import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isLogosProduct } from "@/lib/logosEntitlement";


export type PlanTier = "free" | "matrix" | "ultra";

export interface SubscriptionRow {
  id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  paddle_subscription_id: string;
}

function tierFromProduct(productId?: string | null): PlanTier {
  if (productId === "aegis_ultra") return "ultra";
  if (
    productId === "aegis_matrix" ||
    productId === "aegis_solo" ||
    productId === "aegis_solo_logos" ||
    productId === "aegis_founders_lifetime"
  ) {
    return "matrix";
  }
  return "free";
}

/**
 * Business rules:
 * - active / trialing → access while the period is not over
 * - canceled → access kept until the end of the paid period
 * - past_due → access restricted immediately (payment must be fixed)
 */
function computeActive(row: SubscriptionRow | null): boolean {
  if (!row) return false;
  const end = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
  const future = end === null || end > Date.now();
  if (row.status === "active" || row.status === "trialing") return future;
  if (row.status === "canceled") return end !== null && end > Date.now();
  return false;
}

/** Rows arrive newest first; retain the strongest valid grant, not just the latest purchase. */
function selectAccessSubscription(rows: SubscriptionRow[]): SubscriptionRow | null {
  const rank: Record<PlanTier, number> = { free: 0, matrix: 1, ultra: 2 };
  let selected: SubscriptionRow | null = null;
  for (const row of rows) {
    if (!computeActive(row) || tierFromProduct(row.product_id) === "free") continue;
    if (!selected || rank[tierFromProduct(row.product_id)] > rank[tierFromProduct(selected.product_id)]) {
      selected = row;
    }
  }
  return selected ?? rows[0] ?? null;
}

type CachedSubscriptionData = {
  subscription: SubscriptionRow | null;
  logosSubscription: SubscriptionRow | null;
  planOverride: PlanTier | null;
  ts: number;
};

const subscriptionMemCache = new Map<string, CachedSubscriptionData>();
const subscriptionInflight = new Map<string, Promise<CachedSubscriptionData>>();
const SUBSCRIPTION_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export function useSubscription() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const initialCached = userId ? subscriptionMemCache.get(userId) : null;
  const hasFreshCache = Boolean(initialCached && Date.now() - initialCached.ts < SUBSCRIPTION_CACHE_TTL_MS);

  const [subscription, setSubscription] = useState<SubscriptionRow | null>(
    initialCached?.subscription ?? null,
  );
  const [logosSubscription, setLogosSubscription] = useState<SubscriptionRow | null>(
    initialCached?.logosSubscription ?? null,
  );
  const [planOverride, setPlanOverride] = useState<PlanTier | null>(
    initialCached?.planOverride ?? null,
  );
  const [loading, setLoading] = useState(!hasFreshCache);

  const fetchSubscription = useCallback(async (force = false) => {
    if (!userId) {
      setSubscription(null);
      setLogosSubscription(null);
      setPlanOverride(null);
      setLoading(false);
      return;
    }

    if (!force) {
      const cached = subscriptionMemCache.get(userId);
      if (cached && Date.now() - cached.ts < SUBSCRIPTION_CACHE_TTL_MS) {
        setSubscription(cached.subscription);
        setLogosSubscription(cached.logosSubscription);
        setPlanOverride(cached.planOverride);
        setLoading(false);
        return;
      }
    }

    let p = subscriptionInflight.get(userId);
    if (!p) {
      p = (async () => {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("fetchSubscription timeout")), 5000)
        );

        try {
          const [{ data: sub }, { data: logosSub }, { data: profile }] = await Promise.race([
            Promise.all([
              supabase
                .from("subscriptions")
                .select(
                  "id, product_id, price_id, status, current_period_end, cancel_at_period_end, paddle_subscription_id",
                )
                .eq("user_id", userId)
                .order("created_at", { ascending: false }),
              supabase
                .from("subscriptions")
                .select(
                  "id, product_id, price_id, status, current_period_end, cancel_at_period_end, paddle_subscription_id",
                )
                .eq("user_id", userId)
                .eq("product_id", "aegis_solo_logos")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
              supabase.from("profiles").select("plan_override").eq("id", userId).maybeSingle(),
            ]),
            timeoutPromise,
          ]);

          const chosenSub = selectAccessSubscription((sub as SubscriptionRow[] | null) ?? []);
          const chosenLogos = (logosSub as SubscriptionRow) ?? null;
          const override = (profile as { plan_override?: string | null } | null)?.plan_override;
          const chosenOverride =
            override === "ultra" || override === "matrix" ? (override as PlanTier) : null;

          const data: CachedSubscriptionData = {
            subscription: chosenSub,
            logosSubscription: chosenLogos,
            planOverride: chosenOverride,
            ts: Date.now(),
          };
          subscriptionMemCache.set(userId, data);
          return data;
        } catch (e) {
          console.warn("[useSubscription] fetch failed or timed out", e);
          const fallback: CachedSubscriptionData = {
            subscription: null,
            logosSubscription: null,
            planOverride: null,
            ts: Date.now(),
          };
          return fallback;
        } finally {
          subscriptionInflight.delete(userId);
        }
      })();
      subscriptionInflight.set(userId, p);
    }

    const res = await p;
    setSubscription(res.subscription);
    setLogosSubscription(res.logosSubscription);
    setPlanOverride(res.planOverride);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`subscriptions-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => void fetchSubscription(true),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, fetchSubscription]);

  const paidActive = computeActive(subscription);
  const paidTier: PlanTier = paidActive ? tierFromProduct(subscription?.product_id) : "free";
  const tier: PlanTier = paidTier !== "free" ? paidTier : (planOverride ?? "free");
  const isPastDue = subscription?.status === "past_due";
  const logosPaidActive = computeActive(logosSubscription);
  const hasLogos =
    logosPaidActive ||
    (paidActive && isLogosProduct(subscription?.product_id));

  return {
    subscription,
    logosSubscription,
    hasLogos,
    loading,
    /** Paid access is currently valid (Paddle or admin override). */
    isActive: tier !== "free",
    /** Payment failed — access is restricted until it is fixed. */
    isPastDue,
    isRestricted: isPastDue && !planOverride,
    tier,
    planOverride,
    refetch: () => fetchSubscription(true),
  };
}
