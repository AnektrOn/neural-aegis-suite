import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getLatestSubmittedSessionForUser,
  getSessionFullDetails,
} from "@/features/archetype-assessment/services/assessmentService";
import { buildDynamicProfile } from "../domain/dynamicProfileBuilder";
import { loadUnifiedDeepDiveResult } from "../domain/loadUnifiedScores";
import type { SampleProfile } from "../domain/sampleProfile";
import type { Locale } from "@/i18n/translations";

export interface UseDeepDiveProfileOptions {
  userId: string | undefined;
  sessionId?: string | null;
  displayName?: string | null;
  locale: Locale;
}

export function useDeepDiveProfile({
  userId,
  sessionId: sessionIdOverride,
  displayName,
  locale,
}: UseDeepDiveProfileOptions) {
  const [profile, setProfile] = useState<SampleProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFR = locale === "fr";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userId) return;

      setProfile(null);
      setError(null);
      setLoading(true);

      try {
        let sessionId = sessionIdOverride ?? null;
        if (!sessionId) {
          const session = await getLatestSubmittedSessionForUser(userId);
          if (!session) {
            if (!cancelled) {
              setError(
                isFR
                  ? "Tu n'as pas encore complété d'évaluation. Lance le quiz pour générer ton rapport."
                  : "You haven't completed an assessment yet. Take the quiz to generate your report."
              );
            }
            return;
          }
          sessionId = session.id;
        }

        const details = await getSessionFullDetails(sessionId);
        if (cancelled) return;

        let unified: Awaited<ReturnType<typeof loadUnifiedDeepDiveResult>> | null = null;
        try {
          const { count, error: countErr } = await supabase
            .from("deepdive_responses" as any)
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);
          if (!countErr && (count ?? 0) > 0) {
            unified = await loadUnifiedDeepDiveResult(userId);
          }
        } catch (e) {
          console.warn("[DeepDive] unified score load failed", e);
        }

        const dynProfile = buildDynamicProfile({
          sessionId,
          displayName: displayName ?? details.profile?.display_name ?? null,
          scores: (details.scores ?? []) as any,
          analysis: (details.analysis ?? null) as any,
          locale,
          unified,
        });
        if (!cancelled) setProfile(dynProfile);
      } catch (e: unknown) {
        console.error("[DeepDive] load profile failed", e);
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : isFR
                ? "Erreur lors du chargement du profil."
                : "Error loading profile."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, sessionIdOverride, displayName, locale, isFR]);

  return { profile, loading, error };
}
