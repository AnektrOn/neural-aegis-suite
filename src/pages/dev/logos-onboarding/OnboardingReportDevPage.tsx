import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { VoiceAgent } from "@/components/voice/VoiceAgent";
import { LogosVoiceShell } from "@/features/logos/LogosVoiceShell";
import { buildOnboardingReportLogosInjection } from "@/features/logos/logosSessionInjection";
import {
  fetchOnboardingReportAgentId,
  previewOnboardingDrivePack,
} from "@/features/logos/onboardingReportDevApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

/** Dossier Drive Obsidian user (lab Note) — surcharge via ?drive=… */
export const DEV_ONBOARDING_DRIVE_FOLDER_ID = "1Oa5e2i0nsz8E_l0jJsmjQMUGSkefSk3D";

/**
 * Dev sandbox — agent global LOGOS - Onboarding Report (30 min, pas de chemin guidé).
 */
export default function OnboardingReportDevPage() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const [searchParams] = useSearchParams();

  const driveFolderId = useMemo(() => {
    const fromUrl = searchParams.get("drive")?.trim();
    return fromUrl || DEV_ONBOARDING_DRIVE_FOLDER_ID;
  }, [searchParams]);

  const firstName = useMemo(() => {
    const meta = user?.user_metadata?.first_name;
    if (typeof meta === "string" && meta.trim()) return meta.trim();
    return "toi";
  }, [user?.user_metadata?.first_name]);

  const agentIdQuery = useQuery({
    queryKey: ["onboarding_report_status"],
    enabled: Boolean(user?.id),
    queryFn: fetchOnboardingReportAgentId,
    staleTime: 60_000,
    retry: false,
  });

  const profileDriveQuery = useQuery({
    queryKey: ["profiles", user?.id, "onboarding_drive"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_drive_folder_id, drive_folder_id")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const packPreviewQuery = useQuery({
    queryKey: ["preview_onboarding_pack", driveFolderId],
    enabled: Boolean(user?.id && driveFolderId),
    queryFn: () => previewOnboardingDrivePack(driveFolderId),
    staleTime: 60_000,
    retry: false,
  });

  const dynamicVariables = useMemo(
    () => buildOnboardingReportLogosInjection(firstName, user?.id).dynamicVariables,
    [firstName, user?.id],
  );

  const agentLabel = useMemo(() => {
    if (agentIdQuery.isLoading) return "…";
    if (agentIdQuery.isError) {
      const msg = agentIdQuery.error instanceof Error ? agentIdQuery.error.message : "";
      if (msg.includes("non à jour") || msg.includes("Action inconnue")) {
        return isFR ? "Edge à redeployer (voir Pack Drive)" : "Redeploy Edge (see Drive pack)";
      }
    }
    return agentIdQuery.data ?? (isFR ? "non déployé — Admin › Déployer Onboarding Report" : "not deployed — Admin › Deploy");
  }, [agentIdQuery.data, agentIdQuery.error, agentIdQuery.isError, agentIdQuery.isLoading, isFR]);

  const packSummary = useMemo(() => {
    if (packPreviewQuery.isLoading) return isFR ? "Lecture Drive…" : "Reading Drive…";
    if (packPreviewQuery.isError) {
      const msg = packPreviewQuery.error instanceof Error ? packPreviewQuery.error.message : "erreur";
      return `${isFR ? "Pack Drive" : "Drive pack"}: ${msg}`;
    }
    const files = packPreviewQuery.data?.files ?? [];
    const name = packPreviewQuery.data?.folder_name ?? "—";
    if (!files.length) {
      return `${name} — ${isFR ? "aucun .md onboarding détecté" : "no onboarding .md found"}`;
    }
    return `${name} — ${files.length} fichier(s): ${files.map((f) => f.relativePath).join(", ")}`;
  }, [isFR, packPreviewQuery.data, packPreviewQuery.error, packPreviewQuery.isLoading]);

  const needsEdgeDeploy =
    (packPreviewQuery.error instanceof Error &&
      packPreviewQuery.error.message.includes("non à jour")) ||
    (agentIdQuery.error instanceof Error && agentIdQuery.error.message.includes("non à jour"));

  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-center justify-between gap-3 px-4 py-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="pointer-events-auto w-fit bg-background/70 text-muted-foreground backdrop-blur"
        >
          <Link to="/dev">
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
            Dev lab
          </Link>
        </Button>
        <Badge variant="outline" className="pointer-events-none gap-1 bg-background/70 font-normal backdrop-blur">
          <Clock className="h-3 w-3" aria-hidden />
          LAB · onboarding 30 min
        </Badge>
      </div>

      {!user ? (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isFR
              ? "Connecte-toi pour tester le débrief vocal Onboarding Report."
              : "Sign in to test the Onboarding Report voice debrief."}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Auth</Link>
          </Button>
        </div>
      ) : (
        <LogosVoiceShell>
          <VoiceAgent
            layout="welcome"
            backHref="/dev"
            matchWelcomeVisual
            hideHeroTitle={false}
            welcomeTitle={
              isFR ? "Débrief rapport — LOGOS Onboarding" : "Report debrief — LOGOS Onboarding"
            }
            agentKind="onboarding_report"
            onboardingDriveFolderId={driveFolderId}
            dynamicVariables={dynamicVariables}
            debugFooter={
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  {isFR ? "Agent ElevenLabs : " : "ElevenLabs agent: "}
                  <span className="font-mono text-foreground">{agentLabel}</span>
                </p>
                <p>
                  Drive lab: <span className="font-mono text-foreground">{driveFolderId}</span>
                  {profileDriveQuery.data?.onboarding_drive_folder_id ? (
                    <span>
                      {" "}
                      · profil:{" "}
                      <span className="font-mono">{profileDriveQuery.data.onboarding_drive_folder_id}</span>
                    </span>
                  ) : null}
                </p>
                <p className="text-left">{packSummary}</p>
                {needsEdgeDeploy ? (
                  <p className="rounded border border-amber-500/40 bg-amber-500/10 p-2 text-left text-amber-900 dark:text-amber-100">
                    {isFR
                      ? "Supabase exécute encore l’ancienne elevenlabs-knowledge. Dashboard → Edge Functions → elevenlabs-knowledge + agent-session → Deploy. Puis migrations SQL 20261125100000 / 25110000 et Admin › Déployer Onboarding Report."
                      : "Remote Supabase is on an old elevenlabs-knowledge build. Dashboard → Edge Functions → deploy elevenlabs-knowledge + agent-session. Apply SQL migrations 20261125100000 / 25110000, then Admin › Deploy Onboarding Report."}
                  </p>
                ) : (
                  <p className="text-[10px] opacity-80">
                    {isFR ? "Autre dossier : ?drive=ID" : "Other folder: ?drive=ID"}
                  </p>
                )}
              </div>
            }
          />
        </LogosVoiceShell>
      )}
    </div>
  );
}