import { describe, expect, it } from 'vitest';
import { invoiceSubscriptionId, subscriptionPeriod } from '../../supabase/functions/stripe-webhook/payload';

describe('Stripe snapshot compatibility', () => {
  it('retains legacy subscription-level periods', () => {
    expect(subscriptionPeriod({ current_period_start: 1767225600, current_period_end: 1769904000, items: { data: [{}] } })).toEqual({ current_period_start: '2026-01-01T00:00:00.000Z', current_period_end: '2026-02-01T00:00:00.000Z' });
  });
  it('uses Basil item periods ahead of legacy periods', () => {
    expect(subscriptionPeriod({ current_period_start: 1, current_period_end: 2, items: { data: [{ current_period_start: 1767225600, current_period_end: 1769904000 }] } })).toEqual({ current_period_start: '2026-01-01T00:00:00.000Z', current_period_end: '2026-02-01T00:00:00.000Z' });
  });
  it('reads legacy invoice subscription references', () => {
    expect(invoiceSubscriptionId({ subscription: 'sub_legacy' })).toBe('sub_legacy');
    expect(invoiceSubscriptionId({ subscription: { id: 'sub_expanded' } })).toBe('sub_expanded');
  });
  it('reads Basil parent subscription references', () => {
    expect(invoiceSubscriptionId({ parent: { subscription_details: { subscription: 'sub_basil' } } })).toBe('sub_basil');
    expect(invoiceSubscriptionId({ parent: { subscription_details: { subscription: { id: 'sub_expanded_basil' } } } })).toBe('sub_expanded_basil');
  });
  it('does not invent dates or subscription IDs for one-off invoices', () => {
    expect(invoiceSubscriptionId({ parent: null })).toBeNull();
    expect(subscriptionPeriod({ items: { data: [] } })).toEqual({ current_period_start: null, current_period_end: null });
  });
});