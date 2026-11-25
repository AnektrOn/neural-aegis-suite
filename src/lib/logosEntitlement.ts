/** Produits Stripe avec droit agent vocal LOGOS. */
export const LOGOS_PRODUCT_IDS = ["aegis_solo_logos", "aegis_logos"] as const;
export const LOGOS_PRODUCT_ID = "aegis_solo_logos";

export function isLogosProduct(productId?: string | null): boolean {
  return LOGOS_PRODUCT_IDS.includes(productId as (typeof LOGOS_PRODUCT_IDS)[number]);
}