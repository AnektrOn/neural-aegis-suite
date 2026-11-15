import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const FOUNDERS_LIFETIME_MAX = 20;
export const FOUNDERS_PRODUCT_ID = 'aegis_founders_lifetime';

export async function countActiveFounders(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', FOUNDERS_PRODUCT_ID)
    .in('status', ['active', 'trialing']);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function foundersCohortOpen(supabase: SupabaseClient): Promise<{
  max: number;
  sold: number;
  remaining: number;
  open: boolean;
}> {
  const sold = await countActiveFounders(supabase);
  const remaining = Math.max(0, FOUNDERS_LIFETIME_MAX - sold);
  return {
    max: FOUNDERS_LIFETIME_MAX,
    sold,
    remaining,
    open: remaining > 0,
  };
}