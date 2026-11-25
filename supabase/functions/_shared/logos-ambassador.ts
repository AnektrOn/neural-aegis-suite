import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const LOGOS_AMBASSADOR_MAX = 20;
export const LOGOS_AMBASSADOR_PRODUCT_ID = 'aegis_logos';
export const LOGOS_VOICE_SECONDS_AMBASSADOR = 5400;

export async function countActiveLogosAmbassador(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', LOGOS_AMBASSADOR_PRODUCT_ID)
    .in('status', ['active', 'trialing']);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function logosAmbassadorCohortOpen(supabase: SupabaseClient): Promise<{
  max: number;
  sold: number;
  remaining: number;
  open: boolean;
}> {
  const sold = await countActiveLogosAmbassador(supabase);
  const remaining = Math.max(0, LOGOS_AMBASSADOR_MAX - sold);
  return {
    max: LOGOS_AMBASSADOR_MAX,
    sold,
    remaining,
    open: remaining > 0,
  };
}