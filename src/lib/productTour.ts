const PRODUCT_TOUR_KEY_PREFIX = "aegis_product_tour_v1_";

export function productTourKey(userId: string): string {
  return `${PRODUCT_TOUR_KEY_PREFIX}${userId}`;
}

function readDone(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1" || sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeDone(key: string): void {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

export function isProductTourDone(userId: string): boolean {
  return readDone(productTourKey(userId));
}

export function markProductTourDone(userId: string): void {
  writeDone(productTourKey(userId));
}

export function clearProductTour(userId: string): void {
  try {
    localStorage.removeItem(productTourKey(userId));
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(productTourKey(userId));
  } catch {
    /* ignore */
  }
}
