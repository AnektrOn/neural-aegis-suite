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
  const origin =
    typeof window !== "undefined" && window.location.origin.includes("localhost")
      ? "https://aegis.humancatalystbeacon.com"
      : window.location.origin;
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

export async function fetchAffiliatesAdmin(): Promise<AdminAffiliate[]> {
  const { data, error } = await supabase.rpc("get_affiliates_admin_overview");
  if (error) throw error;
  return (data ?? []) as unknown as AdminAffiliate[];
}

export async function fetchCommissionsAdmin(affiliateId?: string): Promise<AdminCommission[]> {
  const { data, error } = await supabase.rpc("get_affiliate_commissions_admin", {
    p_affiliate_id: affiliateId ?? null,
  });
  if (error) throw error;
  return (data ?? []) as unknown as AdminCommission[];
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
  const { data, error } = await supabase.rpc("get_affiliate_candidates_admin" as never);
  if (error) throw error;
  return (data ?? []) as unknown as AffiliateCandidate[];
}
