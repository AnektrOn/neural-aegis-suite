/** Catalogue AEGIS — source de vérité côté serveur (aucun prix ne vient du client). */
export type PlanKey =
  | 'aegis_matrix_monthly'
  | 'aegis_matrix_yearly'
  | 'aegis_ultra_upfront'
  | 'aegis_ultra_monthly';

export interface PlanDef {
  productId: 'aegis_matrix' | 'aegis_ultra';
  label: string;
  amount: number; // centimes
  currency: 'eur';
  interval: 'month' | 'year' | null; // null = paiement unique
  installments?: number;
}

export const PLANS: Record<PlanKey, PlanDef> = {
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
