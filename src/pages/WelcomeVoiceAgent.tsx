import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  VoiceAgent,
  type VoiceAgentLiveOverlayHelpers,
} from "@/components/voice/VoiceAgent";
import { LogosVoiceShell } from "@/features/logos/LogosVoiceShell";
import { LogosSubscriptionGate } from "@/features/logos/LogosSubscriptionGate";
import {
  consumeLogosPath,
  favoriteLogosPath,
  pickOpeningLogosPaths,
  type LogosAvailablePath,
} from "@/features/logos/logosPathService";
import {
  buildGuidedLogosInjection,
  buildOpenLogosInjection,
  type LogosOpeningInjection,
} from "@/features/logos/logosSessionInjection";
import {
  LogosPathChooserOverlay,
  type LogosPathDraft,
} from "@/pages/dev/logos/LogosPathChooserOverlay";

function pickFirstName(displayName: string | null, user: NonNullable<ReturnType<typeof useAuth>["user"]>) {
  if (displayName?.trim() && !displayName.includes("@")) {
    const part = displayName.trim().split(/\s+/)[0];
    if (part && !part.includes("@")) return part;
  }
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const candidates = [
    meta?.["first_name"],
    typeof meta?.["full_name"] === "string"
      ? (meta["full_name"] as string).split(" ")[0]
      : undefined,
    user.email?.split("@")[0],
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim() && !c.includes("@")) return c.trim();
  }
  return "";
}

export default function WelcomeVoiceAgent() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const isFR = locale === "fr";
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [openingPaths, setOpeningPaths] = useState<LogosAvailablePath[]>([]);
  const [pathsLoading, setPathsLoading] = useState(false);

  const firstName = useMemo(
    () => (user ? pickFirstName(displayName, user) : ""),
    [displayName, user],
  );

  const welcomeTitle = firstName
    ? t("welcome.hud.title", { name: firstName })
    : t("welcome.hud.titleNoName");

  const refreshOpeningPaths = useCallback(async () => {
    setPathsLoading(true);
    try {
      const picked = await pickOpeningLogosPaths();
      setOpeningPaths(picked);
    } catch (err) {
      console.error("WelcomeVoiceAgent paths", err);
      setOpeningPaths([]);
    } finally {
      setPathsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    void (async () => {
      try {
        const { data: mapping, error: mappingErr } = await supabase
          .from("user_agents")
          .select("elevenlabs_agent_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (mappingErr) {
          console.error("WelcomeVoiceAgent user_agents", mappingErr.message);
        }

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("display_name, elevenlabs_agent_id")
          .eq("id", user.id)
          .maybeSingle();

        if (profileErr) {
          console.error("WelcomeVoiceAgent profiles", profileErr.message);
          if (!cancelled) setLoadError(profileErr.message);
        }

        if (!cancelled) {
          setDisplayName(profile?.display_name ?? null);
          setAgentId(
            mapping?.elevenlabs_agent_id ??
              profile?.elevenlabs_agent_id ??
              null,
          );
          setAccessChecked(true);
        }
      } catch (err) {
        console.error("WelcomeVoiceAgent", err);
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : t("voiceAgent.errorGeneric"));
          setAccessChecked(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [t, user?.id]);

  useEffect(() => {
    if (!user?.id || !agentId) return;
    void refreshOpeningPaths();
  }, [agentId, refreshOpeningPaths, user?.id]);

  const chooserPaths: LogosPathDraft[] = useMemo(
    () =>
      openingPaths.map((p) => ({
        id: p.id,
        title: isFR ? p.titleFr : p.titleEn,
        daysUntilExpiry: p.daysUntilExpiry,
        isFavorited: p.isFavorited,
      })),
    [isFR, openingPaths],
  );

  const startGuided = useCallback(
    async (
      draft: LogosPathDraft,
      startWithChoice: (injection?: LogosOpeningInjection) => void,
    ) => {
      const full = openingPaths.find((p) => p.id === draft.id);
      if (!full) {
        startWithChoice(buildOpenLogosInjection(firstName || "toi"));
        return;
      }
      try {
        await consumeLogosPath(full.id);
      } catch (err) {
        console.error("WelcomeVoiceAgent consume", err);
      }
      startWithChoice(
        { ...buildGuidedLogosInjection(
          {
            openingPrompt: full.openingPrompt,
            firstMessage: full.firstMessage,
          },
          firstName || "toi",
        ), feedbackContext: { promptId: full.id, category: full.category } },
      );
      void refreshOpeningPaths();
    },
    [firstName, openingPaths, refreshOpeningPaths],
  );

  const onFavoritePath = useCallback(
    async (draft: LogosPathDraft) => {
      try {
        await favoriteLogosPath(draft.id);
        await refreshOpeningPaths();
      } catch (err) {
        console.error("WelcomeVoiceAgent favorite", err);
      }
    },
    [refreshOpeningPaths],
  );

  const liveOverlay = useCallback(
    ({ startWithChoice }: VoiceAgentLiveOverlayHelpers) => (
      <LogosPathChooserOverlay
        isFR={isFR}
        paths={chooserPaths}
        loading={pathsLoading}
        onSelectPath={(path) => {
          void startGuided(path, startWithChoice);
        }}
        onOwnPath={() => {
          startWithChoice(buildOpenLogosInjection(firstName || "toi"));
        }}
        onFavoritePath={openingPaths.some(path => path.id.includes(":")) ? undefined : (path) => {
          void onFavoritePath(path);
        }}
      />
    ),
    [chooserPaths, firstName, isFR, onFavoritePath, openingPaths, pathsLoading, startGuided],
  );

  if (!user) return null;

  return (
    <LogosSubscriptionGate
      agentChecked={accessChecked}
      agentReady={Boolean(agentId)}
      exitPath="/welcome"
    >
      <LogosVoiceShell>
      {loadError ? (
        <p className="sr-only" role="status">
          {loadError}
        </p>
      ) : null}
      <VoiceAgent
        layout="welcome"
        welcomeTitle={welcomeTitle}
        backHref="/welcome"
        dynamicVariables={{ first_name: firstName || "toi" }}
        pathCardsMorph
        requirePathChoice
        matchWelcomeVisual
        liveOverlay={liveOverlay}
      />
      </LogosVoiceShell>
    </LogosSubscriptionGate>
  );
}
