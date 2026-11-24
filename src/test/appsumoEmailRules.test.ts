import { describe, expect, it } from 'vitest';
import { redemptionEmails } from '../../supabase/functions/redeem-appsumo/email-rules';
import { deliverConfirmationFirst } from '../../supabase/functions/redeem-appsumo/delivery-rules';
import { sendAndClose } from '../../supabase/functions/_shared/transactional-email-templates/smtp-lifecycle';

const event = { userId: 'member-1', redeemedAt: '2026-11-18T01:00:00Z', createdAt: '2026-11-18T00:30:00Z', email: 'member@example.test', name: 'Alex', locale: 'en', code: 'AEGIS-123456789ABC' };
describe('AppSumo activation emails', () => {
  it('sends confirmation before operator notices with no overlapping connections', async () => {
    const order: string[] = [];
    let active = 0;
    await deliverConfirmationFirst(['welcome', 'admin-1', 'admin-2'], async job => {
      active++;
      expect(active).toBe(1);
      await Promise.resolve();
      order.push(job);
      active--;
    });
    expect(order).toEqual(['welcome', 'admin-1', 'admin-2']);
  });
  it('does not let operator delivery failures fail the confirmation', async () => {
    await expect(deliverConfirmationFirst(['welcome', 'admin'], async job => {
      if (job === 'admin') throw new Error('SMTP rejected');
    })).resolves.toBeUndefined();
  });
  it('retains pending status when confirmation sending fails', async () => {
    await expect(deliverConfirmationFirst(['welcome'], async () => { throw new Error('SMTP rejected'); })).rejects.toThrow('SMTP rejected');
  });
  it('does not mark an accepted email failed when cleanup fails', async () => {
    await expect(sendAndClose({ send: async () => {}, close: () => { throw new Error('Connection closed'); } })).resolves.toBeUndefined();
  });
  it('preserves the original send error when cleanup also fails', async () => {
    await expect(sendAndClose({ send: async () => { throw new Error('SMTP 550'); }, close: () => { throw new Error('No connection'); } })).rejects.toThrow('SMTP 550');
  });
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