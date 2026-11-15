/** Normalize snapshot webhook payloads from pre-Basil and Basil APIs. */
type Period = { current_period_start?: number | null; current_period_end?: number | null };
type SubscriptionPayload = {
  current_period_start?: number | null;
  current_period_end?: number | null;
  items?: { data?: readonly unknown[] };
};
type Reference = string | { id?: string } | null;
type InvoicePayload = {
  subscription?: Reference;
  parent?: { subscription_details?: { subscription?: Reference } | null } | null;
};

function iso(timestamp: number | null | undefined) {
  return typeof timestamp === 'number' && Number.isFinite(timestamp)
    ? new Date(timestamp * 1000).toISOString()
    : null;
}

export function subscriptionPeriod(sub: SubscriptionPayload) {
  const item = (sub.items?.data?.[0] ?? {}) as Period;
  return {
    current_period_start: iso(item.current_period_start ?? sub.current_period_start),
    current_period_end: iso(item.current_period_end ?? sub.current_period_end),
  };
}

export function invoiceSubscriptionId(invoice: InvoicePayload): string | null {
  const ref = invoice.parent?.subscription_details?.subscription ?? invoice.subscription;
  return typeof ref === 'string' ? ref : ref?.id ?? null;
}
