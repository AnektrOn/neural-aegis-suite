import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { VoiceAgent } from "@/components/voice/VoiceAgent";

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
  const { t } = useLanguage();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const firstName = useMemo(
    () => (user ? pickFirstName(displayName, user) : ""),
    [displayName, user],
  );

  const welcomeTitle = firstName
    ? t("welcome.hud.title", { name: firstName })
    : t("welcome.hud.titleNoName");

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
        }
      } catch (err) {
        console.error("WelcomeVoiceAgent", err);
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : t("voiceAgent.errorGeneric"));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [t, user?.id]);

  if (!user) return null;

  const debugFooter = (
    <p className="font-mono text-[9px] leading-relaxed tracking-wide text-muted-foreground/65">
      {t("welcome.voiceAgent.testAgentId")}{" "}
      <span className="text-muted-foreground/85 break-all">{agentId ?? "—"}</span>
      {loadError ? (
        <span className="mt-1 block text-destructive">{loadError}</span>
      ) : null}
    </p>
  );

  return (
    <VoiceAgent
      layout="welcome"
      welcomeTitle={welcomeTitle}
      debugFooter={debugFooter}
      backHref="/welcome"
    />
  );
}
