/** Tracking consent helpers (split from banner for fast-refresh). */
const CONSENT_KEY = "aegis_tracking_consent:v1";

export type TrackingConsent = "accepted" | "declined" | null;

export function getTrackingConsent(): TrackingConsent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "accepted" || v === "declined") return v;
  } catch {
    /* private mode */
  }
  return null;
}

export function setTrackingConsent(value: "accepted" | "declined") {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("aegis-tracking-consent", { detail: value }));
}
