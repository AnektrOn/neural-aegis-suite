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
}

function tierFromProduct(productId?: string | null): PlanTier {
  if (productId === "aegis_ultra") return "ultra";
  if (productId === "aegis_matrix") return "matrix";
  return "free";
}

function computeActive(row: SubscriptionRow | null): boolean {
  if (!row) return false;
  const end = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
  const future = end === null || end > Date.now();
  if (["active", "trialing", "past_due"].includes(row.status)) return future;
  if (row.status === "canceled") return end !== null && end > Date.now();
  return false;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("id, product_id, price_id, status, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .eq("environment", getPaddleEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as SubscriptionRow) ?? null);
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

  const isActive = computeActive(subscription);
  const tier: PlanTier = isActive ? tierFromProduct(subscription?.product_id) : "free";

  return {
    subscription,
    loading,
    isActive,
    tier,
    isPastDue: subscription?.status === "past_due",
    refetch: fetchSubscription,
  };
}
