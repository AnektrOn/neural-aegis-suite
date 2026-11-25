import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Déjà listée dans Supabase — redéployer après sauvegarde index.ts sur Lovable. */
const PRIMARY_PREVIEW_FN = "agent-session";
export const AGENT_SESSION_ONBOARDING_PREVIEW_STAMP = "agent-session-onboarding-preview-1";
const OPTIONAL_PREVIEW_FN = "onboarding-pack-preview";
export const ONBOARDING_PACK_PREVIEW_STAMP = "onboarding-pack-preview-1";
/** Legacy stamp on elevenlabs-knowledge (fallback). */
export const ONBOARDING_PREVIEW_EDGE_STAMP = "2026-11-25e";

export const EXPECTED_EDGE_STAMPS = [
  AGENT_SESSION_ONBOARDING_PREVIEW_STAMP,
  ONBOARDING_PACK_PREVIEW_STAMP,
  ONBOARDING_PREVIEW_EDGE_STAMP,
] as const;

export async function readEdgeFunctionError(error: FunctionsHttpError): Promise<string> {
  let detail = error.message;
  try {
    const ctx = (await error.context.json()) as { error?: string } | null;
    if (ctx?.error) detail = String(ctx.error);
  } catch {
    /* ignore */
  }
  if (detail === "Action inconnue") {
    return `Redéploie la fonction Edge « ${PRIMARY_PREVIEW_FN} » (Lovable : sauvegarde supabase/functions/agent-session/index.ts, stamp 2026-11-25f). Git push seul ne met pas à jour les fonctions.`;
  }
  if (detail.includes("non-2xx")) {
    return `Fonction Edge « ${PRIMARY_PREVIEW_FN} » absente ou erreur serveur — redéploie sur Supabase.`;
  }
  return detail;
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
    if (msg.includes("Redéploie") || msg.includes("absente")) return null;
    throw error;
  }
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
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
  driveFileId?: string;
};

async function invokePreviewFunction(
  functionName: string,
  driveFolderId: string,
  opts?: PreviewInvokeOptions,
): Promise<PreviewPackResponse> {
  const { data, error } = await supabase.functions.invoke<PreviewPackResponse>(functionName, {
    body: {
      action: "preview_onboarding_pack",
      drive_folder_id: driveFolderId,
      ...(opts?.embedPreviews ? { embed_previews: true } : {}),
      ...(opts?.driveFileId ? { drive_file_id: opts.driveFileId } : {}),
    },
  });
  if (error instanceof FunctionsHttpError) {
    throw new Error(await readEdgeFunctionError(error));
  }
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}

function isMissingFunctionError(msg: string): boolean {
  return (
    msg.includes("Failed to send") ||
    msg.includes("not found") ||
    msg.includes("404") ||
    msg.includes("non-2xx") ||
    msg.includes("Redéploie") ||
    msg.includes("absente")
  );
}

function stillLegacyListResponse(data: PreviewPackResponse, opts?: PreviewInvokeOptions): boolean {
  if (data.file) return false;
  if (!data.files?.length) return false;
  if (opts?.embedPreviews) {
    return !data.files.some((f) => typeof f.preview === "string" && f.preview.trim().length > 0);
  }
  if (opts?.driveFileId) {
    return !data.files.some((f) => f.id === opts.driveFileId && f.preview?.trim());
  }
  return false;
}

async function invokeOnboardingPreviewPack(
  driveFolderId: string,
  opts?: PreviewInvokeOptions,
): Promise<PreviewPackResponse> {
  const order = [PRIMARY_PREVIEW_FN, OPTIONAL_PREVIEW_FN, "elevenlabs-knowledge"];
  let lastErr: Error | null = null;

  for (const fn of order) {
    try {
      const data = await invokePreviewFunction(fn, driveFolderId, opts);
      if (isKnownStamp(data.edge_stamp)) return data;
      if (!stillLegacyListResponse(data, opts)) return data;
      lastErr = new Error(
        `« ${fn} » sans contenu (stamp ${data.edge_stamp ?? "?"}) — redéploie ${PRIMARY_PREVIEW_FN}.`,
      );
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      lastErr = err;
      if (!isMissingFunctionError(err.message)) throw err;
    }
  }

  throw (
    lastErr ??
    new Error(
      `Redéploie « ${PRIMARY_PREVIEW_FN} » (stamp ${AGENT_SESSION_ONBOARDING_PREVIEW_STAMP}) sur Supabase / Lovable.`,
    )
  );
}

function normalizeEmbeddedFile(
  hit: OnboardingDrivePreviewFileMeta & Partial<OnboardingDrivePreviewFile>,
): OnboardingDrivePreviewFile | null {
  if (!hit.preview?.trim()) return null;
  return {
    id: hit.id,
    name: hit.name,
    relativePath: hit.relativePath,
    char_count: hit.char_count ?? hit.preview.length,
    preview: hit.preview,
    truncated: Boolean(hit.truncated),
    error: hit.error,
  };
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
  const data = await invokeOnboardingPreviewPack(driveFolderId, {
    embedPreviews: opts?.embedPreviews,
  });
  const edge_ok = isKnownStamp(data.edge_stamp);
  return { ...data, edge_ok };
}

export async function fetchOnboardingDriveFilePreview(
  driveFolderId: string,
  driveFileId: string,
): Promise<OnboardingDrivePreviewFile> {
  const data = await invokeOnboardingPreviewPack(driveFolderId, { driveFileId });
  if (data.file) return data.file;

  const legacy = data.files?.find((f) => f.id === driveFileId);
  const embedded = legacy ? normalizeEmbeddedFile(legacy) : null;
  if (embedded) return embedded;

  throw new Error(
    `Redéploie « ${PRIMARY_PREVIEW_FN} » (attendu stamp ${AGENT_SESSION_ONBOARDING_PREVIEW_STAMP}). Git push ne déploie pas les Edge Functions.`,
  );
}

export function fileHasEmbeddedPreview(
  f: OnboardingDrivePreviewFileMeta | OnboardingDrivePreviewFile,
): f is OnboardingDrivePreviewFile {
  return "preview" in f && typeof f.preview === "string" && f.preview.trim().length > 0;
}