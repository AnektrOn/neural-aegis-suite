/** Produit Stripe / subscriptions — seul forfait avec agent vocal LOGOS. */
export const LOGOS_PRODUCT_ID = "aegis_solo_logos";

export function isLogosProduct(productId?: string | null): boolean {
  return productId === LOGOS_PRODUCT_ID;
}