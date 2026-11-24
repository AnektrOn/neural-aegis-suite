/**
 * Estimation live — calibré sur appel pilot ~180s, 1489 crédits, ~0,298 USD (metadata ElevenLabs).
 * Affichage indicatif pour l’équipe / membre, pas la facturation Stripe.
 */
export const LOGOS_VOICE_CREDITS_PER_SECOND = 1489 / 180;
export const LOGOS_VOICE_USD_PER_CREDIT = 0.29776655651983286 / 1489;
/** Taux indicatif EUR (ajustable produit). */
export const LOGOS_VOICE_EUR_PER_USD = 0.92;

export type VoiceCostEstimate = {
  elapsedSeconds: number;
  credits: number;
  usd: number;
  eur: number;
};

export function estimateVoiceSessionCost(elapsedSeconds: number): VoiceCostEstimate {
  const elapsed = Math.max(0, elapsedSeconds);
  const credits = elapsed * LOGOS_VOICE_CREDITS_PER_SECOND;
  const usd = credits * LOGOS_VOICE_USD_PER_CREDIT;
  const eur = usd * LOGOS_VOICE_EUR_PER_USD;
  return { elapsedSeconds: elapsed, credits, usd, eur };
}

export function formatVoiceDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function formatVoiceCostEur(eur: number, locale: string): string {
  return new Intl.NumberFormat(locale.startsWith("fr") ? "fr-FR" : "en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(eur);
}