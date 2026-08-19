import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPaddleEnvironment } from "@/lib/paddle";

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
  if (productId === "aegis_matrix") return "matrix";
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

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [planOverride, setPlanOverride] = useState<PlanTier | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setPlanOverride(null);
      setLoading(false);
      return;
    }

    const [{ data: sub }, { data: profile }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select(
          "id, product_id, price_id, status, current_period_end, cancel_at_period_end, paddle_subscription_id",
        )
        .eq("user_id", user.id)
        .eq("environment", getPaddleEnvironment())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("profiles").select("plan_override").eq("id", user.id).maybeSingle(),
    ]);

    setSubscription((sub as SubscriptionRow) ?? null);
    const override = (profile as { plan_override?: string | null } | null)?.plan_override;
    setPlanOverride(
      override === "ultra" || override === "matrix" ? (override as PlanTier) : null,
    );
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`subscriptions-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => void fetchSubscription(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, fetchSubscription]);

  const paidActive = computeActive(subscription);
  const paidTier: PlanTier = paidActive ? tierFromProduct(subscription?.product_id) : "free";
  const tier: PlanTier = paidTier !== "free" ? paidTier : (planOverride ?? "free");
  const isPastDue = subscription?.status === "past_due";

  return {
    subscription,
    loading,
    /** Paid access is currently valid (Paddle or admin override). */
    isActive: tier !== "free",
    /** Payment failed — access is restricted until it is fixed. */
    isPastDue,
    isRestricted: isPastDue && !planOverride,
    tier,
    planOverride,
    refetch: fetchSubscription,
  };
}
