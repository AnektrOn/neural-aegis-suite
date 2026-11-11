export const OPERATOR_ROLES = ['admin', 'superadmin'];
export const OWNER_EMAIL = 'humancatalystnote@gmail.com';
export const RECOVERY_START = '2026-10-17T16:37:39.147808Z';
export const INDIVIDUAL_RECOVERY_START = '2026-10-17T00:00:00Z';

export function isInRecoveryPeriod(date: string) {
  return Date.parse(date) >= Date.parse(INDIVIDUAL_RECOVERY_START);
}

export function isRecentLogin(loginAt: string, now = Date.now()) {
  const age = now - Date.parse(loginAt);
  return Number.isFinite(age) && age >= -60_000 && age <= 300_000;
}

export function isCompletionEvent(table: string, row: Record<string, unknown>, old?: Record<string, unknown>) {
  const field = table === 'assessment_sessions' ? 'submitted' : 'completed';
  return row.status === field && (!old || old.status !== row.status ||
    (table === 'toolbox_completions' && old.completed_at !== row.completed_at));
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}