// Run explicitly with APPSUMO_TEST_SESSION_FILE and APPSUMO_TEST_CATALOGUE_FILE.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const enabled = !!process.env.APPSUMO_TEST_SESSION_FILE && !!process.env.APPSUMO_TEST_CATALOGUE_FILE;
describe.skipIf(!enabled)('live AppSumo redemption', () => {
  it('grants Solo lifetime without LOGOS, retries safely and rejects an unknown code', async () => {
    const sessionPath = process.env.APPSUMO_TEST_SESSION_FILE;
    const cataloguePath = process.env.APPSUMO_TEST_CATALOGUE_FILE;
    if (!sessionPath || !cataloguePath) throw new Error('Missing test fixture');
    const { session } = JSON.parse(readFileSync(sessionPath, 'utf8'));
    const catalogue = JSON.parse(readFileSync(cataloguePath, 'utf8'));
    const headers = { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' };
    const base = import.meta.env.VITE_SUPABASE_URL;
    async function redeem(code: string) {
      const response = await fetch(`${base}/rest/v1/rpc/redeem_appsumo_code`, { method: 'POST', headers, body: JSON.stringify({ input_code: code }) });
      expect(response.status).toBe(200);
      return response.json();
    }
    expect(await redeem('AEGIS-000000000000')).toEqual({ error: 'invalid_code' });
    expect(await redeem(catalogue.new)).toMatchObject({ success: true, product_id: 'aegis_solo', lifetime: true, logos: false });
    expect(await redeem(catalogue.new)).toMatchObject({ success: true, already_redeemed: true });
    expect(await redeem(catalogue.codes[0])).toEqual({ error: 'account_already_activated' });
    const response = await fetch(`${base}/rest/v1/subscriptions?user_id=eq.${session.user.id}&price_id=eq.appsumo_lifetime&select=product_id,status,current_period_end`, { headers });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ product_id: 'aegis_solo', status: 'active', current_period_end: null }]);
  });
});