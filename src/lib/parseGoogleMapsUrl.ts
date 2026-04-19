/**
 * Extrait lat/lng depuis les formats d’URL Google Maps les plus courants (sans API).
 * Met en cache côté appelant (ex. colonnes maps_parsed_at + lat/lng en base).
 */
export function parseLatLngFromGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const u = new URL(trimmed);

    // .../@lat,lng,zoom or .../@lat,lng
    const atMatch = trimmed.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,|$)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }

    const q = u.searchParams.get("q");
    if (q) {
      const coord = q.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
      if (coord) {
        const lat = parseFloat(coord[1]);
        const lng = parseFloat(coord[2]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
    }

    const ll = u.searchParams.get("ll");
    if (ll) {
      const parts = ll.split(",");
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
    }
  } catch {
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,|$)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }

  return null;
}

export function isLikelyGoogleMapsUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  return u.includes("google.") && (u.includes("maps") || u.includes("/maps"));
}
