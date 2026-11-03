import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  buildDecisionAnalytics,
  type DecisionRecord,
} from "@/lib/decisionAnalytics";
import { getUserMaturityProfile } from "@/lib/userMaturity";
import { fetchDecisionJournal } from "@/hooks/useDecisionJournal";
import { useSubscription, type PlanTier } from "@/hooks/useSubscription";

export interface BioExecutiveHeroData {
  memoryDays: number | null;
  decisionsCount: number | null;
  contactsCount: number | null;
  placesCount: number | null;
  pendingCount: number | null;
  oldestPendingDays: number | null;
  maxPendingPriority: number | null;
  nextDeferralDate: string | null;
  avgResolutionHours: number | null;
  relationsTotal: number | null;
  lastContactDays: number | null;
  stress: number | null;
  stressVsOwnAvg: number | null;
  loggedDaysOf14: number | null;
  reportReady: boolean;
  tier: PlanTier;
}

const QUERY_KEY = "bio-executive-hero";

const STATUS_LABELS = {
  pending: "pending",
  decided: "decided",
  deferred: "deferred",
} as const;

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function nullableCount(count: number | null | undefined): number | null {
  if (count == null) return null;
  return count;
}

export async function fetchBioExecutiveHeroPayload(userId: string): Promise<Omit<BioExecutiveHeroData, "tier">> {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [
    maturity,
    placesRes,
    decisionsCountRes,
    contactsCountRes,
    lastTouchRes,
    moodRes,
    decisions,
  ] = await Promise.all([
    getUserMaturityProfile(userId),
    supabase
      .from("user_places")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("decisions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("people_contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("relation_quality_history")
      .select("recorded_at")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(1),
    supabase
      .from("mood_entries")
      .select("stress, logged_at")
      .eq("user_id", userId)
      .gte("logged_at", fourteenDaysAgo.toISOString())
      .order("logged_at", { ascending: false }),
    fetchDecisionJournal(userId),
  ]);

  const analytics = buildDecisionAnalytics(decisions, STATUS_LABELS, "fr-FR");

  const pending = decisions.filter((d) => d.status === "pending");
  const pendingCount = pending.length > 0 ? pending.length : null;
  const oldestPendingDays =
    pending.length > 0 && analytics.oldestPendingDays > 0 ? analytics.oldestPendingDays : null;

  let maxPendingPriority: number | null = null;
  if (pending.length > 0) {
    maxPendingPriority = Math.max(...pending.map((p) => Math.round(p.priority)));
  }

  const now = Date.now();
  const upcomingDeferrals = decisions
    .filter(
      (d): d is DecisionRecord & { deferred_until: string } =>
        d.status === "deferred" && !!d.deferred_until && new Date(d.deferred_until).getTime() >= now,
    )
    .map((d) => d.deferred_until)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const nextDeferralDate = upcomingDeferrals[0] ?? null;

  const avgResolutionHours =
    analytics.decidedCount > 0 && analytics.avgResolutionHours > 0
      ? analytics.avgResolutionHours
      : null;

  const lastTouch = (lastTouchRes.data as { recorded_at: string }[] | null)?.[0]?.recorded_at;
  const lastContactDays = lastTouch ? daysSince(lastTouch) : null;

  const moods = (moodRes.data ?? []) as { stress: number | null; logged_at: string }[];
  const latestWithStress = moods.find((m) => typeof m.stress === "number" && !Number.isNaN(m.stress));
  const stress = latestWithStress?.stress ?? null;

  const stressSamples = moods
    .map((m) => m.stress)
    .filter((s): s is number => typeof s === "number" && !Number.isNaN(s));
  const stressAvg =
    stressSamples.length > 0
      ? stressSamples.reduce((a, b) => a + b, 0) / stressSamples.length
      : null;
  const stressVsOwnAvg =
    stress != null && stressAvg != null ? +(stress - stressAvg).toFixed(1) : null;

  const loggedDays = new Set(
    moods.map((m) => new Date(m.logged_at).toISOString().split("T")[0]),
  );
  const loggedDaysOf14 = loggedDays.size > 0 ? loggedDays.size : null;

  const contactsCount = nullableCount(contactsCountRes.count);
  const decisionsCount = nullableCount(decisionsCountRes.count);

  return {
    memoryDays: maturity.daysActive,
    decisionsCount,
    contactsCount,
    placesCount: nullableCount(placesRes.count),
    pendingCount,
    oldestPendingDays,
    maxPendingPriority,
    nextDeferralDate,
    avgResolutionHours,
    relationsTotal: contactsCount,
    lastContactDays,
    stress,
    stressVsOwnAvg,
    loggedDaysOf14,
    reportReady: maturity.hasArchetypeProfile,
  };
}

export function useBioExecutiveHero(userId: string | undefined) {
  const { tier, loading: tierLoading } = useSubscription();

  const query = useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: () => fetchBioExecutiveHeroPayload(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const data = useMemo((): BioExecutiveHeroData | null => {
    if (!query.data) return null;
    return { ...query.data, tier };
  }, [query.data, tier]);

  return {
    heroData: data,
    isLoading: query.isLoading || tierLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
