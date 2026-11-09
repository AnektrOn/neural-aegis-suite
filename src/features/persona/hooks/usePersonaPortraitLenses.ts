import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Locale } from "@/i18n/translations";
import { usePersonaProfile } from "@/features/persona/hooks/usePersonaProfile";
import { useTaoPortrait } from "@/features/tao-portrait/hooks/useTaoPortrait";
import { buildTaoPersonaSummary } from "@/features/tao-portrait/lib/buildTaoPersonaSummary";
import { buildPortraitLenses } from "@/features/persona/lib/buildPortraitLenses";
import { loadLensCompletion, type LensCompletionMap } from "@/features/persona/lib/loadLensCompletion";
import { getPersonaContent } from "@/features/persona/components/personaParts";
import { supabase } from "@/integrations/supabase/client";
import type { PortraitLensCard } from "@/features/persona/lib/portraitLensTypes";
import type { SampleProfile } from "@/features/archetype-deepdive-v2/domain/sampleProfile";
import type { TaoPersonaSummary } from "@/features/tao-portrait/lib/buildTaoPersonaSummary";

export function usePersonaPortraitLenses(locale: Locale) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;

  const [displayName, setDisplayName] = useState<string | undefined>();
  const [lensCompletions, setLensCompletions] = useState<LensCompletionMap>({});

  const { profile, loading: profileLoading, error, reload } = usePersonaProfile(userId, locale);
  const { parts: taoParts, loading: taoLoading } = useTaoPortrait(userId);

  const metaDisplayName = useMemo(() => {
    if (!user) return undefined;
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const full = meta?.["full_name"];
    if (typeof full === "string" && full.trim()) return full.trim();
    const first = meta?.["first_name"];
    if (typeof first === "string" && first.trim()) return first.trim();
    return undefined;
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    void loadLensCompletion(userId).then((map) => {
      if (alive) setLensCompletions(map);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();
      if (!alive) return;
      const fromDb = data?.display_name?.trim();
      setDisplayName(fromDb || metaDisplayName);
    })();
    return () => {
      alive = false;
    };
  }, [userId, metaDisplayName]);

  const taoSummary = useMemo(
    () => buildTaoPersonaSummary(taoParts, { displayName }),
    [taoParts, displayName],
  );

  const portraitLenses: PortraitLensCard[] = useMemo(() => {
    if (!profile) return buildPortraitLenses({
      profile: null,
      taoSummary,
      glimpseLine: "",
      dominantColor: "#c9a24b",
      completions: lensCompletions,
    });
    const { glimpseLine, dominantTheme } = getPersonaContent(profile, displayName);
    return buildPortraitLenses({
      profile,
      taoSummary,
      glimpseLine,
      dominantColor: dominantTheme.color,
      completions: lensCompletions,
    });
  }, [profile, taoSummary, displayName, lensCompletions]);

  const waitingForAuth = authLoading && !userId;
  const showLoading = waitingForAuth || (!!userId && profileLoading);

  return {
    userId,
    profile: profile as SampleProfile | null,
    displayName,
    taoSummary,
    portraitLenses,
    portraitsLoading: taoLoading,
    error,
    reload,
    showLoading,
    waitingForAuth,
    primaryShadowTheme: profile?.narrative.primaryShadowTheme ?? "",
  };
}
