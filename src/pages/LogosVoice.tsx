import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { VoiceAgent } from "@/components/voice/VoiceAgent";
import { LogosVoiceShell } from "@/features/logos/LogosVoiceShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function pickFirstName(displayName: string | null, email: string | undefined) {
  if (displayName?.trim() && !displayName.includes("@")) {
    const part = displayName.trim().split(/\s+/)[0];
    if (part) return part;
  }
  const local = email?.split("@")[0];
  return local && !local.includes("@") ? local : "";
}

export default function LogosVoice() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);

  const firstName = useMemo(
    () => (user ? pickFirstName(displayName, user.email) : ""),
    [displayName, user],
  );

  const title = useMemo(() => {
    if (!user) return t("voiceAgent.title");
    return firstName ? t("welcome.hud.title", { name: firstName }) : t("welcome.hud.titleNoName");
  }, [firstName, t, user]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void (async () => {
      const [{ data: mapping }, { data: profile }] = await Promise.all([
        supabase.from("user_agents").select("elevenlabs_agent_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("display_name, elevenlabs_agent_id").eq("id", user.id).maybeSingle(),
      ]);
      if (!cancelled) {
        setDisplayName(profile?.display_name ?? null);
        setAgentId(mapping?.elevenlabs_agent_id ?? profile?.elevenlabs_agent_id ?? null);
        setAccessChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) return null;

  if (accessChecked && !agentId) {
    return (
      <Dialog open onOpenChange={() => navigate("/dashboard")}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("voiceAgent.noAccessTitle")}</DialogTitle>
            <DialogDescription>{t("voiceAgent.noAccessBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate("/dashboard")}>{t("voiceAgent.noAccessCta")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <LogosVoiceShell>
      <div className="mx-auto max-w-lg py-2">
        <VoiceAgent
          layout="card"
          welcomeTitle={title}
          className="border-none shadow-none"
          dynamicVariables={{ first_name: firstName || "toi" }}
        />
      </div>
    </LogosVoiceShell>
  );
}
