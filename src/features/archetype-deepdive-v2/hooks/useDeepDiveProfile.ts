import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getLatestSubmittedSessionForUser,
  tryRecoverUserAssessment,
  getSessionResultsSummary,
  extractPoleScoresFromSummary,
  sessionIsMyssV4,
  v4PoleAnalysisFromSummary,
  type SessionResultsSummary,
} from "@/features/archetype-assessment/services/assessmentService";
import { getHouses72ScoredDelta } from "@/features/archetype-assessment/services/houses72Service";
import {
  addPoleScores,
  type Houses72HouseBreakdown,
} from "@/features/archetype-assessment/domain/houses72Scoring";
import { buildDynamicProfile, type BuildDynamicProfileInput } from "../domain/dynamicProfileBuilder";
import { deepDiveResultFromPoleScores } from "../domain/deepDiveFromV4Poles";
import { loadUnifiedDeepDiveResult } from "../domain/loadUnifiedScores";
import type { SampleProfile } from "../domain/sampleProfile";
import type { Locale } from "@/i18n/translations";
import type { Json } from "@/integrations/supabase/types";
import type { V4PoleAnalysis } from "@/features/archetype-assessment/domain/types";

const LOAD_TIMEOUT_MS = 25_000;

function shadowSignalsFromJson(signals: Json | null | undefined): Record<string, number> | null {
  if (signals == null) return null;
  if (typeof signals !== "object" || Array.isArray(signals)) return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(signals)) {
    const n = Number(v);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

function scoresForDynamicProfile(
  scores: SessionResultsSummary["scores"],
): BuildDynamicProfileInput["scores"] {
  return (scores ?? []).map((s) => ({
    archetype_key: s.archetype_key,
    normalized_score: s.normalized_score,
    rank: s.rank,
  }));
}

function analysisForDynamicProfile(
  analysis: SessionResultsSummary["analysis"],
): BuildDynamicProfileInput["analysis"] {
  if (!analysis) return null;
  return {
    top_archetypes: analysis.top_archetypes,
    shadow_signals: shadowSignalsFromJson(analysis.shadow_signals),
    strengths_fr: analysis.strengths_fr,
    watchouts_fr: analysis.watchouts_fr,
    summary_fr: analysis.summary_fr,
    strengths_en: analysis.strengths_en,
    watchouts_en: analysis.watchouts_en,
    summary_en: analysis.summary_en,
  };
}

export interface UseDeepDiveProfileOptions {
  userId: string | undefined;
  sessionId?: string | null;
  displayName?: string | null;
  locale: Locale;
  /**
   * When false (Persona page), only reads the latest valid session — no purge/restore.
   * Avoids long or stuck recovery chains on a lightweight identity page.
   */
  enableRecovery?: boolean;
}

export function useDeepDiveProfile({
  userId,
  sessionId: sessionIdOverride,
  displayName,
  locale,
  enableRecovery = true,
}: UseDeepDiveProfileOptions) {
  const [profile, setProfile] = useState<SampleProfile | null>(null);
  const [v4Analysis, setV4Analysis] = useState<V4PoleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const isFR = locale === "fr";

  useEffect(() => {
    const seq = ++requestSeq.current;
    let cancelled = false;
    let timedOut = false;

    const isCurrent = () => !cancelled && requestSeq.current === seq;

    const finishLoading = () => {
      if (isCurrent()) setLoading(false);
    };

    if (!userId) {
      setProfile(null);
      setV4Analysis(null);
      setError(null);
      setLoading(false);
      return;
    }

    setProfile(null);
    setV4Analysis(null);
    setError(null);
    setLoading(true);

    const timeoutId = window.setTimeout(() => {
      if (!isCurrent()) return;
      timedOut = true;
      setError(
        isFR
          ? "Le chargement a pris trop de temps. Réessaie ou ouvre le Deep Dive."
          : "Loading took too long. Try again or open Deep Dive.",
      );
      setLoading(false);
    }, LOAD_TIMEOUT_MS);

    async function resolveSessionId(): Promise<string | null> {
      if (sessionIdOverride) return sessionIdOverride;
      if (enableRecovery) {
        return tryRecoverUserAssessment(userId);
      }
      const row = await getLatestSubmittedSessionForUser(userId);
      return row?.id ?? null;
    }

    async function load() {
      try {
        const sessionId = await resolveSessionId();
        if (!isCurrent() || timedOut) return;

        if (!sessionId) {
          setProfile(null);
          return;
        }

        const [details, ddCountRes, houses72Delta] = await Promise.all([
          getSessionResultsSummary(sessionId),
          supabase
            .from("deepdive_responses")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId),
          // Load 72Q delta in parallel — null if the user hasn't taken it yet
          getHouses72ScoredDelta(userId).catch(() => null),
        ]);
        if (!isCurrent() || timedOut) return;

        const isV4 = sessionIsMyssV4(details);
        const v4PoleScores = extractPoleScoresFromSummary(details);
        setV4Analysis(isV4 ? v4PoleAnalysisFromSummary(details) : null);

        // Bayesian reinforcement: combine V4 poles with 72Q delta when available
        const combinedPoles =
          v4PoleScores && houses72Delta
            ? addPoleScores(v4PoleScores, houses72Delta.polesDelta)
            : v4PoleScores;

        const houseBreakdown: Houses72HouseBreakdown | undefined =
          houses72Delta?.houseBreakdown;

        let unified: Awaited<ReturnType<typeof loadUnifiedDeepDiveResult>> | null = null;
        try {
          if (isV4 && combinedPoles) {
            unified = deepDiveResultFromPoleScores(combinedPoles, { houseBreakdown });
          } else if (!ddCountRes.error && (ddCountRes.count ?? 0) > 0) {
            unified = await loadUnifiedDeepDiveResult(userId, {
              assessmentSessionId: sessionId,
            });
          }
        } catch (e) {
          console.warn("[DeepDive] unified score load failed", e);
        }

        if (!isCurrent() || timedOut) return;

        const dynProfile = buildDynamicProfile({
          sessionId,
          displayName: displayName ?? details.profile?.display_name ?? null,
          scores: scoresForDynamicProfile(details.scores),
          analysis: analysisForDynamicProfile(details.analysis),
          locale,
          unified,
        });
        setProfile(dynProfile);
      } catch (e: unknown) {
        console.error("[DeepDive] load profile failed", e);
        if (isCurrent() && !timedOut) {
          setError(
            e instanceof Error
              ? e.message
              : isFR
                ? "Erreur lors du chargement du profil."
                : "Error loading profile.",
          );
        }
      } finally {
        window.clearTimeout(timeoutId);
        finishLoading();
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId, sessionIdOverride, displayName, locale, enableRecovery, isFR]);

  return { profile, v4Analysis, loading, error };
}
