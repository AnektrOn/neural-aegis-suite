import { useCallback, useEffect, useRef, useState } from "react";
import { loadPersonaProfile } from "../services/personaProfileService";
import type { SampleProfile } from "@/features/archetype-deepdive-v2/domain/sampleProfile";
import type { Locale } from "@/i18n/translations";

const LOAD_TIMEOUT_MS = 12_000;

export function usePersonaProfile(userId: string | undefined, locale: Locale) {
  const [profile, setProfile] = useState<SampleProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seqRef = useRef(0);
  const isFR = locale === "fr";

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    const seq = ++seqRef.current;
    setLoading(true);
    setError(null);

    const timeoutId = window.setTimeout(() => {
      if (seqRef.current !== seq) return;
      setError(
        isFR
          ? "Le chargement a pris trop de temps. Réessaie."
          : "Loading took too long. Please try again.",
      );
      setLoading(false);
    }, LOAD_TIMEOUT_MS);

    try {
      const result = await loadPersonaProfile(userId, locale);
      if (seqRef.current !== seq) return;
      setProfile(result);
    } catch (e: unknown) {
      console.error("[Persona] load failed", e);
      if (seqRef.current === seq) {
        setError(
          e instanceof Error
            ? e.message
            : isFR
              ? "Impossible de charger ton persona."
              : "Unable to load your persona.",
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (seqRef.current === seq) setLoading(false);
    }
  }, [userId, locale, isFR]);

  useEffect(() => {
    void load();
  }, [load]);

  return { profile, loading, error, reload: load };
}
