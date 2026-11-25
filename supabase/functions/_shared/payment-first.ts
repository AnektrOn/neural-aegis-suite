export const PUBLIC_PAID_PLANS = [
  "aegis_solo_monthly",
  "aegis_solo_logos_monthly",
  "aegis_logos_ambassador_monthly",
  "aegis_founders_lifetime",
];

export function canProvisionPaidAccount(session: {
  status?: string | null;
  payment_status?: string | null;
  metadata?: Record<string, string> | null;
}) {
  return session.status === "complete"
    && (session.payment_status === "paid" || session.payment_status === "no_payment_required")
    && PUBLIC_PAID_PLANS.includes(session.metadata?.priceId ?? "");
}

export async function resolvePaidAccount(
  session: Parameters<typeof canProvisionPaidAccount>[0] & { customer_details?: { email?: string | null } | null },
  accounts: { find: (email: string) => Promise<string | null>; invite: (email: string) => Promise<string> },
) {
  if (!canProvisionPaidAccount(session)) throw new Error("Payment not confirmed");
  const email = session.customer_details?.email?.trim().toLowerCase();
  if (!email) throw new Error("Paid checkout email missing");
  const existing = await accounts.find(email);
  if (existing) return existing;
  try {
    return await accounts.invite(email);
  } catch (error) {
    // Another paid checkout may have provisioned the same email concurrently.
    const concurrent = await accounts.find(email);
    if (concurrent) return concurrent;
    throw error;
  }
}