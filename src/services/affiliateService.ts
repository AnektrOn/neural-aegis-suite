import { supabase } from "@/integrations/supabase/client";

export const REFERRAL_STORAGE_KEY = "aegis:ref-code";

export type AffiliateReferralRow = {
  id: string;
  label: string;
  status: string;
  created_at: string;
  converted_at: string | null;
  plan: string | null;
  plan_status: string | null;
  billing_cycle?: "monthly" | "yearly" | "installment" | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  commission_cents: number;
  gross_cents?: number;

  payments_count: number;
  last_payment_at: string | null;
};

export type AffiliateDashboard = {
  is_affiliate: boolean;
  code?: string;
  status?: string;
  commission_rate?: number;
  clicks?: number;
  signups?: number;
  conversions?: number;
  pending_cents?: number;
  paid_cents?: number;
  referrals?: AffiliateReferralRow[];
  commissions?: {
    id: string;
    commission_cents: number;
    amount_cents: number;
    currency: string;
    status: string;
    product_id: string | null;
    occurred_at: string;
  }[];
};

export type AdminAffiliate = {
  id: string;
  user_id: string;
  email: string | null;
  code: string;
  status: string;
  commission_rate: number;
  notes: string | null;
  created_at: string;
  clicks: number;
  signups: number;
  conversions: number;
  pending_cents: number;
  paid_cents: number;
};

export type AdminCommission = {
  id: string;
  affiliate_id: string;
  affiliate_code: string;
  affiliate_email: string | null;
  referred_email: string | null;
  amount_cents: number;
  commission_cents: number;
  currency: string;
  status: string;
  product_id: string | null;
  occurred_at: string;
  paid_at: string | null;
};

export type AdminTrackingPath = { path: string; clicks: number };

export type AdminTrackingReferral = {
  id: string;
  email: string | null;
  label: string;
  status: string;
  created_at: string;
  converted_at: string | null;
  plan: string | null;
};

export type AdminAffiliateTracked = AdminAffiliate & {
  display_name?: string | null;
  clicks_30d?: number;
  signups_30d?: number;
  conversions_30d?: number;
  last_click_at?: string | null;
  top_paths?: AdminTrackingPath[];
  recent_referrals?: AdminTrackingReferral[];
};

export type AdminAffiliateTracking = {
  days: number;
  kpis: {
    affiliates: number;
    active: number;
    clicks: number;
    signups: number;
    conversions: number;
    pending_cents: number;
    paid_cents: number;
    clicks_30d: number;
    signups_30d: number;
    conversions_30d: number;
    gross_30d_cents: number;
    commission_30d_cents: number;
  };
  funnel: { clicks: number; signups: number; conversions: number };
  daily: { day: string; clicks: number; signups: number; conversions: number }[];
  landing_paths: AdminTrackingPath[];
  affiliates: AdminAffiliateTracked[];
};

/** Referral link shared by an ambassador. */
export function buildReferralLink(code: string): string {
  const origin = "https://aegis.humancatalystbeacon.com";
  return `${origin}/pricing?ref=${encodeURIComponent(code)}`;
}

export function formatMoney(cents: number, currency = "EUR", locale = "fr-FR"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format((cents ?? 0) / 100);
}

export async function trackReferralClick(code: string, path: string) {
  await supabase.rpc("track_affiliate_click", { p_code: code, p_path: path });
}

export async function claimReferral(code: string) {
  const { data, error } = await supabase.rpc("claim_referral", { p_code: code });
  if (error) throw error;
  return data as { ok: boolean; reason?: string };
}

export async function fetchMyAffiliateDashboard(): Promise<AffiliateDashboard> {
  const { data, error } = await supabase.rpc("get_my_affiliate_dashboard");
  if (error) throw error;
  return (data ?? { is_affiliate: false }) as unknown as AffiliateDashboard;
}

/** Retries transient network failures (aborted fetch, gateway hiccups). */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const msg = String((e as { message?: string })?.message ?? e);
      const transient = /network|fetch|timeout|aborted|failed to fetch/i.test(msg);
      if (!transient || i === attempts - 1) throw e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastError;
}

const candidateCacheKey = "aegis:affiliate-candidates";
let candidatesRequest: Promise<AffiliateCandidate[]> | null = null;

function readCandidateCache(): AffiliateCandidate[] | null {
  try {
    const raw = window.sessionStorage.getItem(candidateCacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; candidates?: AffiliateCandidate[] };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > 5 * 60_000 || !Array.isArray(parsed.candidates)) {
      return null;
    }
    return parsed.candidates;
  } catch {
    return null;
  }
}

function writeCandidateCache(candidates: AffiliateCandidate[]) {
  try {
    window.sessionStorage.setItem(
      candidateCacheKey,
      JSON.stringify({ savedAt: Date.now(), candidates }),
    );
  } catch {
    // Storage can be unavailable in private browsing; fresh data still works.
  }
}

export async function fetchAffiliatesAdmin(): Promise<AdminAffiliate[]> {
  return withRetry(async () => {
    const { data, error } = await supabase.rpc("get_affiliates_admin_overview");
    if (error) throw error;
    return (data ?? []) as unknown as AdminAffiliate[];
  });
}

function emptyTracking(days: number, affiliates: AdminAffiliate[] = []): AdminAffiliateTracking {
  const clicks = affiliates.reduce((n, a) => n + (a.clicks ?? 0), 0);
  const signups = affiliates.reduce((n, a) => n + (a.signups ?? 0), 0);
  const conversions = affiliates.reduce((n, a) => n + (a.conversions ?? 0), 0);
  return {
    days,
    kpis: {
      affiliates: affiliates.length,
      active: affiliates.filter((a) => a.status === "active").length,
      clicks,
      signups,
      conversions,
      pending_cents: affiliates.reduce((n, a) => n + (a.pending_cents ?? 0), 0),
      paid_cents: affiliates.reduce((n, a) => n + (a.paid_cents ?? 0), 0),
      clicks_30d: 0,
      signups_30d: 0,
      conversions_30d: 0,
      gross_30d_cents: 0,
      commission_30d_cents: 0,
    },
    funnel: { clicks, signups, conversions },
    daily: [],
    landing_paths: [],
    affiliates,
  };
}

function isMissingRpc(error: { message?: string; code?: string } | null): boolean {
  const msg = error?.message ?? "";
  return (
    error?.code === "PGRST202" ||
    error?.code === "42883" ||
    /does not exist|schema cache|could not find the function/i.test(msg)
  );
}

async function buildTrackingFromTables(
  days: number,
  affiliates: AdminAffiliate[],
): Promise<AdminAffiliateTracking> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const [clicksRes, referralsRes, commissionsRes] = await Promise.all([
    supabase
      .from("affiliate_clicks")
      .select("affiliate_id, landing_path, created_at")
      .gte("created_at", since),
    supabase.from("referrals").select("affiliate_id, status, created_at, converted_at"),
    supabase
      .from("affiliate_commissions")
      .select("amount_cents, commission_cents, occurred_at")
      .gte("occurred_at", since),
  ]);

  const clicks = clicksRes.data ?? [];
  const referrals = referralsRes.data ?? [];
  const commissions = commissionsRes.data ?? [];
  const fallback = emptyTracking(days, affiliates);

  if (clicksRes.error && referralsRes.error) return fallback;

  const dayKey = (iso: string) => iso.slice(0, 10);
  const dailyMap = new Map<string, { day: string; clicks: number; signups: number; conversions: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    dailyMap.set(day, { day, clicks: 0, signups: 0, conversions: 0 });
  }
  for (const c of clicks) {
    const row = dailyMap.get(dayKey(c.created_at));
    if (row) row.clicks += 1;
  }
  for (const r of referrals) {
    const signupDay = dailyMap.get(dayKey(r.created_at));
    if (signupDay) signupDay.signups += 1;
    if (r.status === "converted") {
      const convDay = dailyMap.get(dayKey(r.converted_at ?? r.created_at));
      if (convDay) convDay.conversions += 1;
    }
  }

  const pathMap = new Map<string, number>();
  for (const c of clicks) {
    const path = c.landing_path?.trim() || "/pricing";
    pathMap.set(path, (pathMap.get(path) ?? 0) + 1);
  }

  const clicksByAff = new Map<string, number>();
  const lastClick = new Map<string, string>();
  for (const c of clicks) {
    clicksByAff.set(c.affiliate_id, (clicksByAff.get(c.affiliate_id) ?? 0) + 1);
    const prev = lastClick.get(c.affiliate_id);
    if (!prev || c.created_at > prev) lastClick.set(c.affiliate_id, c.created_at);
  }
  const signupsByAff = new Map<string, number>();
  const convByAff = new Map<string, number>();
  for (const r of referrals) {
    if (r.created_at >= since) {
      signupsByAff.set(r.affiliate_id, (signupsByAff.get(r.affiliate_id) ?? 0) + 1);
    }
    if (r.status === "converted" && (r.converted_at ?? r.created_at) >= since) {
      convByAff.set(r.affiliate_id, (convByAff.get(r.affiliate_id) ?? 0) + 1);
    }
  }

  return {
    days,
    kpis: {
      ...fallback.kpis,
      clicks_30d: clicks.length,
      signups_30d: referrals.filter((r) => r.created_at >= since).length,
      conversions_30d: referrals.filter(
        (r) => r.status === "converted" && (r.converted_at ?? r.created_at) >= since,
      ).length,
      gross_30d_cents: commissions.reduce((n, c) => n + (c.amount_cents ?? 0), 0),
      commission_30d_cents: commissions.reduce((n, c) => n + (c.commission_cents ?? 0), 0),
    },
    funnel: fallback.funnel,
    daily: [...dailyMap.values()],
    landing_paths: [...pathMap.entries()]
      .map(([path, n]) => ({ path, clicks: n }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 12),
    affiliates: affiliates.map((a) => ({
      ...a,
      clicks_30d: clicksByAff.get(a.id) ?? 0,
      signups_30d: signupsByAff.get(a.id) ?? 0,
      conversions_30d: convByAff.get(a.id) ?? 0,
      last_click_at: lastClick.get(a.id) ?? null,
    })),
  };
}

export async function fetchAffiliatesAdminTracking(
  days = 30,
): Promise<AdminAffiliateTracking> {
  return withRetry(async () => {
    const { data, error } = await supabase.rpc("get_affiliates_admin_tracking", {
      p_days: days,
    });
    if (!error && data && typeof data === "object") {
      return data as unknown as AdminAffiliateTracking;
    }
    if (error && !isMissingRpc(error)) throw error;

    const affiliates = await fetchAffiliatesAdmin();
    try {
      return await buildTrackingFromTables(days, affiliates);
    } catch {
      return emptyTracking(days, affiliates);
    }
  });
}

export async function fetchCommissionsAdmin(affiliateId?: string): Promise<AdminCommission[]> {
  return withRetry(async () => {
    const { data, error } = await supabase.rpc("get_affiliate_commissions_admin", {
      p_affiliate_id: affiliateId ?? null,
    });
    if (error) throw error;
    return (data ?? []) as unknown as AdminCommission[];
  });
}

export async function createAffiliate(email: string, code: string, rate: number) {
  const { data, error } = await supabase.rpc("admin_create_affiliate", {
    p_email: email,
    p_code: code,
    p_rate: rate,
  });
  if (error) throw error;
  return data as { ok: boolean; reason?: string };
}

export async function setCommissionStatus(ids: string[], status: string) {
  const { error } = await supabase.rpc("admin_set_commission_status", {
    p_ids: ids,
    p_status: status,
  });
  if (error) throw error;
}

export async function updateAffiliate(
  id: string,
  patch: { status?: string; commission_rate?: number; notes?: string },
) {
  const { error } = await supabase.from("affiliates").update(patch).eq("id", id);
  if (error) throw error;
}

export type AffiliateCandidate = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  last_active_at: string | null;
  activity_count: number;
  is_affiliate: boolean;
};

/** Members ranked by recent activity, for the ambassador picker. */
export async function fetchAffiliateCandidates(): Promise<AffiliateCandidate[]> {
  if (candidatesRequest) return candidatesRequest;

  candidatesRequest = withRetry(async () => {
    const { data, error } = await supabase.rpc("get_affiliate_candidates_admin" as never);
    if (error) throw error;
    const candidates = (data ?? []) as unknown as AffiliateCandidate[];
    writeCandidateCache(candidates);
    return candidates;
  }).catch((error) => {
    const cached = readCandidateCache();
    if (cached) return cached;
    throw error;
  }).finally(() => {
    candidatesRequest = null;
  });

  return candidatesRequest;
}

/** Nomme un membre ambassadeur depuis la fiche utilisateur (par identifiant). */
export async function createAffiliateByUser(userId: string, code: string, rate: number) {
  const { data, error } = await supabase.rpc("admin_create_affiliate_by_user" as never, {
    p_user_id: userId,
    p_code: code,
    p_rate: rate,
  } as never);
  if (error) throw error;
  return data as unknown as { ok: boolean; reason?: string; code?: string };
}

/** Retire le statut ambassadeur d'un membre. */
export async function revokeAffiliateByUser(userId: string) {
  const { error } = await supabase.rpc("admin_revoke_affiliate_by_user" as never, {
    p_user_id: userId,
  } as never);
  if (error) throw error;
}
