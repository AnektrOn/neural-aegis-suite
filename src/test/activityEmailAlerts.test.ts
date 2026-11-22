import { describe, it, expect } from 'vitest';
import { OPERATOR_ROLES, isCompletionEvent, escapeHtml, isRecentLogin, isInRecoveryPeriod, accountCreatedEvent } from '../../supabase/functions/send-email-notification/activity-rules';

describe('requested activity email alerts', () => {
  it('keys account creation once per account, separately from login events', () => {
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'member@example.com', created_at: '2026-11-22T02:07:00Z' };
    expect(accountCreatedEvent(user)?.key).toBe('account-created:11111111-1111-4111-8111-111111111111');
    expect(accountCreatedEvent({ ...user, created_at: '2026-11-22T03:00:00Z' })?.key).toBe(accountCreatedEvent(user)?.key);
    expect(accountCreatedEvent({ ...user, id: '22222222-2222-4222-8222-222222222222' })?.key).not.toBe(accountCreatedEvent(user)?.key);
  });
  it('does not announce guest accounts or accounts without email', () => {
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'member@example.com', created_at: '2026-11-22T02:07:00Z' };
    expect(accountCreatedEvent({ ...user, is_anonymous: true })).toBeNull();
    expect(accountCreatedEvent({ ...user, email: undefined })).toBeNull();
    expect(accountCreatedEvent(user)).not.toBeNull();
  });
  it('includes the whole 17 October but excludes earlier events', () => {
    expect(isInRecoveryPeriod('2026-10-17T00:00:00Z')).toBe(true);
    expect(isInRecoveryPeriod('2026-10-16T23:59:59Z')).toBe(false);
  });
  it('does not label a restored old session as a new login', () => {
    const now = Date.parse('2026-11-11T05:00:00Z');
    expect(isRecentLogin('2026-11-11T04:59:00Z',now)).toBe(true);
    expect(isRecentLogin('2026-10-17T04:59:00Z',now)).toBe(false);
  });
  it('includes the existing superadmin recipients', () => expect(OPERATOR_ROLES).toContain('superadmin'));
  it('emails only a newly finished quiz', () => {
    expect(isCompletionEvent('assessment_sessions', { status: 'submitted' }, { status: 'in_progress' })).toBe(true);
    expect(isCompletionEvent('assessment_sessions', { status: 'submitted' }, { status: 'submitted' })).toBe(false);
  });
  it('emails finished tools, including a new completion, but not abandoned tools', () => {
    expect(isCompletionEvent('toolbox_completions', { status: 'completed', completed_at: 'new' }, { status: 'completed', completed_at: 'old' })).toBe(true);
    expect(isCompletionEvent('toolbox_completions', { status: 'abandoned' })).toBe(false);
  });
  it('escapes recipient event data', () => expect(escapeHtml('<script>')).toBe('&lt;script&gt;'));
});