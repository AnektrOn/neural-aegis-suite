import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock, FolderSearch } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { VoiceAgent } from "@/components/voice/VoiceAgent";
import { LogosVoiceShell } from "@/features/logos/LogosVoiceShell";
import { buildOnboardingReportLogosInjection } from "@/features/logos/logosSessionInjection";
import { fileHasEmbeddedPreview } from "@/features/logos/onboardingReportDevApi";
import { openingFromOnboardingPack } from "@/features/logos/onboardingReportOpening";
import {
  AGENT_SESSION_ONBOARDING_PREVIEW_STAMP,
  EXPECTED_EDGE_STAMPS,
  fetchOnboardingReportAgentId,
  previewOnboardingDrivePack,
} from "@/features/logos/onboardingReportDevApi";
import { OnboardingFirstMessagePretest } from "./OnboardingFirstMessagePretest";
import { OnboardingKbPreviewDialog } from "./OnboardingKbPreviewDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { VoiceKnowledgeLocator } from "@/services/agentSessionService";

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sessionKnowledge, setSessionKnowledge] = useState<VoiceKnowledgeLocator[] | null>(null);
  const autoOpenedForDrive = useRef<string | null>(null);

  const voiceLiveEnabled = searchParams.get("voice") === "1";

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
    enabled: Boolean(user?.id && voiceLiveEnabled),
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

  const packListQuery = useQuery({
    queryKey: ["preview_onboarding_pack", driveFolderId, "list"],
    enabled: Boolean(user?.id && driveFolderId),
    queryFn: () => previewOnboardingDrivePack(driveFolderId),
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const packEmbedQuery = useQuery({
    queryKey: ["preview_onboarding_pack", driveFolderId, "embed"],
    enabled: Boolean(user?.id && driveFolderId),
    queryFn: () => previewOnboardingDrivePack(driveFolderId, { embedPreviews: true }),
    staleTime: 10 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const driveFiles = packEmbedQuery.data?.files ?? packListQuery.data?.files;
  const driveError =
    (packEmbedQuery.isError && packEmbedQuery.error instanceof Error
      ? packEmbedQuery.error.message
      : null) ??
  (packListQuery.isError && packListQuery.error instanceof Error ? packListQuery.error.message : null);
  const previewLoading = previewOpen && packEmbedQuery.isFetching && !packEmbedQuery.data?.files?.length;

  useEffect(() => {
    if (searchParams.get("preview") !== "1") return;
    if (!user?.id || packListQuery.isLoading) return;
    if (autoOpenedForDrive.current === driveFolderId) return;
    if (packListQuery.isSuccess || packListQuery.isError) {
      autoOpenedForDrive.current = driveFolderId;
      setPreviewOpen(true);
    }
  }, [driveFolderId, packListQuery.isError, packListQuery.isLoading, packListQuery.isSuccess, searchParams, user?.id]);

  const onOnboardingKnowledgeLoaded = useCallback((items: VoiceKnowledgeLocator[]) => {
    setSessionKnowledge(items);
    setPreviewOpen(true);
  }, []);

  const openingPreview = useMemo(() => {
    const report = driveFiles?.find(
      (f) => f.name === "00_RAPPORT.md" || f.relativePath?.endsWith("00_RAPPORT.md"),
    );
    if (!report || !fileHasEmbeddedPreview(report)) return null;
    return openingFromOnboardingPack(report.preview, firstName);
  }, [driveFiles, firstName]);

  const dynamicVariables = useMemo(
    () =>
      buildOnboardingReportLogosInjection(
        firstName,
        user?.id,
        voiceLiveEnabled ? openingPreview?.first_message : undefined,
      ).dynamicVariables,
    [firstName, openingPreview?.first_message, user?.id, voiceLiveEnabled],
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
    if (packListQuery.isLoading) return isFR ? "Lecture Drive…" : "Reading Drive…";
    if (driveError) return `${isFR ? "Pack Drive" : "Drive pack"}: ${driveError}`;
    const files = driveFiles ?? [];
    const name = packListQuery.data?.folder_name ?? packEmbedQuery.data?.folder_name ?? "—";
    if (!files.length) {
      return `${name} — ${isFR ? "aucun .md onboarding détecté" : "no onboarding .md found"}`;
    }
    const stamp = packListQuery.data?.edge_stamp ?? packEmbedQuery.data?.edge_stamp;
    const stampOk =
      packListQuery.data?.edge_ok ??
      packEmbedQuery.data?.edge_ok ??
      (stamp ? (EXPECTED_EDGE_STAMPS as readonly string[]).includes(stamp) : false);
    const stampHint = stampOk
      ? ""
      : ` — redéploie Edge « agent-session » (stamp ${AGENT_SESSION_ONBOARDING_PREVIEW_STAMP})`;
    return `${name} — ${files.length} fichier(s) — ${isFR ? "ouvre l’aperçu" : "open preview"}${stampHint}`;
  }, [
    driveError,
    driveFiles,
    isFR,
    packEmbedQuery.data?.edge_ok,
    packEmbedQuery.data?.edge_stamp,
    packListQuery.data?.edge_ok,
    packListQuery.data?.edge_stamp,
    packListQuery.data?.folder_name,
    packListQuery.isLoading,
  ]);

  const needsEdgeDeploy =
    (packListQuery.isSuccess && !packListQuery.data?.edge_ok && !packEmbedQuery.data?.edge_ok) ||
    (driveError?.includes("Déploie") ?? false) ||
    (driveError?.includes("agent-session") ?? false) ||
    (agentIdQuery.error instanceof Error && agentIdQuery.error.message.includes("non à jour"));

  return (
    <div className="relative min-h-dvh">
      <OnboardingKbPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        isFR={isFR}
        driveFolderId={driveFolderId}
        folderName={packListQuery.data?.folder_name ?? packEmbedQuery.data?.folder_name}
        driveFiles={driveFiles}
        driveError={driveError}
        loading={previewLoading}
        sessionKnowledge={sessionKnowledge}
        voiceOpeningPreview={openingPreview}
      />

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
        <div className="pointer-events-auto flex items-center gap-2">
          {user ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 bg-background/70 backdrop-blur"
              onClick={() => setPreviewOpen(true)}
            >
              <FolderSearch className="h-3.5 w-3.5" aria-hidden />
              {isFR ? "Aperçu KB" : "KB preview"}
            </Button>
          ) : null}
          <Badge variant="outline" className="pointer-events-none gap-1 bg-background/70 font-normal backdrop-blur">
            <Clock className="h-3 w-3" aria-hidden />
            LAB · onboarding 30 min
          </Badge>
        </div>
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
            enableCall={voiceLiveEnabled}
            onboardingDriveFolderId={driveFolderId}
            onOnboardingKnowledgeLoaded={voiceLiveEnabled ? onOnboardingKnowledgeLoaded : undefined}
            dynamicVariables={dynamicVariables}
            debugFooter={
              <div className="space-y-1 text-xs text-muted-foreground">
                <OnboardingFirstMessagePretest
                  isFR={isFR}
                  firstName={firstName}
                  loading={packEmbedQuery.isLoading}
                  needsEmbed={!packEmbedQuery.data?.files?.length && !packEmbedQuery.isLoading}
                  opening={openingPreview}
                />
                {!voiceLiveEnabled ? (
                  <p className="text-[10px] text-muted-foreground">
                    {isFR ? (
                      <>
                        Voix désactivée (pré-test). URL live :{" "}
                        <span className="font-mono text-foreground">
                          {`/dev/logos-onboarding-report?voice=1${driveFolderId !== DEV_ONBOARDING_DRIVE_FOLDER_ID ? `&drive=${driveFolderId}` : ""}`}
                        </span>
                      </>
                    ) : (
                      <>
                        Voice off (pre-test). Live URL:{" "}
                        <span className="font-mono text-foreground">
                          {`/dev/logos-onboarding-report?voice=1${driveFolderId !== DEV_ONBOARDING_DRIVE_FOLDER_ID ? `&drive=${driveFolderId}` : ""}`}
                        </span>
                      </>
                    )}
                  </p>
                ) : null}
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
                <button
                  type="button"
                  className="text-left underline decoration-dotted underline-offset-2 hover:text-foreground"
                  onClick={() => setPreviewOpen(true)}
                >
                  {packSummary}
                </button>
                {needsEdgeDeploy ? (
                  <p className="rounded border border-amber-500/40 bg-amber-500/10 p-2 text-left text-amber-900 dark:text-amber-100">
                    {isFR
                      ? "Le push Git ne déploie pas les Edge Functions. Sauvegarde agent-session/index.ts (stamp 2026-11-25g). Puis migrations 20261125100000 / 25110000 et Admin › Déployer Onboarding Report."
                      : "Git push does not deploy Edge Functions. Save agent-session/index.ts (stamp 2026-11-25g). Apply migrations 20261125100000 / 25110000, then Admin › Deploy Onboarding Report."}
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