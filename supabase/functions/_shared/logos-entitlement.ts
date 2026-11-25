import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const LOGOS_PRODUCT_IDS = ['aegis_solo_logos', 'aegis_logos'] as const;
export const LOGOS_PRODUCT_ID = 'aegis_solo_logos';

type SubRow = {
  status: string;
  current_period_end: string | null;
};

function subscriptionActive(row: SubRow | null): boolean {
  if (!row) return false;
  const end = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
  const future = end === null || end > Date.now();
  if (row.status === 'active' || row.status === 'trialing') return future;
  if (row.status === 'canceled') return end !== null && end > Date.now();
  return false;
}

async function isPlatformOperator(admin: SupabaseClient, userId: string): Promise<boolean> {
  const { data: roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  return (roles ?? []).some((r) => r.role === 'admin' || r.role === 'superadmin');
}

/** Agent vocal LOGOS : abonnement AEGIS + LOGOS Solo actif (ou opérateur plateforme). */
export async function userHasLogosEntitlement(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  if (await isPlatformOperator(admin, userId)) return true;

  const { data: logosSub } = await admin
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .in('product_id', [...LOGOS_PRODUCT_IDS])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return subscriptionActive(logosSub as SubRow | null);
}