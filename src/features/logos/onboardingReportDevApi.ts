import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Une seule edge — évite le rate-limit Drive (pas de fallback en chaîne). */
const PREVIEW_FN = "agent-session";
export const AGENT_SESSION_ONBOARDING_PREVIEW_STAMP = "agent-session-onboarding-preview-1";
export const ONBOARDING_PACK_PREVIEW_STAMP = "onboarding-pack-preview-1";
export const ONBOARDING_PREVIEW_EDGE_STAMP = "2026-11-25e";

export const EXPECTED_EDGE_STAMPS = [
  AGENT_SESSION_ONBOARDING_PREVIEW_STAMP,
  ONBOARDING_PACK_PREVIEW_STAMP,
  ONBOARDING_PREVIEW_EDGE_STAMP,
] as const;

function mapRateLimitMessage(detail: string, isFR = true): string {
  const lower = detail.toLowerCase();
  if (lower.includes("too many requests") || lower.includes("429") || lower.includes("rate limit")) {
    return isFR
      ? "Trop de requêtes Google Drive — attends 1–2 minutes, ferme l’aperçu puis réouvre (un seul chargement à la fois)."
      : "Google Drive rate limit — wait 1–2 minutes, close preview and try again.";
  }
  return detail;
}

export async function readEdgeFunctionError(error: FunctionsHttpError): Promise<string> {
  let detail = error.message;
  try {
    const ctx = (await error.context.json()) as { error?: string } | null;
    if (ctx?.error) detail = String(ctx.error);
  } catch {
    /* ignore */
  }
  if (detail === "Action inconnue") {
    return `Redéploie « ${PREVIEW_FN} » (sauvegarde supabase/functions/agent-session/index.ts, stamp 2026-11-25g).`;
  }
  return mapRateLimitMessage(detail);
}

function isKnownStamp(stamp: string | undefined): boolean {
  return Boolean(stamp && (EXPECTED_EDGE_STAMPS as readonly string[]).includes(stamp));
}

export async function fetchOnboardingReportAgentId(): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke<{ agent_id?: string | null; error?: string }>(
    "elevenlabs-knowledge",
    { body: { action: "onboarding_report_status" } },
  );
  if (error instanceof FunctionsHttpError) {
    const msg = await readEdgeFunctionError(error);
    if (msg.includes("Redéploie")) return null;
    throw error;
  }
  if (error) throw error;
  if (data?.error) throw new Error(mapRateLimitMessage(data.error));
  return data?.agent_id?.trim() || null;
}

export type OnboardingDrivePreviewFileMeta = {
  id: string;
  relativePath: string;
  name: string;
};

export type OnboardingDrivePreviewFile = OnboardingDrivePreviewFileMeta & {
  char_count: number;
  preview: string;
  truncated: boolean;
  error?: string;
};

type PreviewPackResponse = {
  ok?: boolean;
  edge_stamp?: string;
  folder_name?: string;
  files?: (OnboardingDrivePreviewFileMeta & Partial<OnboardingDrivePreviewFile>)[];
  file?: OnboardingDrivePreviewFile;
  error?: string;
};

type PreviewInvokeOptions = {
  embedPreviews?: boolean;
};

async function invokePreviewPack(
  driveFolderId: string,
  opts?: PreviewInvokeOptions,
): Promise<PreviewPackResponse> {
  const { data, error } = await supabase.functions.invoke<PreviewPackResponse>(PREVIEW_FN, {
    body: {
      action: "preview_onboarding_pack",
      drive_folder_id: driveFolderId,
      ...(opts?.embedPreviews ? { embed_previews: true } : {}),
    },
  });
  if (error instanceof FunctionsHttpError) {
    throw new Error(await readEdgeFunctionError(error));
  }
  if (error) throw error;
  if (data?.error) throw new Error(mapRateLimitMessage(data.error));
  return data ?? {};
}

export async function previewOnboardingDrivePack(
  driveFolderId: string,
  opts?: { embedPreviews?: boolean },
): Promise<{
  folder_name?: string;
  files?: (OnboardingDrivePreviewFileMeta | OnboardingDrivePreviewFile)[];
  edge_stamp?: string;
  edge_ok?: boolean;
}> {
  const data = await invokePreviewPack(driveFolderId, opts);
  const edge_ok = isKnownStamp(data.edge_stamp);
  const hasEmbedded =
    Boolean(opts?.embedPreviews) &&
    (data.files?.some((f) => typeof f.preview === "string" && f.preview.trim().length > 0) ?? false);

  if (opts?.embedPreviews && !hasEmbedded && !data.file && (data.files?.length ?? 0) > 0 && !edge_ok) {
    return {
      ...data,
      edge_ok: false,
      files: data.files,
    };
  }

  return { ...data, edge_ok: edge_ok || hasEmbedded };
}

export function fileHasEmbeddedPreview(
  f: OnboardingDrivePreviewFileMeta | OnboardingDrivePreviewFile,
): f is OnboardingDrivePreviewFile {
  return "preview" in f && typeof f.preview === "string" && f.preview.trim().length > 0;
}