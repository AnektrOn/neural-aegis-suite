export interface RedemptionEvent {
  userId: string; redeemedAt: string; email: string; name?: string;
  createdAt: string; locale: string; code: string;
}
export function redemptionEmails(event: RedemptionEvent, adminEmails: string[]) {
  const eventKey = `${event.userId}:${event.redeemedAt}`;
  return [
    { template: 'appsumo-welcome', recipient: event.email, idempotencyKey: `appsumo-welcome:${eventKey}`, data: { name: event.name, locale: event.locale } },
    ...[...new Set(adminEmails)].map(recipient => ({ template: 'appsumo-admin', recipient, idempotencyKey: `appsumo-admin:${eventKey}:${recipient}`, data: { name: event.name, email: event.email, createdAt: event.createdAt, redeemedAt: event.redeemedAt, codeSuffix: event.code.slice(-4) } })),
  ];
}