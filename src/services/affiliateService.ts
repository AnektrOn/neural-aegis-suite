import { supabase } from "@/integrations/supabase/client";

export const REFERRAL_STORAGE_KEY = "aegis:ref-code";

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
  referrals?: {
    id: string;
    label: string;
    status: string;
    created_at: string;
    converted_at: string | null;
  }[];
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
