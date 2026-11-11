import { describe, it, expect } from 'vitest';
import { OPERATOR_ROLES, isCompletionEvent, escapeHtml, isRecentLogin } from '../../supabase/functions/send-email-notification/activity-rules';

describe('requested activity email alerts', () => {
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