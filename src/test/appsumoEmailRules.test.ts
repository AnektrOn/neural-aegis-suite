import { describe, expect, it } from 'vitest';
import { redemptionEmails } from '../../supabase/functions/redeem-appsumo/email-rules';

const event = { userId: 'member-1', redeemedAt: '2026-11-18T01:00:00Z', createdAt: '2026-11-18T00:30:00Z', email: 'member@example.test', name: 'Alex', locale: 'en', code: 'AEGIS-123456789ABC' };
describe('AppSumo activation emails', () => {
  it('addresses the welcome confirmation to the activating member', () => {
    const [welcome] = redemptionEmails(event, ['admin@example.test']);
    expect(welcome.template).toBe('appsumo-welcome');
    expect(welcome.recipient).toBe('member@example.test');
    expect(welcome.data).toMatchObject({ locale: 'en' });
  });
  it('includes the member email and actual account creation date in the admin notice', () => {
    const [, admin] = redemptionEmails(event, ['admin@example.test']);
    expect(admin.data).toMatchObject({ email: 'member@example.test', createdAt: '2026-11-18T00:30:00Z', redeemedAt: '2026-11-18T01:00:00Z', codeSuffix: '9ABC' });
  });
  it('deduplicates admins and uses stable event-specific keys on retries', () => {
    const jobs = redemptionEmails(event, ['admin@example.test', 'admin@example.test']);
    expect(jobs).toHaveLength(2);
    expect(jobs.map(job => job.idempotencyKey)).toEqual(redemptionEmails(event, ['admin@example.test']).map(job => job.idempotencyKey));
    expect(redemptionEmails({ ...event, redeemedAt: '2026-11-18T02:00:00Z' }, [])[0].idempotencyKey).not.toBe(jobs[0].idempotencyKey);
  });
});