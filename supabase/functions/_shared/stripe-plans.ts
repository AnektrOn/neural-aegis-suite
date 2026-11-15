/** Catalogue AEGIS — source de vérité côté serveur (aucun prix ne vient du client). */
export type PlanKey =
  | 'aegis_solo_monthly'
  | 'aegis_solo_logos_monthly'
  | 'aegis_founders_lifetime'
  | 'aegis_matrix_monthly'
  | 'aegis_matrix_yearly'
  | 'aegis_ultra_upfront'
  | 'aegis_ultra_monthly';

export type ProductId =
  | 'aegis_solo'
  | 'aegis_solo_logos'
  | 'aegis_founders_lifetime'
  | 'aegis_matrix'
  | 'aegis_ultra';

export interface PlanDef {
  productId: ProductId;
  label: string;
  amount: number; // centimes HT
  currency: 'eur';
  interval: 'month' | 'year' | null; // null = paiement unique
  installments?: number;
  /** Accès perpétuel (cohorte fondateurs). */
  lifetime?: boolean;
  /** Price ID Stripe (mode test) — repli checkout si secret absent. */
  stripePriceIdTest?: string;
  /** Price ID Stripe (mode live) — repli checkout si secret absent (préférer secrets Supabase). */
  stripePriceIdLive?: string;
  /** ID produit Stripe test (référence ops). */
  stripeProductIdTest?: string;
}

export const PLANS: Record<PlanKey, PlanDef> = {
  aegis_solo_monthly: {
    productId: 'aegis_solo',
    label: 'AEGIS Solo — mensuel',
    amount: 3500,
    currency: 'eur',
    interval: 'month',
    stripePriceIdTest: 'price_1Ubz2WA6HEQaWZIm9F1iwW5a',
    stripeProductIdTest: 'prod_VdFXcbmKlXrDg9',
  },
  aegis_solo_logos_monthly: {
    productId: 'aegis_solo_logos',
    label: 'AEGIS + LOGOS Solo — mensuel',
    amount: 11000,
    currency: 'eur',
    interval: 'month',
    stripePriceIdTest: 'price_1Ubz2dA6HEQaWZImFPwAf04p',
    stripeProductIdTest: 'prod_VdFXEu9cr1cDfe',
  },
  aegis_founders_lifetime: {
    productId: 'aegis_founders_lifetime',
    label: 'AEGIS Solo — Membres Fondateurs (Lifetime)',
    amount: 35000,
    currency: 'eur',
    interval: null,
    lifetime: true,
    stripePriceIdTest: 'price_1Ubz2hA6HEQaWZImWgJpNa0N',
    stripeProductIdTest: 'prod_VdFXhUkYAjTbhk',
  },
  aegis_matrix_monthly: {
    productId: 'aegis_matrix',
    label: 'AEGIS Matrice — mensuel',
    amount: 3900,
    currency: 'eur',
    interval: 'month',
  },
  aegis_matrix_yearly: {
    productId: 'aegis_matrix',
    label: 'AEGIS Matrice — annuel',
    amount: 29900,
    currency: 'eur',
    interval: 'year',
  },
  aegis_ultra_upfront: {
    productId: 'aegis_ultra',
    label: 'AEGIS Ultra — comptant',
    amount: 800000,
    currency: 'eur',
    interval: null,
  },
  aegis_ultra_monthly: {
    productId: 'aegis_ultra',
    label: 'AEGIS Ultra — facilité de paiement (6 × 1 500 €)',
    amount: 150000,
    currency: 'eur',
    interval: 'month',
    installments: 6,
  },
};

export function isPlanKey(v: unknown): v is PlanKey {
  return typeof v === 'string' && v in PLANS;
}
