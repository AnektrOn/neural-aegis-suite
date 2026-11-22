import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { VoiceAgent } from "@/components/voice/VoiceAgent";
import { LogosVoiceShell } from "@/features/logos/LogosVoiceShell";
import { LogosSubscriptionGate } from "@/features/logos/LogosSubscriptionGate";
import { useLogosPathChooser } from "@/features/logos/useLogosPathChooser";

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

  const firstName = useMemo(
    () => (user ? pickFirstName(displayName, user) : ""),
    [displayName, user],
  );

  const welcomeTitle = firstName
    ? t("welcome.hud.title", { name: firstName })
    : t("welcome.hud.titleNoName");

  const { liveOverlay } = useLogosPathChooser({
    enabled: Boolean(user?.id),
    isFR,
    firstName: firstName || "toi",
    userId: user?.id,
  });

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
