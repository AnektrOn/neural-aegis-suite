import { useEffect, useState } from "react";
import { getTrackingConsent, type TrackingConsent } from "@/lib/trackingConsent";

export function useTrackingConsent(): TrackingConsent {
  const [consent, setConsent] = useState<TrackingConsent>(() => getTrackingConsent());

  useEffect(() => {
    const onChange = () => setConsent(getTrackingConsent());
    window.addEventListener("aegis-tracking-consent", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("aegis-tracking-consent", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return consent;
}
