import type { User } from "@supabase/supabase-js";

export const VISITOR_ONBOARDED_KEY_PREFIX = "aegis_visitor_onboarded_";

export function isAnonymousUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.is_anonymous === true;
}

export function isGuestUser(user: User | null | undefined): boolean {
  if (!user || user.is_anonymous) return false;
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  return meta?.account_type === "guest";
}

/** Guest funnel or legacy anonymous — no full member app. */
export function isVisitorOnlyUser(user: User | null | undefined): boolean {
  return isAnonymousUser(user) || isGuestUser(user);
}

export function visitorOnboardedKey(userId: string): string {
  return `${VISITOR_ONBOARDED_KEY_PREFIX}${userId}`;
}

export function isVisitorOnboarded(userId: string): boolean {
  try {
    return localStorage.getItem(visitorOnboardedKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markVisitorOnboarded(userId: string): void {
  try {
    localStorage.setItem(visitorOnboardedKey(userId), "1");
  } catch {
    /* ignore */
  }
}

export const VISITOR_AUDIT_BOOKING_URL =
  import.meta.env.VITE_VISITOR_AUDIT_BOOKING_URL?.trim() || "";

export const VISITOR_PAYMENT_CTA_URL =
  import.meta.env.VITE_VISITOR_PAYMENT_CTA_URL?.trim() || "";
