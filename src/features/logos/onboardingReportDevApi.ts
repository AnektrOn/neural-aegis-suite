import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export async function readEdgeFunctionError(error: FunctionsHttpError): Promise<string> {
  let detail = error.message;
  try {
    const ctx = (await error.context.json()) as { error?: string } | null;
    if (ctx?.error) detail = String(ctx.error);
  } catch {
    /* ignore */
  }
  if (detail === "Action inconnue") {
    return "Fonction Edge non à jour — sauvegarde elevenlabs-knowledge/index.ts sur Lovable (stamp 2026-11-25e, preview_onboarding_pack + drive_file_id).";
  }
  if (detail.includes("non-2xx")) {
    return "Fonction Edge non à jour ou erreur serveur — redéploie elevenlabs-knowledge.";
  }
  return detail;
}

export async function fetchOnboardingReportAgentId(): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke<{ agent_id?: string | null; error?: string }>(
    "elevenlabs-knowledge",
    { body: { action: "onboarding_report_status" } },
  );
  if (error instanceof FunctionsHttpError) {
    if ((await readEdgeFunctionError(error)).includes("non à jour")) return null;
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
};

export const ONBOARDING_PREVIEW_EDGE_STAMP = "2026-11-25e";

export async function previewOnboardingDrivePack(driveFolderId: string): Promise<{
  folder_name?: string;
  files?: OnboardingDrivePreviewFileMeta[];
  edge_stamp?: string;
}> {
  return invokeOnboardingPreviewPack(driveFolderId);
}

type PreviewPackResponse = {
  ok?: boolean;
  edge_stamp?: string;
  folder_name?: string;
  files?: (OnboardingDrivePreviewFileMeta & Partial<OnboardingDrivePreviewFile>)[];
  file?: OnboardingDrivePreviewFile;
  error?: string;
};

async function invokeOnboardingPreviewPack(
  driveFolderId: string,
  driveFileId?: string,
): Promise<PreviewPackResponse> {
  const { data, error } = await supabase.functions.invoke<PreviewPackResponse>("elevenlabs-knowledge", {
    body: {
      action: "preview_onboarding_pack",
      drive_folder_id: driveFolderId,
      ...(driveFileId ? { drive_file_id: driveFileId } : {}),
    },
  });
  if (error instanceof FunctionsHttpError) {
    throw new Error(await readEdgeFunctionError(error));
  }
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}

function legacyEmbeddedFile(
  files: PreviewPackResponse["files"],
  driveFileId: string,
): OnboardingDrivePreviewFile | null {
  const hit = files?.find((f) => f.id === driveFileId);
  if (!hit?.preview?.trim()) return null;
  return {
    id: hit.id,
    name: hit.name,
    relativePath: hit.relativePath,
    char_count: hit.char_count ?? hit.preview.length,
    preview: hit.preview,
    truncated: Boolean(hit.truncated),
  };
}

export async function fetchOnboardingDriveFilePreview(
  driveFolderId: string,
  driveFileId: string,
): Promise<OnboardingDrivePreviewFile> {
  const data = await invokeOnboardingPreviewPack(driveFolderId, driveFileId);
  if (data.file) return data.file;

  const legacy = legacyEmbeddedFile(data.files, driveFileId);
  if (legacy) return legacy;

  if (data.files?.length) {
    throw new Error(
      `Edge Lovable pas à jour (attendu stamp ${ONBOARDING_PREVIEW_EDGE_STAMP}) — sauvegarde supabase/functions/elevenlabs-knowledge/index.ts pour activer drive_file_id sur preview_onboarding_pack.`,
    );
  }

  throw new Error("Réponse sans contenu fichier");
}